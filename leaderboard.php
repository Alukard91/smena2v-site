<?php
// ============================================================
// ТАБЛИЦА ЛИДЕРОВ ИГР (бегет, PHP 5.6)
// GET  ?action=get&game=runner        -> JSON топ-10 [{name, score}]
// GET  ?action=start&game=runner      -> JSON {token} одноразовый токен игры
// POST action=save&token=...&name=...&score=...&game=... -> сохранить результат
// ============================================================
$file = 'leaderboard.json';
$tokenFile = 'leaderboard_tokens.json';

function lb_read() {
    global $file;
    if (!file_exists($file)) return array();
    $raw = trim(file_get_contents($file));
    if ($raw === '') return array();
    $arr = json_decode($raw, true);
    return is_array($arr) ? $arr : array();
}

function lb_write($arr) {
    global $file;
    file_put_contents($file, json_encode($arr));
}

function lb_tokens_read() {
    global $tokenFile;
    if (!file_exists($tokenFile)) return array();
    $raw = trim(file_get_contents($tokenFile));
    if ($raw === '') return array();
    $arr = json_decode($raw, true);
    return is_array($arr) ? $arr : array();
}

function lb_tokens_write($arr) {
    global $tokenFile;
    file_put_contents($tokenFile, json_encode($arr));
}

// Разумные потолки: абсолютный максимум очков на игру (защита от откровенной накрутки)
function lb_abs_max($game) {
    $limits = array(
        'runner' => 100000,
        'doom' => 200000,
        'darkroom' => 5000000,
        'factory' => 5000000,
        'clicker' => 100000000
    );
    return isset($limits[$game]) ? $limits[$game] : 100000;
}

// Проверка, что токен валиден (одноразовый, срок жизни 2 часа)
function lb_check_token($token, $game) {
    if ($token === '') return false;
    $tokens = lb_tokens_read();
    if (!isset($tokens[$token])) return false;
    $t = $tokens[$token];
    // Срок жизни токена: 2 часа
    if (time() - intval($t['created']) > 7200) {
        unset($tokens[$token]);
        lb_tokens_write($tokens);
        return false;
    }
    if ($t['game'] !== $game) return false;
    if ($t['used'] === true) return false;
    // Помечаем токен использованным сразу, чтобы нельзя было сохранить дважды
    $tokens[$token]['used'] = true;
    lb_tokens_write($tokens);
    return true;
}

// Генерация случайного токена (PHP 5.6 compatible)
function lb_rand_token() {
    if (function_exists('openssl_random_pseudo_bytes')) {
        return bin2hex(openssl_random_pseudo_bytes(16));
    }
    $out = '';
    for ($i = 0; $i < 32; $i++) $out .= sprintf('%02x', mt_rand(0, 255));
    return $out;
}

// Получить топ для конкретной игры
if (isset($_GET['action']) && $_GET['action'] === 'get') {
    header('Content-Type: application/json; charset=utf-8');
    $game = isset($_GET['game']) ? preg_replace('/[^a-z]/i', '', $_GET['game']) : 'runner';
    $arr = array();
    foreach (lb_read() as $row) {
        if (isset($row['game']) && $row['game'] === $game) $arr[] = $row;
    }
    usort($arr, function ($a, $b) { return $b['score'] - $a['score']; });
    echo json_encode(array_slice($arr, 0, 10));
    exit;
}

// Выдать токен на игру
if (isset($_GET['action']) && $_GET['action'] === 'start') {
    header('Content-Type: application/json; charset=utf-8');
    $game = isset($_GET['game']) ? preg_replace('/[^a-z]/i', '', $_GET['game']) : 'runner';
    if (!in_array($game, array('runner', 'doom', 'darkroom', 'factory', 'clicker'))) $game = 'runner';
    $token = lb_rand_token();
    $tokens = lb_tokens_read();
    // Очищаем старые токены
    foreach ($tokens as $k => $v) {
        if (time() - intval($v['created']) > 7200) unset($tokens[$k]);
    }
    $tokens[$token] = array('game' => $game, 'created' => time(), 'used' => false);
    lb_tokens_write($tokens);
    echo json_encode(array('status' => 'ok', 'token' => $token));
    exit;
}

// Очистить таблицу лидеров (только админ)
if (isset($_POST['action']) && $_POST['action'] === 'clear') {
    header('Content-Type: application/json; charset=utf-8');
    $pass = isset($_POST['pass']) ? $_POST['pass'] : '';
    if ($pass !== '2517') {
        echo json_encode(array('status' => 'error', 'message' => 'Недостаточно прав'));
        exit;
    }
    lb_write(array());
    echo json_encode(array('status' => 'ok'));
    exit;
}

// Сохранить результат
if (isset($_POST['action']) && $_POST['action'] === 'save') {
    header('Content-Type: application/json; charset=utf-8');
    $name = isset($_POST['name']) ? trim(mb_substr($_POST['name'], 0, 20)) : '';
    $score = isset($_POST['score']) ? intval($_POST['score']) : 0;
    $game = isset($_POST['game']) ? preg_replace('/[^a-z]/i', '', $_POST['game']) : 'runner';
    $token = isset($_POST['token']) ? preg_replace('/[^a-f0-9]/', '', $_POST['token']) : '';

    if ($name === '' || $score <= 0) {
        echo json_encode(array('status' => 'error', 'message' => 'Пустое имя или очки'));
        exit;
    }
    if (!in_array($game, array('runner', 'doom', 'darkroom', 'factory', 'clicker'))) {
        echo json_encode(array('status' => 'error', 'message' => 'Неизвестная игра'));
        exit;
    }
    // Токен обязателен — нельзя просто так POST-нуть рекорд из консоли
    if (!lb_check_token($token, $game)) {
        echo json_encode(array('status' => 'error', 'message' => 'Невалидный токен'));
        exit;
    }
    // Потолок очков (защита от накрутки через командную строку)
    if ($score > lb_abs_max($game)) {
        echo json_encode(array('status' => 'error', 'message' => 'Подозрительно высокие очки'));
        exit;
    }

    $arr = lb_read();
    // Дедупликация: для того же игрока и игры храним только лучший результат
    $found = false;
    foreach ($arr as $i => $row) {
        if (isset($row['name']) && $row['name'] === $name && isset($row['game']) && $row['game'] === $game) {
            $found = true;
            if ($score > intval($row['score'])) {
                $arr[$i]['score'] = $score;
                lb_write($arr);
            }
            break;
        }
    }
    if (!$found) {
        $arr[] = array('name' => $name, 'score' => $score, 'game' => $game);
        lb_write($arr);
    }
    echo json_encode(array('status' => 'ok'));
    exit;
}

echo json_encode(array('status' => 'error', 'message' => 'Неизвестный запрос'));
?>