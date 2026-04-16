<?php
session_start();
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$login = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if (empty($login) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Preencha usuário/email e senha']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?");
$stmt->execute([$login, $login]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    echo json_encode(['success' => true, 'message' => 'Login bem-sucedido', 'username' => $user['username']]);
} else {
    echo json_encode(['success' => false, 'message' => 'Usuário ou senha incorretos']);
}
?>