<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT 
    money,
    totalMoneyEarned,
    prestigeProgress,
    totalPrestigeEarned,
    prestigePoints,
    totalBarCompletions,
    pendingPrestigePoints,
    prestigeUnlocked,
    linguagensData,
    upgradesData,
    lingUpgradesData,
    prestigeUpgradesData
FROM game_saves WHERE user_id = ?");
$stmt->execute([$userId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row) {
    // Decodificar os campos JSON
    $row['linguagensData'] = json_decode($row['linguagensData'], true);
    $row['upgradesData'] = json_decode($row['upgradesData'], true);
    $row['lingUpgradesData'] = json_decode($row['lingUpgradesData'], true);
    $row['prestigeUpgradesData'] = json_decode($row['prestigeUpgradesData'], true);
    $row['prestigeUnlocked'] = (bool)$row['prestigeUnlocked'];
    $row['totalPrestigeEarned'] = (int)$row['totalPrestigeEarned'];
    $row['prestigePoints'] = (int)$row['prestigePoints'];
    $row['totalBarCompletions'] = (int)$row['totalBarCompletions'];
    $row['pendingPrestigePoints'] = (int)$row['pendingPrestigePoints'];
    
    echo json_encode(['success' => true, 'game_data' => $row]);
} else {
    echo json_encode(['success' => false, 'message' => 'Nenhum save encontrado']);
}
?>