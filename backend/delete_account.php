<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$password = $data['password'] ?? '';

if (empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Digite sua senha para confirmar']);
    exit;
}

$userId = $_SESSION['user_id'];

// Verifica a senha
$stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Senha incorreta']);
    exit;
}

// Deleta os saves primeiro (evita órfãos)
$deleteSaves = $pdo->prepare("DELETE FROM game_saves WHERE user_id = ?");
$deleteSaves->execute([$userId]);

// Deleta o usuário
$deleteUser = $pdo->prepare("DELETE FROM users WHERE id = ?");
if ($deleteUser->execute([$userId])) {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Conta e todos os dados deletados com sucesso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao deletar conta']);
}
?>