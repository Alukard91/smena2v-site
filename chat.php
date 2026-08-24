<?php
$file = 'chat_messages.json';

if ($_GET['action'] === 'get') {
    if (file_exists($file)) {
        $messages = json_decode(file_get_contents($file), true);
        if (!is_array($messages)) $messages = [];
    } else {
        $messages = [];
    }
    echo json_encode(['status' => 'ok', 'messages' => $messages]);
    exit;
}

if ($_POST['action'] === 'send') {
    $name = isset($_POST['name']) ? trim($_POST['name']) : 'Сотрудник';
    $text = isset($_POST['text']) ? trim($_POST['text']) : '';
    // time: принимаем только корректное время HH:MM (или H:MM), иначе подставляем серверное
    $time = isset($_POST['time']) ? trim($_POST['time']) : date('H:i');
    if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $time)) {
        $time = date('H:i');
    }
    
    if (empty($text)) {
        echo json_encode(['status' => 'error', 'message' => 'Текст сообщения пуст']);
        exit;
    }
    
    // Ограничение длины, чтобы не засорять чат гигантскими сообщениями
    $name = mb_substr($name, 0, 20);
    $text = mb_substr($text, 0, 500);
    
    if (file_exists($file)) {
        $messages = json_decode(file_get_contents($file), true);
        if (!is_array($messages)) $messages = [];
    } else {
        $messages = [];
    }
    
    $messages[] = [
        'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
        'text' => htmlspecialchars($text, ENT_QUOTES, 'UTF-8'),
        'time' => $time,
        'timestamp' => time()
    ];
    
    if (count($messages) > 200) {
        $messages = array_slice($messages, -200);
    }
    
    file_put_contents($file, json_encode($messages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['status' => 'ok']);
    exit;
}

if ($_POST['action'] === 'delete') {
    // Авторизация администратора на сервере
    $pass = isset($_POST['pass']) ? $_POST['pass'] : '';
    if ($pass !== '2517') {
        echo json_encode(['status' => 'error', 'message' => 'Недостаточно прав']);
        exit;
    }
    $index = isset($_POST['index']) ? intval($_POST['index']) : -1;
    if ($index < 0 || !file_exists($file)) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка']);
        exit;
    }
    $messages = json_decode(file_get_contents($file), true);
    if (!is_array($messages)) $messages = [];
    if ($index >= count($messages)) {
        echo json_encode(['status' => 'error', 'message' => 'Сообщение не найдено']);
        exit;
    }
    array_splice($messages, $index, 1);
    file_put_contents($file, json_encode($messages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['status' => 'ok']);
    exit;
}

if ($_POST['action'] === 'clear_all') {
    $pass = isset($_POST['pass']) ? $_POST['pass'] : '';
    if ($pass !== '2517') {
        echo json_encode(['status' => 'error', 'message' => 'Недостаточно прав']);
        exit;
    }
    file_put_contents($file, json_encode([]));
    echo json_encode(['status' => 'ok']);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Неизвестный запрос']);
?>