<?php
$file = 'news_content.html';
$uploadDir = 'uploads/';
// Пароль администратора (совпадает с паролем админки в index.html)
define('ADMIN_PASS', '2517');

// Создаём папку для картинок если её нет
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Получить новости (публичный доступ)
if ($_GET['action'] === 'get') {
    if (file_exists($file)) {
        echo file_get_contents($file);
    }
    exit;
}

// Общая проверка авторизации для операций записи
function checkAdmin() {
    $pass = isset($_POST['pass']) ? $_POST['pass'] : '';
    return $pass === ADMIN_PASS;
}

// Сохранить новости
if ($_POST['action'] === 'save') {
    if (!checkAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Недостаточно прав']);
        exit;
    }
    $content = isset($_POST['content']) ? $_POST['content'] : '';
    // Только админ сохраняет, поэтому innerHTML допускается (в админке вставляются свои картинки)
    file_put_contents($file, $content);
    echo json_encode(['status' => 'ok']);
    exit;
}

// Загрузить картинку
if ($_POST['action'] === 'upload') {
    if (!checkAdmin()) {
        echo json_encode(['status' => 'error', 'message' => 'Недостаточно прав']);
        exit;
    }
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['status' => 'error', 'message' => 'Ошибка загрузки файла']);
        exit;
    }
    
    // 1) Проверка расширения
    $fileInfo = pathinfo($_FILES['image']['name']);
    $ext = strtolower($fileInfo['extension']);
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!in_array($ext, $allowed)) {
        echo json_encode(['status' => 'error', 'message' => 'Неподдерживаемый формат']);
        exit;
    }
    
    // 2) Проверка MIME через getimagesize (файл должен быть настоящей картинкой)
    $sizeInfo = @getimagesize($_FILES['image']['tmp_name']);
    if ($sizeInfo === false) {
        echo json_encode(['status' => 'error', 'message' => 'Файл не является изображением']);
        exit;
    }
    $mime = strtolower($sizeInfo['mime']);
    $allowedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($mime, $allowedMime)) {
        echo json_encode(['status' => 'error', 'message' => 'Неверный тип изображения']);
        exit;
    }
    
    // 3) Ограничение размера (например 5 МБ)
    if ($_FILES['image']['size'] > 5 * 1024 * 1024) {
        echo json_encode(['status' => 'error', 'message' => 'Файл слишком большой']);
        exit;
    }
    
    // Соответствие расширения MIME: защита от обмана через двойное расширение
    $mimeExt = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
    $ext = $mimeExt[$mime];
    
    $filename = time() . '_' . md5(uniqid('', true)) . '.' . $ext;
    $path = $uploadDir . $filename;
    
    if (move_uploaded_file($_FILES['image']['tmp_name'], $path)) {
        echo json_encode(['status' => 'ok', 'url' => $path]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Не удалось сохранить файл']);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Неизвестный запрос']);
?>