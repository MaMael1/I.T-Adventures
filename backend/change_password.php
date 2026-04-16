<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$currentPassword = $data['currentPassword'] ?? '';
$newPassword = $data['newPassword'] ?? '';

if (empty($currentPassword) || empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'Preencha todos os campos']);
    exit;
}

$userId = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Senha atual incorreta']);
    exit;
}

$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
$update = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
if ($update->execute([$newHash, $userId])) {
    echo json_encode(['success' => true, 'message' => 'Senha alterada com sucesso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao alterar senha']);
}
?>