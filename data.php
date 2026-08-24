<?php
// Общее хранилище данных панели: ТОП, скрины, проекты, время выхода
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$file = dirname(__FILE__) . '/data.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = array();

    // Читаем предыдущие значения, чтобы обновлять только переданные поля
    $prev = array('top' => '', 'screens' => array(null, null, null), 'projects' => array(), 'shift_time' => '');
    if (is_file($file)) {
        $prevData = json_decode(file_get_contents($file), true);
        if (is_array($prevData)) $prev = array_merge($prev, $prevData);
    }

    $payload = array(
        'top' => isset($input['top']) ? $input['top'] : (isset($prev['top']) ? $prev['top'] : ''),
        'screens' => isset($prev['screens']) && is_array($prev['screens']) ? $prev['screens'] : array(null, null, null),
        'projects' => isset($prev['projects']) && is_array($prev['projects']) ? $prev['projects'] : array(),
        'shift_time' => isset($input['shift_time']) ? $input['shift_time'] : (isset($prev['shift_time']) ? $prev['shift_time'] : '')
    );

    if (isset($input['screens']) && is_array($input['screens'])) {
        $payload['screens'] = array();
        foreach ($input['screens'] as $s) {
            $payload['screens'][] = is_string($s) ? $s : null;
        }
    }
    while (count($payload['screens']) < 3) $payload['screens'][] = null;

    if (isset($input['projects']) && is_array($input['projects'])) {
        foreach (array('wink', 'vizhu', 'start', 'edinaya', 'kasper') as $k) {
            $payload['projects'][$k] = !empty($input['projects'][$k]);
        }
    }

    $ok = @file_put_contents($file, json_encode($payload, JSON_UNESCAPED_UNICODE), LOCK_EX);
    if ($ok === false) {
        $err = error_get_last();
        echo json_encode(array('ok' => false, 'err' => isset($err['message']) ? $err['message'] : 'Ошибка записи data.json (права?)'));
        exit;
    }
    echo json_encode(array('ok' => true));
    exit;
}

// GET — отдаём данные, или пустышки, если файла ещё нет
$default = array(
    'top' => '',
    'screens' => array(null, null, null),
    'projects' => array('wink' => true, 'vizhu' => true, 'start' => false, 'edinaya' => true, 'kasper' => false),
    'shift_time' => '08:00'
);

if (!is_file($file)) {
    echo json_encode($default, JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode(file_get_contents($file), true);
if (!is_array($data)) $data = array();

$result = array(
    'top' => isset($data['top']) ? $data['top'] : '',
    'screens' => isset($data['screens']) && is_array($data['screens']) ? $data['screens'] : array(null, null, null),
    'projects' => isset($data['projects']) && is_array($data['projects']) ? $data['projects'] : $default['projects'],
    'shift_time' => isset($data['shift_time']) ? $data['shift_time'] : '08:00'
);
while (count($result['screens']) < 3) $result['screens'][] = null;

echo json_encode($result, JSON_UNESCAPED_UNICODE);