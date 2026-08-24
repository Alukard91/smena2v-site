<?php
// ============================================================
// ТГ-БОТ ДЛЯ ПАНЕЛИ СМЕНЫ
// Работает по cron на бегете: запускается раз в минуту,
// обрабатывает все новые сообщения и выходит.
// ============================================================

$TOKEN = '8883375460:AAH_9EV3opTpMRyB28DUp6YXuxoBM1l3yIU';

// Время ежедневного вопроса (0-23:минуты). По умолчанию 19:00
$ASK_HOUR = 19;
$ASK_MIN  = 0;

date_default_timezone_set('Europe/Moscow');

// ============================================================
// ДИАГНОСТИКА: откройте .../tg_bot.php?debug=1 и посмотрите ответ
// ============================================================
if (isset($_GET['debug'])) {
    header('Content-Type: text/plain; charset=utf-8');
    $ch = curl_init($API . '/getMe');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 25);
    $res = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    echo "PHP версия: ", PHP_VERSION, "\n";
    echo "Ответ Telegram (сырой): [", $res, "]\n";
    echo "Ошибка curl: [", $err, "]\n";
    echo "TLS: ", defined('OPENSSL_VERSION_TEXT') ? OPENSSL_VERSION_TEXT : 'нет OpenSSL', "\n";
    exit;
}

$API = 'https://api.telegram.org/bot' . $TOKEN;
$offsetFile = 'bot_offset.txt';
$adminsFile = 'bot_admins.txt';
$shiftFile  = 'shift_time.txt';
$lastAskFile = 'bot_last_ask.txt';

function tgApi($method, $params = []) {
    global $API;
    $ch = curl_init($API . '/' . $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
    curl_setopt($ch, CURLOPT_TIMEOUT, 25);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

function loadAdmins() {
    global $adminsFile;
    if (!file_exists($adminsFile)) return [];
    $admins = [];
    foreach (explode("\n", trim(file_get_contents($adminsFile))) as $line) {
        $id = (int)trim($line);
        if ($id > 0) $admins[] = $id;
    }
    return $admins;
}

function saveAdmin($id) {
    global $adminsFile;
    $admins = loadAdmins();
    if (!in_array($id, $admins)) {
        $admins[] = $id;
        file_put_contents($adminsFile, implode("\n", $admins));
    }
}

// ЕЖЕДНЕВНЫЙ ВОПРОС О ВРЕМЕНИ ВЫХОДА
$todayKey = date('Y-m-d');
$nowMin = (int)date('H') * 60 + (int)date('i');
$askMinTotal = $ASK_HOUR * 60 + $ASK_MIN;

if (@file_get_contents($lastAskFile) !== $todayKey && $nowMin >= $askMinTotal) {
    $tomorrow = date('d.m', strtotime('+1 day'));
    foreach (loadAdmins() as $adminId) {
        tgApi('sendMessage', [
            'chat_id' => $adminId,
            'text' => "⏰ Привет! Во сколько завтра ($tomorrow) выходим на смену?\nНапишите время, например 08:00, или /clear — если завтра выходной."
        ]);
    }
    file_put_contents($lastAskFile, $todayKey);
}

// Обрабатываем накопленные сообщения (без зацикливания — для cron)
$offset = (int)@file_get_contents($offsetFile);
$updates = tgApi('getUpdates', ['offset' => $offset, 'timeout' => 0, 'limit' => 10]);

if (isset($updates['ok']) && $updates['ok'] && !empty($updates['result'])) {
    foreach ($updates['result'] as $upd) {
        $newOffset = (int)$upd['update_id'] + 1;
        if ($newOffset > $offset) {
            $offset = $newOffset;
            file_put_contents($offsetFile, $offset);
        }

        if (!isset($upd['message']['text'])) continue;
        $chatId = $upd['message']['chat']['id'];
        $text = trim($upd['message']['text']);

        // Команда "спросить сейчас" (для теста)
        if (preg_match('/^\/ask$/i', $text)) {
            if (in_array($chatId, loadAdmins())) {
                tgApi('sendMessage', [
                    'chat_id' => $chatId,
                    'text' => "⏰ Во сколько завтра выходим на смену? Напишите время, например 08:00, или /clear."
                ]);
            }
            continue;
        }

        // Команда администратора: /time 08:00 или просто 08:00
        $m = null;
        if (preg_match('/^(?:\/time\s+)?(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/i', $text, $m)) {
            if (!in_array($chatId, loadAdmins())) {
                tgApi('sendMessage', ['chat_id' => $chatId, 'text' => '⛔ У вас нет прав администратора']);
                continue;
            }
            $time = $m[1] . ':' . $m[2];
            file_put_contents($shiftFile, $time);
            tgApi('sendMessage', ['chat_id' => $chatId, 'text' => "✅ Время выхода установлено: $time\nПанель обновится автоматически у всех."]);
            continue;
        }

        // Сброс времени
        if (preg_match('/^(?:\/clear|\/сброс|\/нет|\/убрать)$/i', $text)) {
            if (!in_array($chatId, loadAdmins())) {
                tgApi('sendMessage', ['chat_id' => $chatId, 'text' => '⛔ У вас нет прав администратора']);
                continue;
            }
            file_put_contents($shiftFile, '');
            tgApi('sendMessage', ['chat_id' => $chatId, 'text' => "✅ Время выхода убрано — панель покажет «Время не назначено»."]);
            continue;
        }

        // Активация администратора по паролю (совпадает с паролем админки)
        if ($text === '2517') {
            saveAdmin($chatId);
            tgApi('sendMessage', ['chat_id' => $chatId, 'text' => '✅ Вы активированы как администратор бота! Пишите время выхода, например: 08:00']);
            continue;
        }

        tgApi('sendMessage', ['chat_id' => $chatId, 'text' => "ℹ️ Не понял команду. Напишите время, например 08:00, или /clear чтобы убрать."]);
    }
}
?>
