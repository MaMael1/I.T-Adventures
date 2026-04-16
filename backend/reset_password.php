<?php
session_start();
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$newPassword = $data['newPassword'] ?? '';

if (empty($email) || empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'Preencha o e-mail e a nova senha']);
    exit;
}

// Verifica se o e-mail existe
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'E-mail não encontrado']);
    exit;
}

// Atualiza a senha
$hash = password_hash($newPassword, PASSWORD_DEFAULT);
$update = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
if ($update->execute([$hash, $email])) {
    echo json_encode(['success' => true, 'message' => 'Senha redefinida com sucesso! Faça login com a nova senha.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao redefinir senha']);
}
?>