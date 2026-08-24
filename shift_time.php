<?php
$file = 'shift_time.txt';

// Получить текущее время выхода: {time, date}
if (isset($_GET['action']) && $_GET['action'] === 'get') {
    $raw = trim(file_exists($file) ? file_get_contents($file) : '');
    if ($raw === '') {
        echo json_encode(['time' => '', 'date' => '']);
        exit;
    }
    if ($raw[0] === '{') {
        echo $raw;
        exit;
    }
    // старый формат — просто время без даты
    echo json_encode(['time' => $raw, 'date' => '']);
    exit;
}

// Сохранить время выхода (пишут админка и ТГ-бот)
if (isset($_POST['action']) && $_POST['action'] === 'set') {
    $time = isset($_POST['time']) ? trim($_POST['time']) : '';
    $date = isset($_POST['date']) ? trim($_POST['date']) : '';
    if ($time !== '' && !preg_match('/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/', $time)) {
        echo json_encode(['status' => 'error', 'message' => 'Неверный формат времени']);
        exit;
    }
    if ($date !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        $date = '';
    }
    file_put_contents($file, json_encode(['time' => $time, 'date' => $date]));
    echo json_encode(['status' => 'ok', 'time' => $time, 'date' => $date]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Неизвестный запрос']);
?>
