<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($username) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Preencha todos os campos']);
    exit;
}

// Verifica se usuário ou email já existe
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$stmt->execute([$username, $email]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Usuário ou email já cadastrado']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
if ($stmt->execute([$username, $email, $hash])) {
    echo json_encode(['success' => true, 'message' => 'Cadastro realizado com sucesso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar']);
}
?>