<?php
session_start();
require_once 'config.php';

// Habilita exibição de erros (remova depois)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verifica autenticação
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autenticado - sessão não encontrada']);
    exit;
}

$userId = $_SESSION['user_id'];

// Obtém os dados enviados
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos', 'raw_input' => $input]);
    exit;
}

// Prepara os valores para as colunas (valores padrão se não existirem)
$money = $data['money'] ?? 0;
$totalMoneyEarned = $data['totalMoneyEarned'] ?? 0;
$prestigeProgress = $data['prestigeProgress'] ?? 0;
$totalPrestigeEarned = $data['totalPrestigeEarned'] ?? 0;
$prestigePoints = $data['prestigePoints'] ?? 0;
$totalBarCompletions = $data['totalBarCompletions'] ?? 0;
$pendingPrestigePoints = $data['pendingPrestigePoints'] ?? 0;
$prestigeUnlocked = isset($data['prestigeUnlocked']) ? (int)$data['prestigeUnlocked'] : 0;

// Converte objetos complexos para JSON
$linguagensData = isset($data['linguagensData']) ? json_encode($data['linguagensData']) : '{}';
$upgradesData = isset($data['upgradesData']) ? json_encode($data['upgradesData']) : '{}';
$lingUpgradesData = isset($data['lingUpgradesData']) ? json_encode($data['lingUpgradesData']) : '{}';
$prestigeUpgradesData = isset($data['prestigeUpgradesData']) ? json_encode($data['prestigeUpgradesData']) : '{}';

// Query INSERT OR REPLACE
$sql = "INSERT OR REPLACE INTO game_saves (
    user_id, money, totalMoneyEarned, prestigeProgress, totalPrestigeEarned,
    prestigePoints, totalBarCompletions, pendingPrestigePoints, prestigeUnlocked,
    linguagensData, upgradesData, lingUpgradesData, prestigeUpgradesData, last_online
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";

$stmt = $pdo->prepare($sql);
$result = $stmt->execute([
    $userId, $money, $totalMoneyEarned, $prestigeProgress, $totalPrestigeEarned,
    $prestigePoints, $totalBarCompletions, $pendingPrestigePoints, $prestigeUnlocked,
    $linguagensData, $upgradesData, $lingUpgradesData, $prestigeUpgradesData
]);

if ($result) {
    echo json_encode(['success' => true, 'message' => 'Progresso salvo com sucesso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao executar a query', 'error_info' => $stmt->errorInfo()]);
}
?>