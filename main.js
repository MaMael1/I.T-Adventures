// ========================
// I.T Adventure - Parte 1: Constantes, Utilitários e Templates
// ========================

// ------------------------
// CONSTANTES GLOBAIS
// ------------------------
const PRESTIGE_BASE = 1e9;
const BONUS_DURATION = 60000;
const UPGRADE_UPDATE_INTERVAL = 100;
const STATS_UPDATE_INTERVAL = 150;
const MONEY_UPDATE_INTERVAL = 50;
const ALTURA_AJUSTE_INTERVAL = 50;
const CACHE_THRESHOLD = 0.01;

// ------------------------
// VARIÁVEIS GLOBAIS
// ------------------------
let money = 0;
let totalMoneyEarned = 0;
let gamePaused = false;
let gameLoopInterval = null;
let startTime = Date.now();
let playtimeInterval = null;

let lastAlturaAjuste = 0;
let activeProductions = {};
let animationFrameId = null;
let progressoAtivo = {};

let upgradesData = null;
let lingUpgradesData = null;
let elementosUpgrades = new Map();
let upgradeTimestamps = new Map();

let multiplicadorCompra = 1;

let calculoCache = { recompensa: new Map(), tempo: new Map() };
let formatCache = new Map();

let totalBarCompletions = 0;       // número total de vezes que a barra encheu (aumenta o próximo marco)
let pendingPrestigePoints = 0;     // pontos pendentes (ganhos pela barra, mas ainda não reivindicados)
let totalPrestigeEarned = 0;   // total de pontos já obtidos em todo o jogo
let pendingAscensionPoints = 0;  
let prestigeUnlocked = false;
let prestigePoints = 0;
let totalBonus = 0;
let prestigeProgress = 0;
let prestigeUpgradesData = null;   // preenchido após template

let pauseState = {
    active: false,
    pausedAt: 0,
    productionRemains: {}
};

let lastUpgradeUpdate = 0;
let lastStatsUpdate = 0;
let pendingUpgradeUpdate = false;
let pendingStatsUpdate = false;

let moneyEl = document.getElementById("money");
let tooltipEl = null;

let bonusSpeedMultiplier = 1;
let bonusRewardMultiplier = 1;
let bonusTimeout = null;
let bonusInterval = null;
let bonusStartTime = null;
let bonusIconVisible = false;
let nextBonusScheduled = false;
let bonusFadeTimeout = null;

let autoClickInterval = null;

// ------------------------
// FUNÇÕES UTILITÁRIAS
// ------------------------
function arredondar(valor) {
    return Math.round(valor * 100) / 100;
}

function formatarTempo(segundos) {
    if (segundos < 0) segundos = 0;
    if (segundos < 60) {
        let dec = Math.round(segundos * 10) / 10;
        return dec.toFixed(1) + 's';
    } else {
        const totalSegundos = Math.floor(segundos);
        const minutos = Math.floor(totalSegundos / 60);
        const segs = totalSegundos % 60;
        return `${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    }
}

function formatarGrandeNumero(valor) {
    if (valor === 0) return "0.00";
    const valorAbsoluto = Math.abs(valor);
    const sinal = valor < 0 ? "-" : "";
    const sufixos = [
        { divisor: 1, sufixo: "" },
        { divisor: 1e3, sufixo: "k" },
        { divisor: 1e6, sufixo: "M" },
        { divisor: 1e9, sufixo: "B" },
        { divisor: 1e12, sufixo: "T" },
        { divisor: 1e15, sufixo: "Qa" },
        { divisor: 1e18, sufixo: "Qi" },
        { divisor: 1e21, sufixo: "Sx" },
        { divisor: 1e24, sufixo: "Sp" },
        { divisor: 1e27, sufixo: "Oc" },
        { divisor: 1e30, sufixo: "No" },
        { divisor: 1e33, sufixo: "Dc" },
        { divisor: 1e36, sufixo: "Ud" },
        { divisor: 1e39, sufixo: "Dd" },
        { divisor: 1e42, sufixo: "Td" },
        { divisor: 1e45, sufixo: "Qad" },
        { divisor: 1e48, sufixo: "Qid" },
        { divisor: 1e51, sufixo: "Sxd" },
        { divisor: 1e54, sufixo: "Spd" },
        { divisor: 1e57, sufixo: "Ocd" },
        { divisor: 1e60, sufixo: "Nod" },
        { divisor: 1e63, sufixo: "Vg" },
        { divisor: 1e66, sufixo: "Googol" }
    ];
    let sufixoEscolhido = "";
    let divisor = 1;
    for (let i = sufixos.length - 1; i >= 0; i--) {
        if (valorAbsoluto >= sufixos[i].divisor) {
            divisor = sufixos[i].divisor;
            sufixoEscolhido = sufixos[i].sufixo;
            break;
        }
    }
    let valorDividido = valorAbsoluto / divisor;
    let casasDecimais;
    if (divisor === 1) {
        casasDecimais = 2;
    } else if (valorDividido >= 100) {
        casasDecimais = 0;
    } else if (valorDividido >= 10) {
        casasDecimais = 1;
    } else {
        casasDecimais = 2;
    }
    let numeroFormatado;
    if (casasDecimais === 0) {
        numeroFormatado = Math.round(valorDividido).toString();
    } else {
        const multiplicador = Math.pow(10, casasDecimais);
        let valorArredondado = Math.round(valorDividido * multiplicador) / multiplicador;
        if (divisor === 1) {
            valorArredondado = Math.round(valorArredondado * 100) / 100;
            numeroFormatado = valorArredondado.toFixed(2);
        } else {
            numeroFormatado = valorArredondado.toFixed(casasDecimais);
            if (numeroFormatado.includes('.')) {
                numeroFormatado = numeroFormatado.replace(/\.?0+$/, '');
            }
        }
    }
    return sinal + numeroFormatado + sufixoEscolhido;
}

function formatarDinheiro(valor) {
    const cacheKey = Math.floor(valor * 100);
    if (formatCache.has(cacheKey)) return formatCache.get(cacheKey);
    const resultado = formatarGrandeNumero(valor);
    if (formatCache.size > 1000) {
        const firstKey = formatCache.keys().next().value;
        formatCache.delete(firstKey);
    }
    formatCache.set(cacheKey, resultado);
    return resultado;
}

function normalizarEfeitoParaMultiploDe5(efeito) {
    const percentual = arredondar((efeito * 100) / 5) * 5;
    return percentual / 100;
}

function aplicarBonusComArredondamento(valor, bonus) {
    return arredondar(valor * (1 + bonus));
}

function invalidarCacheCalculos() {
    calculoCache.recompensa.clear();
    calculoCache.tempo.clear();
}

function mostrarFeedback(mensagem, tipo) {
    const feedback = document.createElement('div');
    feedback.textContent = mensagem;
    feedback.style.position = 'fixed';
    feedback.style.top = '20px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.padding = '15px 30px';
    feedback.style.borderRadius = '10px';
    feedback.style.fontWeight = 'bold';
    feedback.style.fontSize = '16px';
    feedback.style.zIndex = '10000';
    feedback.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    feedback.style.animation = 'fadeInOut 3s ease-in-out';

    if (tipo === 'success') {
        feedback.style.background = 'linear-gradient(135deg, #27ae60, #219653)';
        feedback.style.color = 'white';
        feedback.style.border = '3px solid #2ecc71';
    } else if (tipo === 'reset') {
        feedback.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
        feedback.style.color = 'white';
        feedback.style.border = '3px solid #3498db';
    } else if (tipo === 'error') {
        feedback.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
        feedback.style.color = 'white';
        feedback.style.border = '3px solid #ff6b6b';
    }
    document.body.appendChild(feedback);
    setTimeout(() => { if (feedback.parentNode) feedback.remove(); }, 3000);
}

// ------------------------
// TEMPLATES DE DADOS
// ------------------------
const linguagensDataTemplate = {
    html: { tempo: 10, recompensaBase: 1.50, precoBase: 10.00, precoAtual: 10.00, multiplicadorPreco: 1.02, multiplicadorRecompensa: 0.4, compras: 1, desbloqueada: true, automatic: false },
    python: { tempo: 30, recompensaBase: 8.00, precoBase: 25.00, precoAtual: 25.00, multiplicadorPreco: 1.04, multiplicadorRecompensa: 0.4, compras: 0, desbloqueada: false, automatic: false },
    java: { tempo: 60, recompensaBase: 25.00, precoBase: 50.00, precoAtual: 50.00, multiplicadorPreco: 1.06, multiplicadorRecompensa: 0.4, compras: 0, desbloqueada: false, automatic: false },
    c: { tempo: 180, recompensaBase: 80.00, precoBase: 250.00, precoAtual: 250.00, multiplicadorPreco: 1.08, multiplicadorRecompensa: 0.4, compras: 0, desbloqueada: false, automatic: false },
    ts: { tempo: 600, recompensaBase: 250.00, precoBase: 500.00, precoAtual: 500.00, multiplicadorPreco: 1.10, multiplicadorRecompensa: 0.4, compras: 0, desbloqueada: false, automatic: false },
    flutter: { tempo: 1800, recompensaBase: 800.00, precoBase: 2500.00, precoAtual: 2500.00, multiplicadorPreco: 1.12, multiplicadorRecompensa: 0.4, compras: 0, desbloqueada: false, automatic: false },
    rust: { tempo: 3600, recompensaBase: 2500.00, precoBase: 5000.00, precoAtual: 5000.00, multiplicadorPreco: 1.14, multiplicadorRecompensa: 0.4, compras: 0, desbloqueada: false, automatic: false },
    cobol: { tempo: 7200, recompensaBase: 8000.00, precoBase: 25000.00, precoAtual: 25000.00, multiplicadorPreco: 1.16, multiplicadorRecompensa: 0.4, compras: 0, desbloqueada: false, automatic: false },
    assembly: { tempo: 14400, recompensaBase: 25000.00, precoBase: 50000.00, precoAtual: 50000.00, multiplicadorPreco: 1.18, multiplicadorRecompensa: 0.4, compras: 0, desbloqueada: false, automatic: false },
    templeos: { tempo: 28800, recompensaBase: 80000.00, precoBase: 250000.00, precoAtual: 250000.00, multiplicadorPreco: 1.20, multiplicadorRecompensa: 0.4, compras: 0, desbloqueada: false, automatic: false }
};

const upgradesDataTemplate = {
    ram: { nome: "Memória RAM", descricao: "Aumenta a velocidade de todas as linguagens em 5%", icone: "🧠", precoBase: 500, precoAtual: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "tempo", limiteAparecimento: 200 },
    gpu: { nome: "Placa de Vídeo", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "🎮", precoBase: 800, precoAtual: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "global", subtipo: "rendimento", limiteAparecimento: 300 },
    cpu: { nome: "Processador", descricao: "Reduz o tempo de todas as linguagens em 10%", icone: "⚙️", precoBase: 1000, precoAtual: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "tempo", limiteAparecimento: 400 },
    monitor: { nome: "Monitor Ultrawide", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "🖥️", precoBase: 600, precoAtual: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "rendimento", limiteAparecimento: 250 },
    teclado: { nome: "Teclado Mecânico RGB", descricao: "Aumenta o poder de clique em 15%", icone: "⌨️", precoBase: 400, precoAtual: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "global", subtipo: "clique", limiteAparecimento: 150 },
    cadeira: { nome: "Cadeira Gamer Ergonométrica", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "💺", precoBase: 300, precoAtual: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "global", subtipo: "tempo", limiteAparecimento: 100 },
    cafeteira: { nome: "Cafeteira Acoplada no PC", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "☕", precoBase: 200, precoAtual: 200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "rendimento", limiteAparecimento: 80 },
    linux: { nome: "Linux", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "🐧", precoBase: 700, precoAtual: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "global", subtipo: "tempo", limiteAparecimento: 500 },
    windows: { nome: "Windows Otimizado", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "🪟", precoBase: 650, precoAtual: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "rendimento", limiteAparecimento: 450 },
    macos: { nome: "MacOS Dev Kit", descricao: "Aumenta o ganho e reduz o tempo em 5% cada", icone: "🍏", precoBase: 1200, precoAtual: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "global", subtipo: "ambos", limiteAparecimento: 800 },
    udemy: { nome: "Curso Udemy", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "📚", precoBase: 300, precoAtual: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "rendimento", limiteAparecimento: 200 },
    alura: { nome: "Curso Alura", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "🎓", precoBase: 350, precoAtual: 350, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "tempo", limiteAparecimento: 220 },
    ebac: { nome: "Curso EBAC", descricao: "Aumenta o ganho em 10% e reduz tempo em 5%", icone: "🏫", precoBase: 500, precoAtual: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "ambos", limiteAparecimento: 300 },
    certJava: { nome: "Certificação Java Gold", descricao: "Aumenta o ganho de Java em 20% adicional", icone: "☕", precoBase: 800, precoAtual: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem-especifica", linguagem: "java", subtipo: "rendimento", limiteAparecimento: 600 },
    certPython: { nome: "Certificado Python Ninja", descricao: "Aumenta o ganho de Python em 15%", icone: "🐍", precoBase: 750, precoAtual: 750, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem-especifica", linguagem: "python", subtipo: "rendimento", limiteAparecimento: 550 },
    aws: { nome: "AWS Solutions Architect", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "☁️", precoBase: 1500, precoAtual: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "global", subtipo: "rendimento", limiteAparecimento: 1000 },
    cloud: { nome: "Cloud Computing", descricao: "Aumenta o ganho de todas as linguagens em 15%", icone: "🌩️", precoBase: 2000, precoAtual: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "global", subtipo: "rendimento", limiteAparecimento: 1200 },
    banco: { nome: "Banco de Dados", descricao: "Reduz o tempo de todas as linguagens em 10%", icone: "🗄️", precoBase: 1800, precoAtual: 1800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "tempo", limiteAparecimento: 1100 },
    gambiarra: { nome: "Gambiarra", descricao: "Aumenta o ganho em 20% mas aumenta o tempo em 5%", icone: "🛠️", precoBase: 100, precoAtual: 100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, efeitoNegativo: 0.05, tipo: "global", subtipo: "gambiarra", limiteAparecimento: 50 },
    vibe: { nome: "Vibe Coding", descricao: "Aumenta o ganho em 30% mas reduz a velocidade em 10%", icone: "🎵", precoBase: 200, precoAtual: 200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.30, efeitoNegativo: 0.10, tipo: "global", subtipo: "vibe", limiteAparecimento: 100 },
    github: { nome: "GitHub", descricao: "Aumenta o ganho de todas as linguagens em 5% e reduz tempo em 5%", icone: "🐙", precoBase: 400, precoAtual: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "ambos", limiteAparecimento: 250 },
    docker: { nome: "Docker", descricao: "Reduz o tempo de todas as linguagens em 10%", icone: "🐳", precoBase: 900, precoAtual: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "tempo", limiteAparecimento: 600 },
    kubernetes: { nome: "Kubernetes", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "⚓", precoBase: 1500, precoAtual: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.09, tipo: "global", subtipo: "rendimento", limiteAparecimento: 900 },
    gitflow: { nome: "Gitflow Pro", descricao: "Aumenta o ganho em 10% e reduz tempo em 5%", icone: "🌿", precoBase: 600, precoAtual: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "ambos", limiteAparecimento: 350 },
    cicd: { nome: "CI/CD Automatizado", descricao: "Reduz o tempo de todas as linguagens em 10%", icone: "🔄", precoBase: 2000, precoAtual: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "global", subtipo: "tempo", limiteAparecimento: 1300 },
    ssd: { nome: "SSD NVMe", descricao: "Aumenta a velocidade de todas as linguagens em 10%", icone: "💾", precoBase: 1200, precoAtual: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "tempo", limiteAparecimento: 800 },
    hdd: { nome: "HDD 7200rpm", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "💿", precoBase: 600, precoAtual: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "global", subtipo: "rendimento", limiteAparecimento: 400 },
    placaMae: { nome: "Placa‑Mãe X570", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "🔌", precoBase: 1500, precoAtual: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "tempo", limiteAparecimento: 1000 },
    fonte: { nome: "Fonte 80 Plus Gold", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "⚡", precoBase: 800, precoAtual: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "global", subtipo: "rendimento", limiteAparecimento: 500 },
    gabinete: { nome: "Gabinete com Fluxo de Ar", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "📦", precoBase: 400, precoAtual: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.02, tipo: "global", subtipo: "tempo", limiteAparecimento: 300 },
    cooler: { nome: "Cooler Master Hyper", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "❄️", precoBase: 300, precoAtual: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.02, tipo: "global", subtipo: "rendimento", limiteAparecimento: 200 },
    waterCooler: { nome: "Water Cooler 360mm", descricao: "Reduz o tempo de todas as linguagens em 10%", icone: "💧", precoBase: 2000, precoAtual: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "tempo", limiteAparecimento: 1500 },
    placaRede: { nome: "Placa de Rede 10Gb", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "🌐", precoBase: 900, precoAtual: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "rendimento", limiteAparecimento: 600 },
    placaSom: { nome: "Placa de Som DAC", descricao: "Aumenta o poder de clique em 10%", icone: "🎧", precoBase: 700, precoAtual: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "global", subtipo: "clique", limiteAparecimento: 500 },
    monitor4k: { nome: "Monitor 4K HDR", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "🖥️", precoBase: 2500, precoAtual: 2500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "rendimento", limiteAparecimento: 2000 },
    vscode: { nome: "VS Code Ultimate", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "📝", precoBase: 500, precoAtual: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "rendimento", limiteAparecimento: 350 },
    intellij: { nome: "IntelliJ IDEA Ultimate", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "☕", precoBase: 800, precoAtual: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "tempo", limiteAparecimento: 600 },
    vim: { nome: "Vim + Plugins", descricao: "Aumenta o ganho de todas as linguagens em 10% (mas requer aprendizado)", icone: "🔧", precoBase: 300, precoAtual: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "global", subtipo: "rendimento", limiteAparecimento: 200 },
    emacs: { nome: "Emacs Doom", descricao: "Reduz o tempo de todas as linguagens em 10% (após configuração)", icone: "⚙️", precoBase: 400, precoAtual: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "tempo", limiteAparecimento: 300 },
    sublime: { nome: "Sublime Text 4", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "✨", precoBase: 250, precoAtual: 250, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "global", subtipo: "rendimento", limiteAparecimento: 180 },
    notepadpp: { nome: "Notepad++", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "📄", precoBase: 100, precoAtual: 100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "global", subtipo: "rendimento", limiteAparecimento: 80 },
    postman: { nome: "Postman Pro", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "📮", precoBase: 600, precoAtual: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "rendimento", limiteAparecimento: 400 },
    insomnia: { nome: "Insomnia", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "😴", precoBase: 500, precoAtual: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "global", subtipo: "tempo", limiteAparecimento: 350 },
    dbeaver: { nome: "DBeaver", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "🐘", precoBase: 550, precoAtual: 550, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "rendimento", limiteAparecimento: 400 },
    figma: { nome: "Figma", descricao: "Aumenta o ganho de todas as linguagens em 10% (design importa)", icone: "🎨", precoBase: 700, precoAtual: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "rendimento", limiteAparecimento: 500 },
    comptiaA: { nome: "CompTIA A+", descricao: "Aumenta o ganho de todas as linguagens em 4%", icone: "🔧", precoBase: 800, precoAtual: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "global", subtipo: "rendimento", limiteAparecimento: 600 },
    comptiaNet: { nome: "CompTIA Network+", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "🌐", precoBase: 1000, precoAtual: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "tempo", limiteAparecimento: 800 },
    comptiaSec: { nome: "CompTIA Security+", descricao: "Aumenta o ganho de todas as linguagens em 6%", icone: "🔒", precoBase: 1200, precoAtual: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "rendimento", limiteAparecimento: 900 },
    ccna: { nome: "Cisco CCNA", descricao: "Reduz o tempo de todas as linguagens em 7%", icone: "📡", precoBase: 1500, precoAtual: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "tempo", limiteAparecimento: 1200 },
    ccnp: { nome: "Cisco CCNP", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "🛜", precoBase: 2500, precoAtual: 2500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "global", subtipo: "rendimento", limiteAparecimento: 2000 },
    oracleDba: { nome: "Oracle DBA", descricao: "Aumenta o ganho de todas as linguagens em 8%", icone: "🗄️", precoBase: 1800, precoAtual: 1800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "rendimento", limiteAparecimento: 1500 },
    mcsa: { nome: "MCSA: Windows Server", descricao: "Reduz o tempo de todas as linguagens em 6%", icone: "🪟", precoBase: 1400, precoAtual: 1400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "tempo", limiteAparecimento: 1100 },
    mcse: { nome: "MCSE: Core Infrastructure", descricao: "Aumenta o ganho de todas as linguagens em 9%", icone: "🏢", precoBase: 2200, precoAtual: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.09, tipo: "global", subtipo: "rendimento", limiteAparecimento: 1800 },
    pmp: { nome: "PMP", descricao: "Aumenta o ganho de todas as linguagens em 12% (gerenciamento)", icone: "📊", precoBase: 3000, precoAtual: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "global", subtipo: "rendimento", limiteAparecimento: 2500 },
    itil: { nome: "ITIL Foundation", descricao: "Reduz o tempo de todas as linguagens em 8%", icone: "🔄", precoBase: 1600, precoAtual: 1600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "tempo", limiteAparecimento: 1300 },
    netlify: { nome: "Netlify", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "🌍", precoBase: 900, precoAtual: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "rendimento", limiteAparecimento: 700 },
    vercel: { nome: "Vercel", descricao: "Reduz o tempo de todas as linguagens em 4%", icone: "▲", precoBase: 850, precoAtual: 850, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "global", subtipo: "tempo", limiteAparecimento: 650 },
    heroku: { nome: "Heroku", descricao: "Aumenta o ganho de todas as linguagens em 6%", icone: "⚙️", precoBase: 1000, precoAtual: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "rendimento", limiteAparecimento: 800 },
    digitalOcean: { nome: "DigitalOcean", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "🐳", precoBase: 1100, precoAtual: 1100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "tempo", limiteAparecimento: 900 },
    linode: { nome: "Linode", descricao: "Aumenta o ganho de todas as linguagens em 7%", icone: "🌱", precoBase: 1200, precoAtual: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "rendimento", limiteAparecimento: 1000 },
    vultr: { nome: "Vultr", descricao: "Reduz o tempo de todas as linguagens em 6%", icone: "🦅", precoBase: 1300, precoAtual: 1300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "tempo", limiteAparecimento: 1100 },
    azure: { nome: "Microsoft Azure", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "☁️", precoBase: 3000, precoAtual: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "global", subtipo: "rendimento", limiteAparecimento: 2500 },
    googleCloud: { nome: "Google Cloud", descricao: "Reduz o tempo de todas as linguagens em 9%", icone: "☁️", precoBase: 2800, precoAtual: 2800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.09, tipo: "global", subtipo: "tempo", limiteAparecimento: 2300 },
    ibmCloud: { nome: "IBM Cloud", descricao: "Aumenta o ganho de todas as linguagens em 8%", icone: "🧊", precoBase: 2600, precoAtual: 2600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "rendimento", limiteAparecimento: 2100 },
    oracleCloud: { nome: "Oracle Cloud", descricao: "Reduz o tempo de todas as linguagens em 7%", icone: "🔮", precoBase: 2400, precoAtual: 2400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "tempo", limiteAparecimento: 1900 },
    jira: { nome: "Jira", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "📋", precoBase: 600, precoAtual: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "rendimento", limiteAparecimento: 450 },
    trello: { nome: "Trello", descricao: "Reduz o tempo de todas as linguagens em 4%", icone: "📌", precoBase: 500, precoAtual: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "global", subtipo: "tempo", limiteAparecimento: 400 },
    slack: { nome: "Slack", descricao: "Aumenta o ganho de todas as linguagens em 6%", icone: "💬", precoBase: 700, precoAtual: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "rendimento", limiteAparecimento: 550 },
    discord: { nome: "Discord", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "🎮", precoBase: 650, precoAtual: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "tempo", limiteAparecimento: 500 },
    zoom: { nome: "Zoom", descricao: "Aumenta o ganho de todas as linguagens em 3%", icone: "📹", precoBase: 400, precoAtual: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "global", subtipo: "rendimento", limiteAparecimento: 300 },
    teams: { nome: "Microsoft Teams", descricao: "Reduz o tempo de todas as linguagens em 4%", icone: "👥", precoBase: 550, precoAtual: 550, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "global", subtipo: "tempo", limiteAparecimento: 450 },
    notion: { nome: "Notion", descricao: "Aumenta o ganho de todas as linguagens em 7%", icone: "📒", precoBase: 750, precoAtual: 750, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "rendimento", limiteAparecimento: 600 },
    evernote: { nome: "Evernote", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "🐘", precoBase: 680, precoAtual: 680, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "tempo", limiteAparecimento: 530 },
    obsidian: { nome: "Obsidian", descricao: "Aumenta o ganho de todas as linguagens em 8%", icone: "🔮", precoBase: 900, precoAtual: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "rendimento", limiteAparecimento: 700 },
    confluence: { nome: "Confluence", descricao: "Reduz o tempo de todas as linguagens em 6%", icone: "📚", precoBase: 850, precoAtual: 850, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "tempo", limiteAparecimento: 650 },
    fibra: { nome: "Fibra Óptica 1Gbps", descricao: "Aumenta o ganho de todas as linguagens em 10%", icone: "🌐", precoBase: 2000, precoAtual: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "global", subtipo: "rendimento", limiteAparecimento: 1500 },
    cincoG: { nome: "5G Móvel", descricao: "Reduz o tempo de todas as linguagens em 8%", icone: "📶", precoBase: 1800, precoAtual: 1800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "tempo", limiteAparecimento: 1400 },
    starlink: { nome: "Starlink", descricao: "Aumenta o ganho de todas as linguagens em 15%", icone: "🛰️", precoBase: 5000, precoAtual: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "global", subtipo: "rendimento", limiteAparecimento: 4000 },
    proxy: { nome: "Proxy Empresarial", descricao: "Aumenta a segurança e o ganho em 7%", icone: "🔒", precoBase: 1200, precoAtual: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "global", subtipo: "rendimento", limiteAparecimento: 900 },
    vpn: { nome: "VPN Corporativa", descricao: "Reduz o tempo de todas as linguagens em 5%", icone: "🔐", precoBase: 1000, precoAtual: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "tempo", limiteAparecimento: 800 },
    cadeiraErgo: { nome: "Cadeira Ergonômica Herman Miller", descricao: "Aumenta o ganho de todas as linguagens em 12%", icone: "🪑", precoBase: 3500, precoAtual: 3500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "global", subtipo: "rendimento", limiteAparecimento: 2800 },
    mesaAjustavel: { nome: "Mesa Ajustável em Altura", descricao: "Reduz o tempo de todas as linguagens em 8%", icone: "📐", precoBase: 2200, precoAtual: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "tempo", limiteAparecimento: 1800 },
    luzLed: { nome: "Luz LED RGB", descricao: "Aumenta o ganho de todas as linguagens em 5%", icone: "💡", precoBase: 400, precoAtual: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "global", subtipo: "rendimento", limiteAparecimento: 300 },
    headset: { nome: "Headset Gamer 7.1", descricao: "Aumenta o poder de clique em 20%", icone: "🎧", precoBase: 600, precoAtual: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "global", subtipo: "clique", limiteAparecimento: 500 },
    microfone: { nome: "Microfone Condensador", descricao: "Aumenta o ganho de todas as linguagens em 4%", icone: "🎙️", precoBase: 450, precoAtual: 450, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "global", subtipo: "rendimento", limiteAparecimento: 350 },
    cafeExtra: { nome: "Café Extra Forte", descricao: "Aumenta o ganho de todas as linguagens em 8% por 30s (passivo)", icone: "☕", precoBase: 150, precoAtual: 150, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "global", subtipo: "rendimento", limiteAparecimento: 100 },
    redBull: { nome: "Red Bull", descricao: "Reduz o tempo de todas as linguagens em 10% (energia)", icone: "🥤", precoBase: 200, precoAtual: 200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "global", subtipo: "tempo", limiteAparecimento: 150 },
    energetico: { nome: "Energético Genérico", descricao: "Aumenta o ganho de todas as linguagens em 6%", icone: "⚡", precoBase: 180, precoAtual: 180, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "global", subtipo: "rendimento", limiteAparecimento: 120 },
    pizzaSexta: { nome: "Pizza na Sexta", descricao: "Aumenta o ganho de todas as linguagens em 15% na sexta-feira (sempre ativo)", icone: "🍕", precoBase: 300, precoAtual: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "global", subtipo: "rendimento", limiteAparecimento: 250 },
    diaFolga: { nome: "Dia de Folga", descricao: "Reduz o tempo de todas as linguagens em 12% (descanso)", icone: "😎", precoBase: 500, precoAtual: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "global", subtipo: "tempo", limiteAparecimento: 400 }
};

const lingUpgradesDataTemplate = {
    // ========================= HTML =========================
    html_css: { nome: "CSS Integrado", descricao: "Aumenta o ganho do HTML em 10%", icone: "🎨", precoBase: 200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    html_seo: { nome: "SEO Estruturado", descricao: "Aumenta o ganho do HTML em 15%", icone: "🔍", precoBase: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 10 } },
    html_estendido: { nome: "HTML5 Estendido", descricao: "Reduz o tempo do HTML em 10%", icone: "🌐", precoBase: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "html", subtipo: "tempo", requisito: { tipo: "compras", valor: 15 } },
    html_semantica: { nome: "Semântica Perfeita", descricao: "Aumenta o ganho do HTML em 20%", icone: "🏷️", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    html_auto: { nome: "Automatização HTML", descricao: "Faz o HTML reiniciar automaticamente após cada ciclo (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "html", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    html_boost1: { nome: "HTML Básico Avançado", descricao: "Aumenta o ganho do HTML em 5%", icone: "🌐", precoBase: 200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 3 } },
    html_boost2: { nome: "HTML Intermediário", descricao: "Aumenta o ganho do HTML em 7%", icone: "🌐", precoBase: 350, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 6 } },
    html_boost3: { nome: "HTML Avançado", descricao: "Aumenta o ganho do HTML em 10%", icone: "🌐", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 10 } },
    html_boost4: { nome: "HTML Expert", descricao: "Aumenta o ganho do HTML em 12%", icone: "🌐", precoBase: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    html_boost5: { nome: "HTML Master", descricao: "Aumenta o ganho do HTML em 15%", icone: "🌐", precoBase: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    html_boost6: { nome: "HTML Legend", descricao: "Aumenta o ganho do HTML em 20%", icone: "🌐", precoBase: 2500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    html_time1: { nome: "HTML Acelerado I", descricao: "Reduz o tempo do HTML em 3%", icone: "⏱️", precoBase: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "html", subtipo: "tempo", requisito: { tipo: "compras", valor: 5 } },
    html_time2: { nome: "HTML Acelerado II", descricao: "Reduz o tempo do HTML em 4%", icone: "⏱️", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "html", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    html_time3: { nome: "HTML Acelerado III", descricao: "Reduz o tempo do HTML em 5%", icone: "⏱️", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "html", subtipo: "tempo", requisito: { tipo: "compras", valor: 15 } },
    html_time4: { nome: "HTML Acelerado IV", descricao: "Reduz o tempo do HTML em 6%", icone: "⏱️", precoBase: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "html", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    html_time5: { nome: "HTML Acelerado V", descricao: "Reduz o tempo do HTML em 7%", icone: "⏱️", precoBase: 1800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "html", subtipo: "tempo", requisito: { tipo: "compras", valor: 25 } },
    html_dual1: { nome: "HTML Otimizado I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨", precoBase: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "html", subtipo: "ambos", requisito: { tipo: "compras", valor: 8 } },
    html_dual2: { nome: "HTML Otimizado II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "html", subtipo: "ambos", requisito: { tipo: "compras", valor: 14 } },
    html_dual3: { nome: "HTML Otimizado III", descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%", icone: "✨", precoBase: 1100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "html", subtipo: "ambos", requisito: { tipo: "compras", valor: 20 } },
    html_dual4: { nome: "HTML Otimizado IV", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "✨", precoBase: 1600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "html", subtipo: "ambos", requisito: { tipo: "compras", valor: 26 } },
    html_dual5: { nome: "HTML Otimizado V", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "✨", precoBase: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "html", subtipo: "ambos", requisito: { tipo: "compras", valor: 32 } },
    html_special1: { nome: "HTML Semântico Profissional", descricao: "Aumenta o ganho do HTML em 15%", icone: "🏷️", precoBase: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 30 } },
    html_special2: { nome: "HTML Canvas Pro", descricao: "Aumenta o ganho do HTML em 10% e reduz tempo em 5%", icone: "🎨", precoBase: 2500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "html", subtipo: "ambos", requisito: { tipo: "compras", valor: 35 } },
    html_special3: { nome: "HTML Web Components", descricao: "Aumenta o ganho do HTML em 18%", icone: "🧩", precoBase: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.18, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 40 } },
    html_special4: { nome: "HTML Acessibilidade (A11y)", descricao: "Reduz o tempo do HTML em 8%", icone: "♿", precoBase: 2800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "html", subtipo: "tempo", requisito: { tipo: "compras", valor: 38 } },
    html_special5: { nome: "HTML SEO Avançado", descricao: "Aumenta o ganho do HTML em 12%", icone: "🔍", precoBase: 2600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "html", subtipo: "rendimento", requisito: { tipo: "compras", valor: 36 } },

    // ========================= Python =========================
    python_tensorflow: { nome: "TensorFlow Light", descricao: "Aumenta o ganho do Python em 15%", icone: "🧠", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    python_sklearn: { nome: "Scikit-learn Overclock", descricao: "Reduz o tempo do Python em 10%", icone: "📊", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "python", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    python_fastapi: { nome: "FastAPI Boost", descricao: "Aumenta o ganho do Python em 15%", icone: "⚡", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    python_pandas: { nome: "Pandas Avançado", descricao: "Reduz o tempo do Python em 10%", icone: "🐼", precoBase: 550, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "python", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    python_numpy: { nome: "NumPy Otimizado", descricao: "Aumenta o ganho do Python em 10%", icone: "🔢", precoBase: 450, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    python_reducao: { nome: "Redução de Tempo de Execução", descricao: "Reduz o tempo do Python em 10%", icone: "⏱️", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "python", subtipo: "tempo", requisito: { tipo: "compras", valor: 30 } },
    python_multiprocess: { nome: "Multiprocessamento Expandido", descricao: "Aumenta o ganho do Python em 20%", icone: "⚙️", precoBase: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.18, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 40 } },
    python_auto: { nome: "Automatização Python", descricao: "Faz o Python reiniciar automaticamente (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "python", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    python_boost1: { nome: "Python Básico+", descricao: "Aumenta o ganho do Python em 5%", icone: "🐍", precoBase: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 4 } },
    python_boost2: { nome: "Python Intermediário", descricao: "Aumenta o ganho do Python em 7%", icone: "🐍", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    python_boost3: { nome: "Python Avançado", descricao: "Aumenta o ganho do Python em 10%", icone: "🐍", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 12 } },
    python_boost4: { nome: "Python Expert", descricao: "Aumenta o ganho do Python em 12%", icone: "🐍", precoBase: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 16 } },
    python_boost5: { nome: "Python Master", descricao: "Aumenta o ganho do Python em 15%", icone: "🐍", precoBase: 1800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    python_boost6: { nome: "Python Legend", descricao: "Aumenta o ganho do Python em 20%", icone: "🐍", precoBase: 2500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    python_time1: { nome: "Python Acelerado I", descricao: "Reduz o tempo do Python em 3%", icone: "⏱️", precoBase: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "python", subtipo: "tempo", requisito: { tipo: "compras", valor: 6 } },
    python_time2: { nome: "Python Acelerado II", descricao: "Reduz o tempo do Python em 4%", icone: "⏱️", precoBase: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "python", subtipo: "tempo", requisito: { tipo: "compras", valor: 11 } },
    python_time3: { nome: "Python Acelerado III", descricao: "Reduz o tempo do Python em 5%", icone: "⏱️", precoBase: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "python", subtipo: "tempo", requisito: { tipo: "compras", valor: 16 } },
    python_time4: { nome: "Python Acelerado IV", descricao: "Reduz o tempo do Python em 6%", icone: "⏱️", precoBase: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "python", subtipo: "tempo", requisito: { tipo: "compras", valor: 21 } },
    python_time5: { nome: "Python Acelerado V", descricao: "Reduz o tempo do Python em 7%", icone: "⏱️", precoBase: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "python", subtipo: "tempo", requisito: { tipo: "compras", valor: 26 } },
    python_dual1: { nome: "Python Otimizado I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "python", subtipo: "ambos", requisito: { tipo: "compras", valor: 9 } },
    python_dual2: { nome: "Python Otimizado II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨", precoBase: 850, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "python", subtipo: "ambos", requisito: { tipo: "compras", valor: 15 } },
    python_dual3: { nome: "Python Otimizado III", descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%", icone: "✨", precoBase: 1300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "python", subtipo: "ambos", requisito: { tipo: "compras", valor: 21 } },
    python_dual4: { nome: "Python Otimizado IV", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "✨", precoBase: 1900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "python", subtipo: "ambos", requisito: { tipo: "compras", valor: 27 } },
    python_dual5: { nome: "Python Otimizado V", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "✨", precoBase: 2600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "python", subtipo: "ambos", requisito: { tipo: "compras", valor: 33 } },
    python_special: { nome: "Python Data Science Pro", descricao: "Aumenta o ganho do Python em 15%", icone: "📊", precoBase: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "python", subtipo: "rendimento", requisito: { tipo: "compras", valor: 40 } },

    // ========================= Java =========================
    java_springboot: { nome: "Springboot", descricao: "Aumenta o ganho do Java em 20%", icone: "🍃", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    java_springsecurity: { nome: "Spring Security", descricao: "Reduz o tempo do Java em 10%", icone: "🔒", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "java", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    java_quarkus: { nome: "Quarkus", descricao: "Aumenta o ganho do Java em 15%", icone: "🚀", precoBase: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    java_micronaut: { nome: "Micronaut", descricao: "Reduz o tempo do Java em 10%", icone: "🌌", precoBase: 850, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "java", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    java_jvm: { nome: "JVM Otimizada", descricao: "Aumenta o ganho do Java em 15%", icone: "☕", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    java_gc: { nome: "Garbage Collector Inteligente", descricao: "Reduz o tempo do Java em 10%", icone: "🗑️", precoBase: 750, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "java", subtipo: "tempo", requisito: { tipo: "compras", valor: 25 } },
    java_maven: { nome: "Maven Ultimate Build", descricao: "Aumenta o ganho do Java em 18%", icone: "📦", precoBase: 950, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.18, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 30 } },
    java_microservices: { nome: "Microserviços Automatizados", descricao: "Reduz o tempo do Java em 12%", icone: "🔧", precoBase: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "java", subtipo: "tempo", requisito: { tipo: "compras", valor: 40 } },
    java_auto: { nome: "Automatização Java", descricao: "Faz o Java reiniciar automaticamente (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "java", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    java_boost1: { nome: "Java Básico+", descricao: "Aumenta o ganho do Java em 5%", icone: "☕", precoBase: 350, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 4 } },
    java_boost2: { nome: "Java Intermediário", descricao: "Aumenta o ganho do Java em 7%", icone: "☕", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    java_boost3: { nome: "Java Avançado", descricao: "Aumenta o ganho do Java em 10%", icone: "☕", precoBase: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 12 } },
    java_boost4: { nome: "Java Expert", descricao: "Aumenta o ganho do Java em 12%", icone: "☕", precoBase: 1400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 16 } },
    java_boost5: { nome: "Java Master", descricao: "Aumenta o ganho do Java em 15%", icone: "☕", precoBase: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    java_boost6: { nome: "Java Legend", descricao: "Aumenta o ganho do Java em 20%", icone: "☕", precoBase: 2800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    java_time1: { nome: "Java Acelerado I", descricao: "Reduz o tempo do Java em 3%", icone: "⏱️", precoBase: 450, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "java", subtipo: "tempo", requisito: { tipo: "compras", valor: 6 } },
    java_time2: { nome: "Java Acelerado II", descricao: "Reduz o tempo do Java em 4%", icone: "⏱️", precoBase: 750, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "java", subtipo: "tempo", requisito: { tipo: "compras", valor: 11 } },
    java_time3: { nome: "Java Acelerado III", descricao: "Reduz o tempo do Java em 5%", icone: "⏱️", precoBase: 1100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "java", subtipo: "tempo", requisito: { tipo: "compras", valor: 16 } },
    java_time4: { nome: "Java Acelerado IV", descricao: "Reduz o tempo do Java em 6%", icone: "⏱️", precoBase: 1600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "java", subtipo: "tempo", requisito: { tipo: "compras", valor: 21 } },
    java_time5: { nome: "Java Acelerado V", descricao: "Reduz o tempo do Java em 7%", icone: "⏱️", precoBase: 2300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "java", subtipo: "tempo", requisito: { tipo: "compras", valor: 26 } },
    java_dual1: { nome: "Java Otimizado I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨", precoBase: 550, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "java", subtipo: "ambos", requisito: { tipo: "compras", valor: 9 } },
    java_dual2: { nome: "Java Otimizado II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨", precoBase: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "java", subtipo: "ambos", requisito: { tipo: "compras", valor: 15 } },
    java_dual3: { nome: "Java Otimizado III", descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%", icone: "✨", precoBase: 1400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "java", subtipo: "ambos", requisito: { tipo: "compras", valor: 21 } },
    java_dual4: { nome: "Java Otimizado IV", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "✨", precoBase: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "java", subtipo: "ambos", requisito: { tipo: "compras", valor: 27 } },
    java_dual5: { nome: "Java Otimizado V", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "✨", precoBase: 2700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "java", subtipo: "ambos", requisito: { tipo: "compras", valor: 33 } },
    java_special: { nome: "Java Enterprise Pro", descricao: "Aumenta o ganho do Java em 15%", icone: "🏢", precoBase: 3200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "java", subtipo: "rendimento", requisito: { tipo: "compras", valor: 40 } },

    // ========================= C =========================
    c_ponteiros: { nome: "Ponteiros Otimizados", descricao: "Aumenta o ganho do C em 15%", icone: "👉", precoBase: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    c_gerenciamento: { nome: "Gerenciamento Manual Aprimorado", descricao: "Reduz o tempo do C em 7%", icone: "✋", precoBase: 450, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "c", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    c_biblioteca: { nome: "Biblioteca de Performance Insana", descricao: "Aumenta o ganho do C em 20%", icone: "📚", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    c_compilacao: { nome: "Compilação Ultra Rápida com GCC++", descricao: "Reduz o tempo do C em 10%", icone: "⚡", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "c", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    c_bitshifting: { nome: "Bit Shifting Avançado", descricao: "Aumenta o ganho do C em 12%", icone: "🔄", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    c_naoseguro: { nome: "Código Não-seguro Otimizado", descricao: "Reduz o tempo do C em 8%", icone: "⚠️", precoBase: 550, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "c", subtipo: "tempo", requisito: { tipo: "compras", valor: 12 } },
    c_compilacaoParalela: { nome: "Compilação Paralela Avançada", descricao: "Aumenta o ganho do C em 18%", icone: "⚙️", precoBase: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.18, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 30 } },
    c_auto: { nome: "Automatização C", descricao: "Faz o C reiniciar automaticamente (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "c", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    c_boost1: { nome: "C Básico+", descricao: "Aumenta o ganho do C em 5%", icone: "⚙️", precoBase: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 4 } },
    c_boost2: { nome: "C Intermediário", descricao: "Aumenta o ganho do C em 7%", icone: "⚙️", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    c_boost3: { nome: "C Avançado", descricao: "Aumenta o ganho do C em 10%", icone: "⚙️", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 12 } },
    c_boost4: { nome: "C Expert", descricao: "Aumenta o ganho do C em 12%", icone: "⚙️", precoBase: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 16 } },
    c_boost5: { nome: "C Master", descricao: "Aumenta o ganho do C em 15%", icone: "⚙️", precoBase: 1800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    c_boost6: { nome: "C Legend", descricao: "Aumenta o ganho do C em 20%", icone: "⚙️", precoBase: 2500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    c_time1: { nome: "C Acelerado I", descricao: "Reduz o tempo do C em 3%", icone: "⏱️", precoBase: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "c", subtipo: "tempo", requisito: { tipo: "compras", valor: 6 } },
    c_time2: { nome: "C Acelerado II", descricao: "Reduz o tempo do C em 4%", icone: "⏱️", precoBase: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "c", subtipo: "tempo", requisito: { tipo: "compras", valor: 11 } },
    c_time3: { nome: "C Acelerado III", descricao: "Reduz o tempo do C em 5%", icone: "⏱️", precoBase: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "c", subtipo: "tempo", requisito: { tipo: "compras", valor: 16 } },
    c_time4: { nome: "C Acelerado IV", descricao: "Reduz o tempo do C em 6%", icone: "⏱️", precoBase: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "c", subtipo: "tempo", requisito: { tipo: "compras", valor: 21 } },
    c_time5: { nome: "C Acelerado V", descricao: "Reduz o tempo do C em 7%", icone: "⏱️", precoBase: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "c", subtipo: "tempo", requisito: { tipo: "compras", valor: 26 } },
    c_dual1: { nome: "C Otimizado I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "c", subtipo: "ambos", requisito: { tipo: "compras", valor: 9 } },
    c_dual2: { nome: "C Otimizado II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨", precoBase: 850, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "c", subtipo: "ambos", requisito: { tipo: "compras", valor: 15 } },
    c_dual3: { nome: "C Otimizado III", descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%", icone: "✨", precoBase: 1300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "c", subtipo: "ambos", requisito: { tipo: "compras", valor: 21 } },
    c_dual4: { nome: "C Otimizado IV", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "✨", precoBase: 1900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "c", subtipo: "ambos", requisito: { tipo: "compras", valor: 27 } },
    c_dual5: { nome: "C Otimizado V", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "✨", precoBase: 2600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "c", subtipo: "ambos", requisito: { tipo: "compras", valor: 33 } },
    c_special: { nome: "C Kernel Hacker", descricao: "Aumenta o ganho do C em 15%", icone: "💻", precoBase: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "c", subtipo: "rendimento", requisito: { tipo: "compras", valor: 40 } },

    // ========================= TypeScript / JavaScript =========================
    ts_reactnative: { nome: "React Native", descricao: "Aumenta o ganho do TypeScript em 20%", icone: "📱", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    ts_strict: { nome: "Strict Mode Supremo", descricao: "Reduz o tempo do TypeScript em 8%", icone: "🔒", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "ts", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    ts_tipagem: { nome: "Tipagem Profunda", descricao: "Aumenta o ganho do TypeScript em 15%", icone: "🔍", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    ts_decorators: { nome: "Decorators V2", descricao: "Reduz o tempo do TypeScript em 7%", icone: "🎀", precoBase: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "ts", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    ts_auto: { nome: "Automatização TypeScript", descricao: "Faz o TypeScript reiniciar automaticamente (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "ts", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    js_node: { nome: "Node.js", descricao: "Aumenta o ganho do JavaScript em 20%", icone: "🟢", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    ts_boost1: { nome: "TS Básico+", descricao: "Aumenta o ganho do TypeScript em 5%", icone: "🔷", precoBase: 300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 4 } },
    ts_boost2: { nome: "TS Intermediário", descricao: "Aumenta o ganho do TypeScript em 7%", icone: "🔷", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    ts_boost3: { nome: "TS Avançado", descricao: "Aumenta o ganho do TypeScript em 10%", icone: "🔷", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 12 } },
    ts_boost4: { nome: "TS Expert", descricao: "Aumenta o ganho do TypeScript em 12%", icone: "🔷", precoBase: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 16 } },
    ts_boost5: { nome: "TS Master", descricao: "Aumenta o ganho do TypeScript em 15%", icone: "🔷", precoBase: 1800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    ts_boost6: { nome: "TS Legend", descricao: "Aumenta o ganho do TypeScript em 20%", icone: "🔷", precoBase: 2500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    ts_time1: { nome: "TS Acelerado I", descricao: "Reduz o tempo do TypeScript em 3%", icone: "⏱️", precoBase: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "ts", subtipo: "tempo", requisito: { tipo: "compras", valor: 6 } },
    ts_time2: { nome: "TS Acelerado II", descricao: "Reduz o tempo do TypeScript em 4%", icone: "⏱️", precoBase: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "ts", subtipo: "tempo", requisito: { tipo: "compras", valor: 11 } },
    ts_time3: { nome: "TS Acelerado III", descricao: "Reduz o tempo do TypeScript em 5%", icone: "⏱️", precoBase: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "ts", subtipo: "tempo", requisito: { tipo: "compras", valor: 16 } },
    ts_time4: { nome: "TS Acelerado IV", descricao: "Reduz o tempo do TypeScript em 6%", icone: "⏱️", precoBase: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "ts", subtipo: "tempo", requisito: { tipo: "compras", valor: 21 } },
    ts_time5: { nome: "TS Acelerado V", descricao: "Reduz o tempo do TypeScript em 7%", icone: "⏱️", precoBase: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "ts", subtipo: "tempo", requisito: { tipo: "compras", valor: 26 } },
    ts_dual1: { nome: "TS Otimizado I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "ts", subtipo: "ambos", requisito: { tipo: "compras", valor: 9 } },
    ts_dual2: { nome: "TS Otimizado II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨", precoBase: 850, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "ts", subtipo: "ambos", requisito: { tipo: "compras", valor: 15 } },
    ts_dual3: { nome: "TS Otimizado III", descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%", icone: "✨", precoBase: 1300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "ts", subtipo: "ambos", requisito: { tipo: "compras", valor: 21 } },
    ts_dual4: { nome: "TS Otimizado IV", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "✨", precoBase: 1900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "ts", subtipo: "ambos", requisito: { tipo: "compras", valor: 27 } },
    ts_dual5: { nome: "TS Otimizado V", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "✨", precoBase: 2600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "ts", subtipo: "ambos", requisito: { tipo: "compras", valor: 33 } },
    ts_special1: { nome: "TS Advanced Types", descricao: "Aumenta o ganho do TypeScript em 15%", icone: "🔷", precoBase: 2800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 38 } },
    ts_special2: { nome: "TS Node.js Pro", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "🟢", precoBase: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "ts", subtipo: "ambos", requisito: { tipo: "compras", valor: 42 } },
    ts_special3: { nome: "TS React Master", descricao: "Aumenta o ganho do TypeScript em 18%", icone: "⚛️", precoBase: 3200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.18, tipo: "linguagem", linguagemId: "ts", subtipo: "rendimento", requisito: { tipo: "compras", valor: 45 } },

    // ========================= Flutter =========================
    flutter_skia: { nome: "Skia Booster", descricao: "Aumenta o ganho do Flutter em 12%", icone: "🎨", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    flutter_componentes: { nome: "Componentes Customizados", descricao: "Reduz o tempo do Flutter em 6%", icone: "🧩", precoBase: 550, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "flutter", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    flutter_animacoes: { nome: "Animações Otimizadas", descricao: "Aumenta o ganho do Flutter em 15%", icone: "✨", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    flutter_hotReload: { nome: "Hot Reload Aprimorado", descricao: "Reduz o tempo do Flutter em 10%", icone: "🔥", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "flutter", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    flutter_widgets: { nome: "Widgets Avançados", descricao: "Aumenta o ganho do Flutter em 18%", icone: "📦", precoBase: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.18, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    flutter_material: { nome: "Material You++", descricao: "Reduz o tempo do Flutter em 8%", icone: "🎭", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "flutter", subtipo: "tempo", requisito: { tipo: "compras", valor: 12 } },
    flutter_cross: { nome: "Cross-Plataforma Expandido", descricao: "Aumenta o ganho do Flutter em 22%", icone: "🌍", precoBase: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.22, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 30 } },
    flutter_auto: { nome: "Automatização Flutter", descricao: "Faz o Flutter reiniciar automaticamente (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "flutter", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    flutter_boost1: { nome: "Flutter Básico+", descricao: "Aumenta o ganho do Flutter em 5%", icone: "📱", precoBase: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 4 } },
    flutter_boost2: { nome: "Flutter Intermediário", descricao: "Aumenta o ganho do Flutter em 7%", icone: "📱", precoBase: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    flutter_boost3: { nome: "Flutter Avançado", descricao: "Aumenta o ganho do Flutter em 10%", icone: "📱", precoBase: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 12 } },
    flutter_boost4: { nome: "Flutter Expert", descricao: "Aumenta o ganho do Flutter em 12%", icone: "📱", precoBase: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 16 } },
    flutter_boost5: { nome: "Flutter Master", descricao: "Aumenta o ganho do Flutter em 15%", icone: "📱", precoBase: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    flutter_boost6: { nome: "Flutter Legend", descricao: "Aumenta o ganho do Flutter em 20%", icone: "📱", precoBase: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    flutter_time1: { nome: "Flutter Acelerado I", descricao: "Reduz o tempo do Flutter em 3%", icone: "⏱️", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "flutter", subtipo: "tempo", requisito: { tipo: "compras", valor: 6 } },
    flutter_time2: { nome: "Flutter Acelerado II", descricao: "Reduz o tempo do Flutter em 4%", icone: "⏱️", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "flutter", subtipo: "tempo", requisito: { tipo: "compras", valor: 11 } },
    flutter_time3: { nome: "Flutter Acelerado III", descricao: "Reduz o tempo do Flutter em 5%", icone: "⏱️", precoBase: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "flutter", subtipo: "tempo", requisito: { tipo: "compras", valor: 16 } },
    flutter_time4: { nome: "Flutter Acelerado IV", descricao: "Reduz o tempo do Flutter em 6%", icone: "⏱️", precoBase: 1700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "flutter", subtipo: "tempo", requisito: { tipo: "compras", valor: 21 } },
    flutter_time5: { nome: "Flutter Acelerado V", descricao: "Reduz o tempo do Flutter em 7%", icone: "⏱️", precoBase: 2400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "flutter", subtipo: "tempo", requisito: { tipo: "compras", valor: 26 } },
    flutter_dual1: { nome: "Flutter Otimizado I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "flutter", subtipo: "ambos", requisito: { tipo: "compras", valor: 9 } },
    flutter_dual2: { nome: "Flutter Otimizado II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨", precoBase: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "flutter", subtipo: "ambos", requisito: { tipo: "compras", valor: 15 } },
    flutter_dual3: { nome: "Flutter Otimizado III", descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%", icone: "✨", precoBase: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "flutter", subtipo: "ambos", requisito: { tipo: "compras", valor: 21 } },
    flutter_dual4: { nome: "Flutter Otimizado IV", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "✨", precoBase: 2100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "flutter", subtipo: "ambos", requisito: { tipo: "compras", valor: 27 } },
    flutter_dual5: { nome: "Flutter Otimizado V", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "✨", precoBase: 2800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "flutter", subtipo: "ambos", requisito: { tipo: "compras", valor: 33 } },
    flutter_special: { nome: "Flutter Web & Desktop", descricao: "Aumenta o ganho do Flutter em 15%", icone: "🖥️", precoBase: 3500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "flutter", subtipo: "rendimento", requisito: { tipo: "compras", valor: 40 } },

    // ========================= Rust =========================
    rust_crates: { nome: "Crates Especializados", descricao: "Aumenta o ganho do Rust em 14%", icone: "📦", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.14, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    rust_compile: { nome: "Compile Time Wizard", descricao: "Reduz o tempo do Rust em 8%", icone: "⚡", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "rust", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    rust_serenity: { nome: "Serenity Engine", descricao: "Aumenta o ganho do Rust em 18%", icone: "🧘", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.18, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    rust_ownership: { nome: "Ownership Aprimorado", descricao: "Reduz o tempo do Rust em 7%", icone: "🔒", precoBase: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "rust", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    rust_borrow: { nome: "Borrow Checker Otimizado", descricao: "Aumenta o ganho do Rust em 12%", icone: "🔍", precoBase: 550, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    rust_macros: { nome: "Macros Místicas", descricao: "Reduz o tempo do Rust em 10%", icone: "🔮", precoBase: 750, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "rust", subtipo: "tempo", requisito: { tipo: "compras", valor: 25 } },
    rust_auto: { nome: "Automatização Rust", descricao: "Faz o Rust reiniciar automaticamente (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "rust", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    rust_boost1: { nome: "Rust Básico+", descricao: "Aumenta o ganho do Rust em 5%", icone: "🦀", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 4 } },
    rust_boost2: { nome: "Rust Intermediário", descricao: "Aumenta o ganho do Rust em 7%", icone: "🦀", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    rust_boost3: { nome: "Rust Avançado", descricao: "Aumenta o ganho do Rust em 10%", icone: "🦀", precoBase: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 12 } },
    rust_boost4: { nome: "Rust Expert", descricao: "Aumenta o ganho do Rust em 12%", icone: "🦀", precoBase: 1800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 16 } },
    rust_boost5: { nome: "Rust Master", descricao: "Aumenta o ganho do Rust em 15%", icone: "🦀", precoBase: 2500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    rust_boost6: { nome: "Rust Legend", descricao: "Aumenta o ganho do Rust em 20%", icone: "🦀", precoBase: 3500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    rust_time1: { nome: "Rust Acelerado I", descricao: "Reduz o tempo do Rust em 3%", icone: "⏱️", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "rust", subtipo: "tempo", requisito: { tipo: "compras", valor: 6 } },
    rust_time2: { nome: "Rust Acelerado II", descricao: "Reduz o tempo do Rust em 4%", icone: "⏱️", precoBase: 950, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "rust", subtipo: "tempo", requisito: { tipo: "compras", valor: 11 } },
    rust_time3: { nome: "Rust Acelerado III", descricao: "Reduz o tempo do Rust em 5%", icone: "⏱️", precoBase: 1400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "rust", subtipo: "tempo", requisito: { tipo: "compras", valor: 16 } },
    rust_time4: { nome: "Rust Acelerado IV", descricao: "Reduz o tempo do Rust em 6%", icone: "⏱️", precoBase: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "rust", subtipo: "tempo", requisito: { tipo: "compras", valor: 21 } },
    rust_time5: { nome: "Rust Acelerado V", descricao: "Reduz o tempo do Rust em 7%", icone: "⏱️", precoBase: 2800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "rust", subtipo: "tempo", requisito: { tipo: "compras", valor: 26 } },
    rust_dual1: { nome: "Rust Otimizado I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "rust", subtipo: "ambos", requisito: { tipo: "compras", valor: 9 } },
    rust_dual2: { nome: "Rust Otimizado II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨", precoBase: 1100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "rust", subtipo: "ambos", requisito: { tipo: "compras", valor: 15 } },
    rust_dual3: { nome: "Rust Otimizado III", descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%", icone: "✨", precoBase: 1600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "rust", subtipo: "ambos", requisito: { tipo: "compras", valor: 21 } },
    rust_dual4: { nome: "Rust Otimizado IV", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "✨", precoBase: 2300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "rust", subtipo: "ambos", requisito: { tipo: "compras", valor: 27 } },
    rust_dual5: { nome: "Rust Otimizado V", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "✨", precoBase: 3100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "rust", subtipo: "ambos", requisito: { tipo: "compras", valor: 33 } },
    rust_special1: { nome: "Rust Embedded", descricao: "Aumenta o ganho do Rust em 15%", icone: "🔌", precoBase: 4000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "rust", subtipo: "rendimento", requisito: { tipo: "compras", valor: 40 } },
    rust_special2: { nome: "Rust WebAssembly", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "🌐", precoBase: 4500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "rust", subtipo: "ambos", requisito: { tipo: "compras", valor: 45 } },

    // ========================= COBOL =========================
    cobol_mainframe: { nome: "Mainframe Modernizado", descricao: "Aumenta o ganho do COBOL em 10%", icone: "🏢", precoBase: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    cobol_modernizacao: { nome: "Modernização Inexistente", descricao: "Reduz o tempo do COBOL em 5% (raro)", icone: "🕰️", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "cobol", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    cobol_3000: { nome: "Cobol 3000 (Só Memes)", descricao: "Aumenta o ganho do COBOL em 15% (ironia)", icone: "😄", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    cobol_relatorios: { nome: "Estruturas de Relatório Avançadas", descricao: "Reduz o tempo do COBOL em 7%", icone: "📊", precoBase: 550, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "cobol", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    cobol_auto: { nome: "Automatização COBOL", descricao: "Faz o COBOL reiniciar automaticamente (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "cobol", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    cobol_boost1: { nome: "COBOL Básico+", descricao: "Aumenta o ganho do COBOL em 5%", icone: "🏛️", precoBase: 400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 4 } },
    cobol_boost2: { nome: "COBOL Intermediário", descricao: "Aumenta o ganho do COBOL em 7%", icone: "🏛️", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    cobol_boost3: { nome: "COBOL Avançado", descricao: "Aumenta o ganho do COBOL em 10%", icone: "🏛️", precoBase: 1100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 12 } },
    cobol_boost4: { nome: "COBOL Expert", descricao: "Aumenta o ganho do COBOL em 12%", icone: "🏛️", precoBase: 1600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 16 } },
    cobol_boost5: { nome: "COBOL Master", descricao: "Aumenta o ganho do COBOL em 15%", icone: "🏛️", precoBase: 2300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    cobol_boost6: { nome: "COBOL Legend", descricao: "Aumenta o ganho do COBOL em 20%", icone: "🏛️", precoBase: 3200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    cobol_time1: { nome: "COBOL Acelerado I", descricao: "Reduz o tempo do COBOL em 3%", icone: "⏱️", precoBase: 500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "cobol", subtipo: "tempo", requisito: { tipo: "compras", valor: 6 } },
    cobol_time2: { nome: "COBOL Acelerado II", descricao: "Reduz o tempo do COBOL em 4%", icone: "⏱️", precoBase: 850, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "cobol", subtipo: "tempo", requisito: { tipo: "compras", valor: 11 } },
    cobol_time3: { nome: "COBOL Acelerado III", descricao: "Reduz o tempo do COBOL em 5%", icone: "⏱️", precoBase: 1300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "cobol", subtipo: "tempo", requisito: { tipo: "compras", valor: 16 } },
    cobol_time4: { nome: "COBOL Acelerado IV", descricao: "Reduz o tempo do COBOL em 6%", icone: "⏱️", precoBase: 1900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "cobol", subtipo: "tempo", requisito: { tipo: "compras", valor: 21 } },
    cobol_time5: { nome: "COBOL Acelerado V", descricao: "Reduz o tempo do COBOL em 7%", icone: "⏱️", precoBase: 2700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "cobol", subtipo: "tempo", requisito: { tipo: "compras", valor: 26 } },
    cobol_dual1: { nome: "COBOL Otimizado I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "cobol", subtipo: "ambos", requisito: { tipo: "compras", valor: 9 } },
    cobol_dual2: { nome: "COBOL Otimizado II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨", precoBase: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "cobol", subtipo: "ambos", requisito: { tipo: "compras", valor: 15 } },
    cobol_dual3: { nome: "COBOL Otimizado III", descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%", icone: "✨", precoBase: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "cobol", subtipo: "ambos", requisito: { tipo: "compras", valor: 21 } },
    cobol_dual4: { nome: "COBOL Otimizado IV", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "✨", precoBase: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "cobol", subtipo: "ambos", requisito: { tipo: "compras", valor: 27 } },
    cobol_dual5: { nome: "COBOL Otimizado V", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "✨", precoBase: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "cobol", subtipo: "ambos", requisito: { tipo: "compras", valor: 33 } },
    cobol_special1: { nome: "COBOL Batch Processing", descricao: "Aumenta o ganho do COBOL em 15%", icone: "📦", precoBase: 3500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 38 } },
    cobol_special2: { nome: "COBOL Legacy Integration", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "🔗", precoBase: 3800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "cobol", subtipo: "ambos", requisito: { tipo: "compras", valor: 42 } },
    cobol_special3: { nome: "COBOL Year 2038 Ready", descricao: "Reduz o tempo do COBOL em 12%", icone: "📅", precoBase: 4000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "cobol", subtipo: "tempo", requisito: { tipo: "compras", valor: 45 } },
    cobol_special4: { nome: "COBOL Mainframe Pro", descricao: "Aumenta o ganho do COBOL em 20%", icone: "🏢", precoBase: 4500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "cobol", subtipo: "rendimento", requisito: { tipo: "compras", valor: 50 } },

    // ========================= Assembly =========================
    assembly_simd: { nome: "Instruções SIMD", descricao: "Aumenta o ganho do Assembly em 20%", icone: "⚡", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    assembly_baixoNivel: { nome: "Operações de Baixo Nível", descricao: "Reduz o tempo do Assembly em 8%", icone: "🔧", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "assembly", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    assembly_doom: { nome: "Programar DOOM", descricao: "Aumenta o ganho do Assembly em 25%", icone: "👾", precoBase: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.25, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    assembly_instrucoes: { nome: "Instruções Otimizadas", descricao: "Reduz o tempo do Assembly em 10%", icone: "⚙️", precoBase: 650, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "assembly", subtipo: "tempo", requisito: { tipo: "compras", valor: 8 } },
    assembly_registradores: { nome: "Manipulação Direta de Registradores", descricao: "Aumenta o ganho do Assembly em 18%", icone: "📟", precoBase: 750, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.18, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 12 } },
    assembly_hex: { nome: "Código Hex Energizado", descricao: "Reduz o tempo do Assembly em 12%", icone: "🔢", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "assembly", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    assembly_auto: { nome: "Automatização Assembly", descricao: "Faz o Assembly reiniciar automaticamente (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "assembly", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    assembly_boost1: { nome: "Assembly Básico+", descricao: "Aumenta o ganho do Assembly em 5%", icone: "🔧", precoBase: 600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 4 } },
    assembly_boost2: { nome: "Assembly Intermediário", descricao: "Aumenta o ganho do Assembly em 7%", icone: "🔧", precoBase: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 8 } },
    assembly_boost3: { nome: "Assembly Avançado", descricao: "Aumenta o ganho do Assembly em 10%", icone: "🔧", precoBase: 1400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 12 } },
    assembly_boost4: { nome: "Assembly Expert", descricao: "Aumenta o ganho do Assembly em 12%", icone: "🔧", precoBase: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 16 } },
    assembly_boost5: { nome: "Assembly Master", descricao: "Aumenta o ganho do Assembly em 15%", icone: "🔧", precoBase: 2800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    assembly_boost6: { nome: "Assembly Legend", descricao: "Aumenta o ganho do Assembly em 20%", icone: "🔧", precoBase: 3800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    assembly_time1: { nome: "Assembly Acelerado I", descricao: "Reduz o tempo do Assembly em 3%", icone: "⏱️", precoBase: 700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "assembly", subtipo: "tempo", requisito: { tipo: "compras", valor: 6 } },
    assembly_time2: { nome: "Assembly Acelerado II", descricao: "Reduz o tempo do Assembly em 4%", icone: "⏱️", precoBase: 1100, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "assembly", subtipo: "tempo", requisito: { tipo: "compras", valor: 11 } },
    assembly_time3: { nome: "Assembly Acelerado III", descricao: "Reduz o tempo do Assembly em 5%", icone: "⏱️", precoBase: 1600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "assembly", subtipo: "tempo", requisito: { tipo: "compras", valor: 16 } },
    assembly_time4: { nome: "Assembly Acelerado IV", descricao: "Reduz o tempo do Assembly em 6%", icone: "⏱️", precoBase: 2300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "assembly", subtipo: "tempo", requisito: { tipo: "compras", valor: 21 } },
    assembly_time5: { nome: "Assembly Acelerado V", descricao: "Reduz o tempo do Assembly em 7%", icone: "⏱️", precoBase: 3200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "assembly", subtipo: "tempo", requisito: { tipo: "compras", valor: 26 } },
    assembly_dual1: { nome: "Assembly Otimizado I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "assembly", subtipo: "ambos", requisito: { tipo: "compras", valor: 9 } },
    assembly_dual2: { nome: "Assembly Otimizado II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨", precoBase: 1300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "assembly", subtipo: "ambos", requisito: { tipo: "compras", valor: 15 } },
    assembly_dual3: { nome: "Assembly Otimizado III", descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%", icone: "✨", precoBase: 1900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.08, tipo: "linguagem", linguagemId: "assembly", subtipo: "ambos", requisito: { tipo: "compras", valor: 21 } },
    assembly_dual4: { nome: "Assembly Otimizado IV", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "✨", precoBase: 2700, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "assembly", subtipo: "ambos", requisito: { tipo: "compras", valor: 27 } },
    assembly_dual5: { nome: "Assembly Otimizado V", descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%", icone: "✨", precoBase: 3600, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "assembly", subtipo: "ambos", requisito: { tipo: "compras", valor: 33 } },
    assembly_special1: { nome: "Assembly Reverse Engineering", descricao: "Aumenta o ganho do Assembly em 15%", icone: "🔍", precoBase: 4200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "assembly", subtipo: "rendimento", requisito: { tipo: "compras", valor: 40 } },
    assembly_special2: { nome: "Assembly Bootloader", descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%", icone: "🖥️", precoBase: 4800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "assembly", subtipo: "ambos", requisito: { tipo: "compras", valor: 45 } },

    // ========================= TempleOS =========================
    templeos_inspiracao1: { nome: "Inspiração Divina I", descricao: "Aumenta o ganho do TempleOS em 10%", icone: "✨", precoBase: 1000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    templeos_inspiracao2: { nome: "Inspiração Divina II", descricao: "Reduz o tempo do TempleOS em 5%", icone: "✨✨", precoBase: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 10 } },
    templeos_inspiracao3: { nome: "Inspiração Divina III", descricao: "Aumenta o ganho do TempleOS em 15%", icone: "✨✨✨", precoBase: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    templeos_inspiracao4: { nome: "Inspiração Divina IV", descricao: "Reduz o tempo do TempleOS em 7%", icone: "✨✨✨✨", precoBase: 1800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    templeos_inspiracao5: { nome: "Inspiração Divina V", descricao: "Aumenta o ganho do TempleOS em 20%", icone: "✨✨✨✨✨", precoBase: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.20, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    templeos_inspiracao6: { nome: "Inspiração Divina VI", descricao: "Reduz o tempo do TempleOS em 10%", icone: "✨✨✨✨✨✨", precoBase: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 30 } },
    templeos_inspiracao7: { nome: "Inspiração Divina VII", descricao: "Aumenta o ganho do TempleOS em 25%", icone: "✨✨✨✨✨✨✨", precoBase: 2500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.25, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 35 } },
    templeos_inspiracao8: { nome: "Inspiração Divina VIII", descricao: "Reduz o tempo do TempleOS em 12%", icone: "✨✨✨✨✨✨✨✨", precoBase: 2800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 40 } },
    templeos_inspiracao9: { nome: "Inspiração Divina IX", descricao: "Aumenta o ganho do TempleOS em 30%", icone: "✨✨✨✨✨✨✨✨✨", precoBase: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.30, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 45 } },
    templeos_inspiracao10: { nome: "Inspiração Divina X", descricao: "Reduz o tempo do TempleOS em 15%", icone: "✨✨✨✨✨✨✨✨✨✨", precoBase: 3500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 50 } },
    templeos_compilacao: { nome: "Compilação Celestial", descricao: "Aumenta o ganho do TempleOS em 50%", icone: "🌟", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.50, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 60 } },
    templeos_execucao: { nome: "Execução Sagrada", descricao: "Reduz o tempo do TempleOS em 25%", icone: "⛪", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.25, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 70 } },
    templeos_auto: { nome: "Automatização TempleOS", descricao: "Faz o TempleOS reiniciar automaticamente (requer nível 25)", icone: "🤖", precoBase: 5000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, tipo: "linguagem", linguagemId: "templeos", subtipo: "automacao", requisito: { tipo: "compras", valor: 25 } },
    templeos_extra1: { nome: "TempleOS Bênção I", descricao: "Aumenta o ganho do TempleOS em 5%", icone: "✨", precoBase: 800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 5 } },
    templeos_extra2: { nome: "TempleOS Bênção II", descricao: "Aumenta o ganho do TempleOS em 7%", icone: "✨✨", precoBase: 1300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 10 } },
    templeos_extra3: { nome: "TempleOS Bênção III", descricao: "Aumenta o ganho do TempleOS em 10%", icone: "✨✨✨", precoBase: 2000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.10, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 15 } },
    templeos_extra4: { nome: "TempleOS Bênção IV", descricao: "Aumenta o ganho do TempleOS em 12%", icone: "✨✨✨✨", precoBase: 3000, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.12, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 20 } },
    templeos_extra5: { nome: "TempleOS Bênção V", descricao: "Aumenta o ganho do TempleOS em 15%", icone: "✨✨✨✨✨", precoBase: 4500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.15, tipo: "linguagem", linguagemId: "templeos", subtipo: "rendimento", requisito: { tipo: "compras", valor: 25 } },
    templeos_extra6: { nome: "TempleOS Velocidade I", descricao: "Reduz o tempo do TempleOS em 3%", icone: "⏱️", precoBase: 900, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.03, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 8 } },
    templeos_extra7: { nome: "TempleOS Velocidade II", descricao: "Reduz o tempo do TempleOS em 4%", icone: "⏱️", precoBase: 1500, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 14 } },
    templeos_extra8: { nome: "TempleOS Velocidade III", descricao: "Reduz o tempo do TempleOS em 5%", icone: "⏱️", precoBase: 2300, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.05, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 20 } },
    templeos_extra9: { nome: "TempleOS Velocidade IV", descricao: "Reduz o tempo do TempleOS em 6%", icone: "⏱️", precoBase: 3400, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 26 } },
    templeos_extra10: { nome: "TempleOS Velocidade V", descricao: "Reduz o tempo do TempleOS em 7%", icone: "⏱️", precoBase: 4800, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.07, tipo: "linguagem", linguagemId: "templeos", subtipo: "tempo", requisito: { tipo: "compras", valor: 32 } },
    templeos_extra11: { nome: "TempleOS Dual I", descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%", icone: "✨⏱️", precoBase: 1200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.04, tipo: "linguagem", linguagemId: "templeos", subtipo: "ambos", requisito: { tipo: "compras", valor: 12 } },
    templeos_extra12: { nome: "TempleOS Dual II", descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%", icone: "✨⏱️", precoBase: 2200, multiplicadorPreco: 1.0, nivel: 0, nivelMax: 1, efeito: 0.06, tipo: "linguagem", linguagemId: "templeos", subtipo: "ambos", requisito: { tipo: "compras", valor: 22 } }
};

const prestigeUpgradesDataTemplate = {
    prodGlobal1: { nome: "Produção Global +10%", descricao: "Aumenta a produção de todas as linguagens em 10%.", icone: "🌍", preco: 1, nivel: 0, nivelMax: 10, efeito: 0.10, tipo: "global", subtipo: "rendimento", requisito: null, x: 1450, y: 750 },
    tempoGlobal1: { nome: "Velocidade Global +5%", descricao: "Reduz o tempo de todas as linguagens em 5%.", icone: "⏩", preco: 1, nivel: 0, nivelMax: 10, efeito: 0.05, tipo: "global", subtipo: "tempo", requisito: "prodGlobal1", x: 1250, y: 550 },
    tempoGlobal2: { nome: "Aceleração Crítica", descricao: "Reduz o tempo em 3% durante produções críticas.", icone: "⚡", preco: 2, nivel: 0, nivelMax: 8, efeito: 0.03, tipo: "global", subtipo: "tempo_critico", requisito: "tempoGlobal1", x: 1150, y: 450 },
    tempoGlobal3: { nome: "Fluxo Contínuo", descricao: "Reduz o tempo de espera entre produções em 10%.", icone: "🌊", preco: 3, nivel: 0, nivelMax: 6, efeito: 0.10, tipo: "global", subtipo: "tempo_espera", requisito: "tempoGlobal2", x: 1050, y: 350 },
    prodGlobal2: { nome: "Multiplicador Global", descricao: "Multiplica a produção global por 1.05x.", icone: "✨", preco: 2, nivel: 0, nivelMax: 8, efeito: 1.05, tipo: "global", subtipo: "multiplicador", requisito: "prodGlobal1", x: 1650, y: 550 },
    prodGlobal3: { nome: "Surtos de Produtividade", descricao: "Chance de 5% de dobrar a produção por nível.", icone: "🎯", preco: 3, nivel: 0, nivelMax: 5, efeito: 0.05, tipo: "global", subtipo: "sorte_prod", requisito: "prodGlobal2", x: 1750, y: 450 },
    prodGlobal4: { nome: "Onda de Eficiência", descricao: "Produção aumenta 8% durante períodos de baixa atividade.", icone: "🌊", preco: 2, nivel: 0, nivelMax: 7, efeito: 0.08, tipo: "global", subtipo: "eficiencia", requisito: "prodGlobal3", x: 1850, y: 350 },
    priceDiscount: { nome: "Desconto Comercial", descricao: "Reduz o custo de compra de linguagens em 5%.", icone: "💲", preco: 2, nivel: 0, nivelMax: 10, efeito: 0.05, tipo: "global", subtipo: "preco", requisito: "prodGlobal1", x: 1850, y: 650 },
    priceDiscount2: { nome: "Negociação Mestre", descricao: "Reduz custos de upgrades em 3%.", icone: "🤝", preco: 3, nivel: 0, nivelMax: 8, efeito: 0.03, tipo: "global", subtipo: "preco_upgrades", requisito: "priceDiscount", x: 1950, y: 550 },
    priceDiscount3: { nome: "Economia Circular", descricao: "5% de chance de reembolsar custo de compras.", icone: "🔄", preco: 4, nivel: 0, nivelMax: 5, efeito: 0.05, tipo: "global", subtipo: "reembolso", requisito: "priceDiscount2", x: 2050, y: 450 },
    autoClick: { nome: "Automação Claudinho", descricao: "Gera um clique automático por segundo.", icone: "🤖", preco: 3, nivel: 0, nivelMax: 10, efeito: 1, tipo: "global", subtipo: "autoclick", requisito: "priceDiscount", x: 2150, y: 750 },
    autoClick2: { nome: "IA Assistente", descricao: "Cliques automáticos inteligentes que priorizam linguagens mais produtivas.", icone: "🧠", preco: 4, nivel: 0, nivelMax: 6, efeito: 1.5, tipo: "global", subtipo: "autoclick_inteligente", requisito: "autoClick", x: 2350, y: 850 },
    autoClick3: { nome: "Rede Neural", descricao: "Cliques automáticos aprendem e otimizam padrões de produção.", icone: "🕸️", preco: 5, nivel: 0, nivelMax: 4, efeito: 2.0, tipo: "global", subtipo: "autoclick_ml", requisito: "autoClick2", x: 2550, y: 950 },
    bonusIconBoost: { nome: "Amuleto do Bônus", descricao: "Aumenta o valor dos ícones de bônus em 20%.", icone: "⭐", preco: 2, nivel: 0, nivelMax: 10, efeito: 0.20, tipo: "global", subtipo: "bonusicon", requisito: "prodGlobal1", x: 1050, y: 650 },
    bonusIconBoost2: { nome: "Sorte Estelar", descricao: "Chance dobrada de ícones de bônus aparecerem.", icone: "🌟", preco: 3, nivel: 0, nivelMax: 8, efeito: 2.0, tipo: "global", subtipo: "bonusicon_freq", requisito: "bonusIconBoost", x: 950, y: 550 },
    bonusIconBoost3: { nome: "Constelação da Sorte", descricao: "Ícones de bônus podem aparecer em cascata.", icone: "🌌", preco: 4, nivel: 0, nivelMax: 5, efeito: 0.15, tipo: "global", subtipo: "bonusicon_cascata", requisito: "bonusIconBoost2", x: 850, y: 450 },
    multiplicadorClique: { nome: "Clique Poderoso", descricao: "Cliques no Claudinho rendem 50% mais.", icone: "👆", preco: 2, nivel: 0, nivelMax: 10, efeito: 0.50, tipo: "global", subtipo: "clique", requisito: "prodGlobal1", x: 1450, y: 1050 },
    multiplicadorClique2: { nome: "Toque Mágico", descricao: "Cliques têm 10% de chance de serem críticos (3x valor).", icone: "✨", preco: 3, nivel: 0, nivelMax: 8, efeito: 0.10, tipo: "global", subtipo: "clique_critico", requisito: "multiplicadorClique", x: 1550, y: 1150 },
    multiplicadorClique3: { nome: "Combo de Cliques", descricao: "Cliques consecutivos ganham bônus cumulativo.", icone: "🔥", preco: 4, nivel: 0, nivelMax: 6, efeito: 0.05, tipo: "global", subtipo: "clique_combo", requisito: "multiplicadorClique2", x: 1650, y: 1250 },
    htmlBoost: { nome: "HTML Acelerado", descricao: "Aumenta a produção de HTML em 25%.", icone: "🌐", preco: 1, nivel: 0, nivelMax: 10, efeito: 0.25, tipo: "linguagem-especifica", linguagem: "html", subtipo: "rendimento", requisito: "prodGlobal1", x: 1450, y: 450 },
    htmlTimeBoost: { nome: "HTML Otimizado", descricao: "Reduz o tempo de HTML em 15%.", icone: "⚡", preco: 2, nivel: 0, nivelMax: 8, efeito: 0.15, tipo: "linguagem-especifica", linguagem: "html", subtipo: "tempo", requisito: "htmlBoost", x: 1350, y: 350 },
    cssBoost: { nome: "CSS Elegante", descricao: "Aumenta a produção de CSS em 25%.", icone: "🎨", preco: 1, nivel: 0, nivelMax: 10, efeito: 0.25, tipo: "linguagem-especifica", linguagem: "css", subtipo: "rendimento", requisito: "htmlBoost", x: 1550, y: 350 },
    cssTimeBoost: { nome: "CSS Fluido", descricao: "Reduz o tempo de CSS em 15%.", icone: "🌊", preco: 2, nivel: 0, nivelMax: 8, efeito: 0.15, tipo: "linguagem-especifica", linguagem: "css", subtipo: "tempo", requisito: "cssBoost", x: 1650, y: 250 },
    jsBoost: { nome: "JavaScript Dinâmico", descricao: "Aumenta a produção de JavaScript em 25%.", icone: "⚙️", preco: 2, nivel: 0, nivelMax: 10, efeito: 0.25, tipo: "linguagem-especifica", linguagem: "js", subtipo: "rendimento", requisito: "cssBoost", x: 1250, y: 250 },
    jsTimeBoost: { nome: "JavaScript Compilado", descricao: "Reduz o tempo de JavaScript em 15%.", icone: "🚀", preco: 3, nivel: 0, nivelMax: 8, efeito: 0.15, tipo: "linguagem-especifica", linguagem: "js", subtipo: "tempo", requisito: "jsBoost", x: 1150, y: 150 },
    pythonBoost: { nome: "Python Turbo", descricao: "Aumenta a produção de Python em 25%.", icone: "🐍", preco: 2, nivel: 0, nivelMax: 10, efeito: 0.25, tipo: "linguagem-especifica", linguagem: "python", subtipo: "rendimento", requisito: "jsBoost", x: 750, y: 250 },
    pythonTimeBoost: { nome: "Python Otimizado", descricao: "Reduz o tempo de Python em 15%.", icone: "⚡", preco: 3, nivel: 0, nivelMax: 8, efeito: 0.15, tipo: "linguagem-especifica", linguagem: "python", subtipo: "tempo", requisito: "pythonBoost", x: 650, y: 150 },
    javaBoost: { nome: "Java Enterprise", descricao: "Aumenta a produção de Java em 25%.", icone: "☕", preco: 3, nivel: 0, nivelMax: 10, efeito: 0.25, tipo: "linguagem-especifica", linguagem: "java", subtipo: "rendimento", requisito: "pythonBoost", x: 550, y: 50 },
    javaTimeBoost: { nome: "Java JIT", descricao: "Reduz o tempo de Java em 15%.", icone: "⚡", preco: 4, nivel: 0, nivelMax: 8, efeito: 0.15, tipo: "linguagem-especifica", linguagem: "java", subtipo: "tempo", requisito: "javaBoost", x: 450, y: 150 },
    cppBoost: { nome: "C++ Performance", descricao: "Aumenta a produção de C++ em 25%.", icone: "⚡", preco: 4, nivel: 0, nivelMax: 10, efeito: 0.25, tipo: "linguagem-especifica", linguagem: "cpp", subtipo: "rendimento", requisito: "javaBoost", x: 350, y: 50 },
    cppTimeBoost: { nome: "C++ Compilado", descricao: "Reduz o tempo de C++ em 15%.", icone: "🚀", preco: 5, nivel: 0, nivelMax: 8, efeito: 0.15, tipo: "linguagem-especifica", linguagem: "cpp", subtipo: "tempo", requisito: "cppBoost", x: 250, y: 50 },
    offlineProgress: { nome: "Progresso Offline", descricao: "Ganha 10% da produção normal quando offline.", icone: "⏰", preco: 5, nivel: 0, nivelMax: 5, efeito: 0.10, tipo: "global", subtipo: "offline", requisito: "prodGlobal4", x: 1950, y: 250 },
    criticalMultiplier: { nome: "Multiplicador Crítico", descricao: "Produções críticas valem 25% mais por nível.", icone: "💎", preco: 4, nivel: 0, nivelMax: 6, efeito: 0.25, tipo: "global", subtipo: "critico", requisito: "prodGlobal3", x: 1750, y: 150 },
    efficiencyMaster: { nome: "Mestre da Eficiência", descricao: "Reduz todos os custos em 2% e aumenta produção em 3%.", icone: "🎓", preco: 6, nivel: 0, nivelMax: 4, efeito: { custo: 0.02, prod: 0.03 }, tipo: "global", subtipo: "mestre", requisito: "criticalMultiplier", x: 1850, y: 50 }
};

// ------------------------
// INICIALIZAÇÃO DOS DADOS
// ------------------------
let linguagensData = JSON.parse(JSON.stringify(linguagensDataTemplate));
upgradesData = JSON.parse(JSON.stringify(upgradesDataTemplate));
lingUpgradesData = JSON.parse(JSON.stringify(lingUpgradesDataTemplate));
prestigeUpgradesData = JSON.parse(JSON.stringify(prestigeUpgradesDataTemplate));

// ------------------------
// CÁLCULOS DAS LINGUAGENS
// ------------------------
function calcularRecompensaAtual(id) {
    if (calculoCache.recompensa.has(id)) return calculoCache.recompensa.get(id);
    const data = linguagensData[id];
    if (!data) return 0;

    // 1. Valor base (já com o multiplicador de compras, se houver mais de 1)
    let recompensa = data.recompensaBase;
    if (data.compras > 1) {
        recompensa = arredondar(recompensa * (1 + data.multiplicadorRecompensa * (data.compras - 1)));
    }

    // 2. ⭐ Bônus de ascensão (totalPrestigeEarned %) – aplicado SEMPRE, desde a 1ª unidade
    recompensa *= (1 + totalPrestigeEarned / 100);

    // 3. Upgrades de prestígio (efeitos de rendimento, multiplicador, etc.)
    for (const up of Object.values(prestigeUpgradesData)) {
        if (up.nivel > 0) {
            if (up.subtipo === 'rendimento') {
                const efeito = normalizarEfeitoParaMultiploDe5(up.efeito * up.nivel);
                recompensa = arredondar(recompensa * (1 + efeito));
            } else if (up.subtipo === 'multiplicador') {
                const multiplicador = Math.pow(up.efeito, up.nivel);
                recompensa = arredondar(recompensa * multiplicador);
            } else if (up.tipo === 'linguagem-especifica' && up.linguagem === id && up.subtipo === 'rendimento') {
                const efeito = normalizarEfeitoParaMultiploDe5(up.efeito * up.nivel);
                recompensa = arredondar(recompensa * (1 + efeito));
            }
        }
    }

    // 4. Upgrades normais (globais e específicos de linguagem)
    for (const up of Object.values(upgradesData)) {
        if (up.nivel > 0 && up.tipo === 'global') {
            const efeito = normalizarEfeitoParaMultiploDe5(up.efeito);
            if (up.subtipo === 'rendimento' || up.subtipo === 'ambos') {
                recompensa = arredondar(recompensa * (1 + efeito));
            } else if (up.subtipo === 'gambiarra' || up.subtipo === 'vibe') {
                recompensa = arredondar(recompensa * (1 + efeito));
            }
        } else if (up.tipo === 'linguagem-especifica' && up.linguagem === id && up.nivel > 0) {
            const efeito = normalizarEfeitoParaMultiploDe5(up.efeito);
            recompensa = arredondar(recompensa * (1 + efeito));
        }
    }

    for (const up of Object.values(lingUpgradesData)) {
        if (up.linguagemId === id && up.nivel > 0) {
            const efeito = normalizarEfeitoParaMultiploDe5(up.efeito);
            if (up.subtipo === 'rendimento' || up.subtipo === 'ambos') {
                recompensa = arredondar(recompensa * (1 + efeito));
            }
        }
    }

    // 5. Bônus temporário (ícone)
    recompensa *= bonusRewardMultiplier;

    recompensa = arredondar(recompensa);
    calculoCache.recompensa.set(id, recompensa);
    return recompensa;
}

function calcularTempoAtual(id) {
    if (calculoCache.tempo.has(id)) return calculoCache.tempo.get(id);
    const data = linguagensData[id];
    if (!data) return data.tempo;
    let tempo = data.tempo;
    for (const up of Object.values(upgradesData)) {
        if (up.nivel > 0 && up.tipo === 'global') {
            const efeito = normalizarEfeitoParaMultiploDe5(up.efeito);
            if (up.subtipo === 'tempo' || up.subtipo === 'ambos') {
                tempo *= (1 - efeito);
            } else if ((up.subtipo === 'gambiarra' || up.subtipo === 'vibe') && up.efeitoNegativo) {
                tempo *= (1 + up.efeitoNegativo);
            }
        }
    }
    for (const up of Object.values(lingUpgradesData)) {
        if (up.linguagemId === id && up.nivel > 0) {
            const efeito = normalizarEfeitoParaMultiploDe5(up.efeito);
            if (up.subtipo === 'tempo' || up.subtipo === 'ambos') {
                tempo *= (1 - efeito);
            }
        }
    }
    tempo /= bonusSpeedMultiplier;
    tempo = Math.max(0.1, tempo);
    tempo = Math.round(tempo * 10) / 10;
    calculoCache.tempo.set(id, tempo);
    return tempo;
}

function calcularPrecoUnitario(id, quantidade = 1) {
    const data = linguagensData[id];
    if (!data) return 0;
    let precoTotal = 0;
    let precoAtual = data.precoAtual;
    for (let i = 0; i < quantidade; i++) {
        precoTotal += precoAtual;
        precoAtual = arredondar(precoAtual * data.multiplicadorPreco);
    }
    for (const up of Object.values(prestigeUpgradesData)) {
        if (up.nivel > 0 && (up.subtipo === 'preco' || up.subtipo === 'preco_upgrades')) {
            const efeito = normalizarEfeitoParaMultiploDe5(up.efeito);
            const discount = Math.max(0, 1 - efeito * up.nivel);
            precoTotal = Math.max(1, arredondar(precoTotal * discount));
        }
    }
    return arredondar(precoTotal);
}

function calcularPrecoLingUpgrade(id) {
    const upgrade = lingUpgradesData[id];
    if (!upgrade) return 0;
    let preco = arredondar(upgrade.precoBase);
    for (const up of Object.values(prestigeUpgradesData)) {
        if (up.nivel > 0 && (up.subtipo === 'preco' || up.subtipo === 'preco_upgrades')) {
            const efeito = normalizarEfeitoParaMultiploDe5(up.efeito);
            const discount = Math.max(0, 1 - efeito * up.nivel);
            preco = Math.max(1, arredondar(preco * discount));
        }
    }
    return preco;
}

// ------------------------
// PRODUÇÃO E TIMERS
// ------------------------
function iniciarProducao(id) {
    if (gamePaused) return;
    if (activeProductions[id]) return;
    const data = linguagensData[id];
    if (!data || !data.desbloqueada) return;

    const barra = document.getElementById(`barra-${id}`);
    const fill = barra?.querySelector(".progress-fill");
    const timer = barra?.querySelector(".timer-text");
    if (fill) {
        fill.style.transition = 'none';
        fill.style.width = "0%";
        fill.offsetHeight;
        fill.style.transition = 'width 0.45s cubic-bezier(.22,.9,.36,1)';
        fill.style.width = '100%';
    }
    const tempoAtual = calcularTempoAtual(id);
    if (timer) timer.textContent = formatarTempo(tempoAtual);

    activeProductions[id] = { startTime: Date.now(), totalDuration: tempoAtual };
    iniciarAnimacaoBarras();
}

function completarProducao(id) {
    const recompensa = calcularRecompensaAtual(id);
    money = arredondar(money + recompensa);
    totalMoneyEarned = arredondar(totalMoneyEarned + recompensa);
    prestigeProgress = arredondar(prestigeProgress + recompensa);
    if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);

    verificarProgressoAscensao();

    const agora = Date.now();
    agendarAtualizacaoUpgrades(agora);
    agendarAtualizacaoEstatisticas(agora);

    const icon = document.querySelector(`.clickable[data-id="${id}"]`);
    if (icon) criarPopUpDinheiro(recompensa, icon, 50);

    const barra = document.getElementById(`barra-${id}`);
    if (barra) {
        const fill = barra.querySelector(".progress-fill");
        const timer = barra.querySelector(".timer-text");
        if (fill) {
            fill.style.transition = 'none';
            fill.style.width = "0%";
            fill.offsetHeight;
            fill.style.transition = 'width 0.45s cubic-bezier(.22,.9,.36,1)';
        }
        if (timer) timer.textContent = "00:00";
        barra.classList.remove("shake");
    }
    delete activeProductions[id];

    const data = linguagensData[id];
    if (data && data.automatic) {
        iniciarProducao(id);
        return;
    }
    setTimeout(() => { if (barra) barra.classList.add("shake"); }, 250);
}

function ajustarTimerParaUpgrade(id) {
    if (!activeProductions[id]) return;
    const prod = activeProductions[id];
    const agora = Date.now();
    const elapsed = (agora - prod.startTime) / 1000;
    const novoTempo = calcularTempoAtual(id);
    if (elapsed >= novoTempo) {
        delete activeProductions[id];
        completarProducao(id);
    } else {
        prod.totalDuration = novoTempo;
    }
}

function iniciarAnimacaoBarras() {
    if (animationFrameId || gamePaused) return;
    function loop() {
        if (gamePaused) {
            animationFrameId = null;
            return;
        }
        let algumaAtiva = false;
        const agora = Date.now();
        for (const [id, prod] of Object.entries(activeProductions)) {
            algumaAtiva = true;
            const elapsed = (agora - prod.startTime) / 1000;
            if (elapsed >= prod.totalDuration) {
                delete activeProductions[id];
                completarProducao(id);
            } else {
                const barra = document.getElementById(`barra-${id}`);
                if (barra) {
                    const fill = barra.querySelector(".progress-fill");
                    const timer = barra.querySelector(".timer-text");
                    if (fill) fill.style.width = (elapsed / prod.totalDuration) * 100 + "%";
                    if (timer) timer.textContent = formatarTempo(prod.totalDuration - elapsed);
                }
            }
        }
        if (algumaAtiva) {
            animationFrameId = requestAnimationFrame(loop);
        } else {
            animationFrameId = null;
        }
    }
    animationFrameId = requestAnimationFrame(loop);
}

function criarPopUpDinheiro(valor, elementoReferencia, raio = 50) {
    if (!elementoReferencia) return;
    const popUp = document.createElement('div');
    popUp.textContent = `+$${formatarDinheiro(valor)}`;
    popUp.classList.add('money-popup');
    popUp.style.position = 'fixed';
    popUp.style.color = '#27ae60';
    popUp.style.fontWeight = 'bold';
    popUp.style.fontSize = '16px';
    popUp.style.zIndex = '10000';
    popUp.style.pointerEvents = 'none';
    popUp.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
    popUp.style.animation = 'moneyParticle 1.5s ease-out forwards';
    popUp.style.background = 'rgba(39, 174, 96, 0.2)';
    popUp.style.padding = '5px 10px';
    popUp.style.borderRadius = '5px';
    popUp.style.border = '2px solid #27ae60';
    popUp.style.whiteSpace = 'nowrap';

    let centroX = window.innerWidth / 2;
    let centroY = window.innerHeight / 2;
    try {
        const rect = elementoReferencia.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            centroX = rect.left + rect.width / 2;
            centroY = rect.top + rect.height / 2;
        }
    } catch (e) {}
    const angulo = Math.random() * 2 * Math.PI;
    const distancia = Math.random() * raio;
    const offsetX = Math.cos(angulo) * distancia;
    const offsetY = Math.sin(angulo) * distancia;
    popUp.style.left = (centroX + offsetX) + 'px';
    popUp.style.top = (centroY + offsetY) + 'px';
    popUp.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(popUp);
    setTimeout(() => { if (popUp.parentNode) popUp.remove(); }, 1500);
}

// ------------------------
// PAUSA / RETOMADA
// ------------------------
function pausarJogo() {
    if (pauseState.active) return;
    pauseState.active = true;
    gamePaused = true;
    pauseState.pausedAt = Date.now();
    for (const [id, prod] of Object.entries(activeProductions)) {
        const elapsed = (Date.now() - prod.startTime) / 1000;
        const remain = Math.max(0, prod.totalDuration - elapsed);
        pauseState.productionRemains[id] = remain;
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    document.body.style.pointerEvents = 'none';
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => { m.style.pointerEvents = 'auto'; });
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'block';
}

function retomarJogo() {
    if (!pauseState.active) return;
    pauseState.active = false;
    gamePaused = false;
    for (const [id, remain] of Object.entries(pauseState.productionRemains)) {
        activeProductions[id] = { startTime: Date.now(), totalDuration: remain };
    }
    pauseState.productionRemains = {};
    iniciarAnimacaoBarras();
    document.body.style.pointerEvents = '';
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'none';
}

// ------------------------
// UPGRADES GLOBAIS E DE LINGUAGEM
// ------------------------
function verificarRequisitoLingUpgrade(upgrade) {
    if (!upgrade.requisito) return true;
    const data = linguagensData[upgrade.linguagemId];
    if (!data) return false;
    if (upgrade.requisito.tipo === 'compras') return data.compras >= upgrade.requisito.valor;
    return false;
}

function verificarSeUpgradeGlobalDeveAparecer(upgradeId, upgradeData) {
    if (upgradeData.nivel >= upgradeData.nivelMax) return false;
    if (elementosUpgrades.has(`global_${upgradeId}`)) return true;
    const limite = upgradeData.limiteAparecimento || (upgradeData.precoAtual * 0.5);
    return money >= upgradeData.precoAtual || money >= limite;
}

function verificarSeLingUpgradeDeveAparecer(upgradeId, upgradeData) {
    if (upgradeData.nivel >= upgradeData.nivelMax) return false;
    if (elementosUpgrades.has(`linguagem_${upgradeId}`)) return true;
    if (!verificarRequisitoLingUpgrade(upgradeData)) return false;
    const dataLinguagem = linguagensData[upgradeData.linguagemId];
    if (!dataLinguagem || !dataLinguagem.desbloqueada) return false;
    const preco = calcularPrecoLingUpgrade(upgradeId);
    return money >= preco || money >= preco * 0.5;
}

function atualizarTodosUpgrades() {
    const lista = document.getElementById('all-upgrades');
    const noUpgradesMessage = document.getElementById('no-upgrades-message');
    if (!lista) return;

    const upgradesDisponiveis = new Map();

    for (const [id, upgrade] of Object.entries(upgradesData)) {
        if (upgrade.nivel < upgrade.nivelMax && verificarSeUpgradeGlobalDeveAparecer(id, upgrade)) {
            const upgradeId = `global_${id}`;
            let timestamp = upgradeTimestamps.get(upgradeId);
            if (!timestamp) {
                timestamp = Date.now();
                upgradeTimestamps.set(upgradeId, timestamp);
            }
            upgradesDisponiveis.set(upgradeId, {
                id, tipo: 'global', data: upgrade,
                preco: upgrade.precoAtual,
                disponivel: money >= upgrade.precoAtual,
                nivel: upgrade.nivel, nivelMax: upgrade.nivelMax,
                upgradeId, timestamp
            });
        }
    }

    for (const [id, upgrade] of Object.entries(lingUpgradesData)) {
        if (upgrade.nivel < upgrade.nivelMax && verificarSeLingUpgradeDeveAparecer(id, upgrade)) {
            const upgradeId = `linguagem_${id}`;
            let timestamp = upgradeTimestamps.get(upgradeId);
            if (!timestamp) {
                timestamp = Date.now();
                upgradeTimestamps.set(upgradeId, timestamp);
            }
            const preco = calcularPrecoLingUpgrade(id);
            upgradesDisponiveis.set(upgradeId, {
                id, tipo: 'linguagem', data: upgrade,
                preco, disponivel: money >= preco,
                nivel: upgrade.nivel, nivelMax: upgrade.nivelMax,
                linguagemId: upgrade.linguagemId,
                upgradeId, timestamp
            });
        }
    }

    if (upgradesDisponiveis.size === 0) {
        if (noUpgradesMessage) noUpgradesMessage.style.display = 'block';
        lista.innerHTML = '';
        elementosUpgrades.clear();
        ajustarAlturaListaUpgrades();
        return;
    } else {
        if (noUpgradesMessage) noUpgradesMessage.style.display = 'none';
    }

    const upgradesOrdenados = Array.from(upgradesDisponiveis.values()).sort((a, b) => b.timestamp - a.timestamp);
    const fragment = document.createDocumentFragment();

    for (const info of upgradesOrdenados) {
        let elemento = elementosUpgrades.get(info.upgradeId);
        if (!elemento) {
            elemento = criarElementoUpgrade(info);
            elementosUpgrades.set(info.upgradeId, elemento);
        } else {
            atualizarElementoUpgrade(elemento, info);
        }
        fragment.appendChild(elemento);
    }

    for (const [upId, el] of elementosUpgrades) {
        if (!upgradesDisponiveis.has(upId) && el.parentNode === lista) {
            el.remove();
            elementosUpgrades.delete(upId);
            upgradeTimestamps.delete(upId);
        }
    }

    lista.innerHTML = '';
    lista.appendChild(fragment);
    ajustarAlturaListaUpgrades();
}

function criarElementoUpgrade(upgradeInfo) {
    const { id, tipo, data, preco, disponivel, nivel, linguagemId, upgradeId } = upgradeInfo;
    const row = document.createElement('div');
    row.className = `upgrade-row ${tipo}`;
    row.dataset.id = id;
    row.dataset.tipo = tipo;
    row.dataset.upgradeId = upgradeId;
    if (disponivel) row.classList.add('available');
    if (nivel > 0) row.classList.add('purchased');

    let tooltipText = '';
    const botaoTexto = `Comprar ($${formatarDinheiro(preco)})`;

    if (tipo === 'global') {
        tooltipText = data.descricao;
        row.innerHTML = `
            <div class="upgrade-icon-row">${data.icone}</div>
            <div class="upgrade-info-row">
                <div class="upgrade-name-row">${data.nome}</div>
                <div class="upgrade-details-row">
                    <span class="upgrade-status-row ${disponivel ? 'available' : 'locked'}">${disponivel ? '!' : '$'}</span>
                </div>
            </div>
            <button class="upgrade-btn-row ${disponivel ? 'available' : ''}" data-id="${id}" data-tipo="global" ${!disponivel ? 'disabled' : ''}>${botaoTexto}</button>
            <div class="upgrade-tooltip">${tooltipText}</div>
        `;
    } else {
        const linguagemData = linguagensData[linguagemId];
        const recompensa = calcularRecompensaAtual(linguagemId);
        const tempo = calcularTempoAtual(linguagemId);
        tooltipText = `${data.descricao}\n💰 Valor: $${formatarDinheiro(recompensa)}\n⏱️ Tempo: ${formatarTempo(tempo)}`;
        if (data.requisito) tooltipText += `\nRequer: ${data.requisito.valor} unidades de ${linguagemId.toUpperCase()}`;
        row.innerHTML = `
            <div class="upgrade-icon-row ${linguagemId}">${data.icone}</div>
            <div class="upgrade-info-row">
                <div class="upgrade-name-row">${data.nome}</div>
                <div class="upgrade-details-row">
                    <span class="upgrade-status-row ${disponivel ? 'available' : 'locked'}">${disponivel ? '!' : '#'}</span>
                </div>
            </div>
            <button class="upgrade-btn-row ${disponivel ? 'available' : ''}" data-id="${id}" data-tipo="linguagem" ${!disponivel ? 'disabled' : ''}>${botaoTexto}</button>
            <div class="upgrade-tooltip">${tooltipText}</div>
        `;
    }

    row.addEventListener('mouseenter', function(e) {
        if (!tooltipEl) tooltipEl = document.getElementById('custom-tooltip');
        if (!tooltipEl) return;
        const tooltipDiv = this.querySelector('.upgrade-tooltip');
        const descricao = tooltipDiv ? tooltipDiv.textContent : 'Descrição indisponível';
        tooltipEl.textContent = descricao;
        tooltipEl.classList.add('visible');
        tooltipEl.style.left = e.pageX + 15 + 'px';
        tooltipEl.style.top = e.pageY - 30 + 'px';
        this.classList.remove('novo-upgrade');
    });
    row.addEventListener('mousemove', function(e) {
        if (!tooltipEl) return;
        if (tooltipEl.classList.contains('visible')) {
            tooltipEl.style.left = e.pageX + 15 + 'px';
            tooltipEl.style.top = e.pageY - 30 + 'px';
        }
    });
    row.addEventListener('mouseleave', function() {
        if (!tooltipEl) return;
        tooltipEl.classList.remove('visible');
    });
    return row;
}

function atualizarElementoUpgrade(elemento, upgradeInfo) {
    const { id, tipo, data, preco, disponivel, nivel, linguagemId, upgradeId } = upgradeInfo;
    elemento.className = `upgrade-row ${tipo}`;
    if (disponivel) elemento.classList.add('available');
    else elemento.classList.remove('available');
    if (nivel > 0) elemento.classList.add('purchased');
    else elemento.classList.remove('purchased');

    const botaoTexto = `Comprar ($${formatarDinheiro(preco)})`;
    if (tipo === 'global') {
        const icon = elemento.querySelector('.upgrade-icon-row');
        const name = elemento.querySelector('.upgrade-name-row');
        const status = elemento.querySelector('.upgrade-status-row');
        const btn = elemento.querySelector('.upgrade-btn-row');
        const tooltip = elemento.querySelector('.upgrade-tooltip');
        if (icon) icon.textContent = data.icone;
        if (name) name.textContent = data.nome;
        if (status) {
            status.className = `upgrade-status-row ${disponivel ? 'available' : 'locked'}`;
            status.textContent = disponivel ? '!' : '$';
        }
        if (btn) {
            btn.className = `upgrade-btn-row ${disponivel ? 'available' : ''}`;
            btn.disabled = !disponivel;
            btn.textContent = botaoTexto;
        }
        if (tooltip) tooltip.textContent = data.descricao;
    } else {
        const linguagemData = linguagensData[linguagemId];
        const recompensa = calcularRecompensaAtual(linguagemId);
        const tempo = calcularTempoAtual(linguagemId);
        let tooltipText = `${data.descricao}\n💰 Valor: $${formatarDinheiro(recompensa)}\n⏱️ Tempo: ${formatarTempo(tempo)}`;
        if (data.requisito) tooltipText += `\nRequer: ${data.requisito.valor} unidades de ${linguagemId.toUpperCase()}`;
        const icon = elemento.querySelector('.upgrade-icon-row');
        const name = elemento.querySelector('.upgrade-name-row');
        const status = elemento.querySelector('.upgrade-status-row');
        const btn = elemento.querySelector('.upgrade-btn-row');
        const tooltip = elemento.querySelector('.upgrade-tooltip');
        if (icon) {
            icon.className = `upgrade-icon-row ${linguagemId}`;
            icon.textContent = data.icone;
        }
        if (name) name.textContent = data.nome;
        if (status) {
            status.className = `upgrade-status-row ${disponivel ? 'available' : 'locked'}`;
            status.textContent = disponivel ? '!' : '#';
        }
        if (btn) {
            btn.className = `upgrade-btn-row ${disponivel ? 'available' : ''}`;
            btn.disabled = !disponivel;
            btn.textContent = botaoTexto;
        }
        if (tooltip) tooltip.textContent = tooltipText;
    }
}

function comprarUpgrade(id) {
    const upgrade = upgradesData[id];
    if (!upgrade) return false;
    if (upgrade.nivel >= upgrade.nivelMax) return false;
    if (money < upgrade.precoAtual) return false;

    money = arredondar(money - upgrade.precoAtual);
    if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);
    upgrade.nivel = 1;
    invalidarCacheCalculos();

    if (upgrade.subtipo === 'tempo' || upgrade.subtipo === 'ambos' || upgrade.subtipo === 'gambiarra' || upgrade.subtipo === 'vibe') {
        for (const langId in activeProductions) ajustarTimerParaUpgrade(langId);
    }

    atualizarTodosUpgrades();
    atualizarEstatisticas();
    atualizarInterfaceLinguagens();
    mostrarFeedback(`✅ ${upgrade.nome} comprado!`, 'success');
    return true;
}

function comprarLingUpgrade(id) {
    const upgrade = lingUpgradesData[id];
    const linguagemId = upgrade.linguagemId;
    const data = linguagensData[linguagemId];
    if (!upgrade || !data) return false;
    if (!verificarRequisitoLingUpgrade(upgrade)) return false;
    if (upgrade.nivel >= upgrade.nivelMax) return false;

    const preco = calcularPrecoLingUpgrade(id);
    if (money < preco) return false;

    money = arredondar(money - preco);
    if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);
    upgrade.nivel = 1;
    invalidarCacheCalculos();

    if (upgrade.subtipo === 'tempo' || upgrade.subtipo === 'ambos') {
        if (activeProductions[linguagemId]) ajustarTimerParaUpgrade(linguagemId);
    }
    if (upgrade.subtipo === 'automacao') {
        data.automatic = true;
        if (!activeProductions[linguagemId]) {
            const img = document.querySelector(`.clickable[data-id="${linguagemId}"]`);
            if (img) img.click();
        }
    }

    atualizarTodosUpgrades();
    atualizarInterfaceLinguagens();
    atualizarEstatisticas();
    mostrarFeedback(`✅ ${upgrade.nome} comprado!`, 'success');
    return true;
}

// ------------------------
// COMPRA DE LINGUAGENS
// ------------------------
function comprarLinguagemMultipla(id, quantidade) {
    const data = linguagensData[id];
    if (!data) return false;
    const precoTotal = calcularPrecoUnitario(id, quantidade);
    if (money < precoTotal) return false;

    money = arredondar(money - precoTotal);
    if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);

    for (let i = 0; i < quantidade; i++) {
        data.compras++;
        data.precoAtual = arredondar(data.precoAtual * data.multiplicadorPreco);
    }
    invalidarCacheCalculos();

    if (!data.desbloqueada && id !== "html") {
        data.desbloqueada = true;
        const ling = document.querySelector(`.ling[data-id="${id}"]`);
        if (ling) {
            ling.dataset.locked = "false";
            const img = ling.querySelector("img");
            if (img) {
                img.style.filter = "none";
                img.style.opacity = "1";
            }
        }
        mostrarFeedback(`🔓 Linguagem ${id.toUpperCase()} desbloqueada!`, 'success');
    }

    const countEl = document.querySelector(`.ling[data-id="${id}"] .compra-count`);
    if (countEl) countEl.textContent = data.compras;

    atualizarTodosUpgrades();
    atualizarEstatisticas();
    atualizarInterfaceLinguagens();
    return true;
}

function atualizarInterfaceLinguagens() {
    document.querySelectorAll(".ling").forEach(ling => {
        const id = ling.dataset.id;
        const data = linguagensData[id];
        if (!data) return;

        const precoTotal = calcularPrecoUnitario(id, multiplicadorCompra);
        const btn = ling.querySelector(".buy-btn");
        if (btn) {
            if (multiplicadorCompra > 1) {
                btn.innerHTML = `Comprar x${multiplicadorCompra}<br><span class="preco-pequeno">$${formatarDinheiro(precoTotal)}</span>`;
            } else {
                btn.innerHTML = `Comprar<br><span class="preco-pequeno">$${formatarDinheiro(precoTotal)}</span>`;
            }
        }

        const countEl = ling.querySelector(".compra-count");
        if (countEl) {
            countEl.textContent = data.compras;
            if (data.automatic) countEl.classList.add('automatic-ativo');
            else countEl.classList.remove('automatic-ativo');
        }

        if (data.desbloqueada) {
            ling.dataset.locked = "false";
            const img = ling.querySelector("img");
            if (img) {
                img.style.filter = "none";
                img.style.opacity = "1";
            }
        } else {
            ling.dataset.locked = "true";
            const img = ling.querySelector("img");
            if (img) {
                img.style.filter = "grayscale(100%)";
                img.style.opacity = "0.5";
            }
        }
    });
    ajustarAlturaListaUpgrades();
}

// ------------------------
// ASCENSÃO (PRESTIGE)
// ------------------------
function calcularProximoMarco() {
    // Cada vez que a barra enche, o próximo marco aumenta 5%
    return PRESTIGE_BASE * Math.pow(1.05, totalBarCompletions);
}

function concederPontoAscensao() {
    const proximoMarco = calcularProximoMarco();
    if (prestigeProgress >= proximoMarco) {
        // Quantos pontos podemos conceder? Vamos conceder 1 por vez (para manter o jogo fluido)
        // Mas se o progresso for muito maior, podemos conceder múltiplos.
        let pontos = Math.floor(prestigeProgress / proximoMarco);
        if (pontos > 0) {
            totalPrestigeEarned += pontos;
            prestigePoints += pontos;
            prestigeProgress -= proximoMarco * pontos;
            invalidarCacheCalculos();
            mostrarFeedback(`⭐ +${pontos} ponto(s) de ascensão! Total: ${prestigePoints}`, 'success');
            // Recalcula o próximo marco (já que totalPrestigeEarned mudou)
            // A barra será atualizada na chamada de atualizarDisplayAscensao()
        }
    }
    atualizarDisplayAscensao();
}

function verificarProgressoAscensao() {
    // Desbloqueia a ascensão ao atingir 1Bi total acumulado (opcional)
    if (!prestigeUnlocked && totalMoneyEarned >= PRESTIGE_BASE) {
        prestigeUnlocked = true;
        const container = document.getElementById('ascensionButtonContainer');
        if (container) {
            container.style.display = 'flex';
            container.classList.add('unlocked');
        }
        mostrarFeedback('⭐ Ascensão desbloqueada!', 'success');
        atualizarReferenciasBotoesAscensao();
    }
    if (!prestigeUnlocked) return;

    let proximoMarco = calcularProximoMarco();
    let pontosGanhos = 0;

    // Enquanto o progresso for suficiente para completar o marco
    while (prestigeProgress >= proximoMarco) {
        pontosGanhos++;
        prestigeProgress -= proximoMarco;
        // Recalcula o próximo marco (já que totalBarCompletions vai aumentar)
        totalBarCompletions++;
        proximoMarco = calcularProximoMarco(); // recalcula com o novo totalBarCompletions
    }

    if (pontosGanhos > 0) {
        pendingPrestigePoints += pontosGanhos;
        mostrarFeedback(`⭐ Barra completada! +${pontosGanhos} ponto(s) pendente(s). Total pendente: ${pendingPrestigePoints}`, 'success');
    }

    atualizarDisplayAscensao();
}

function atualizarDisplayAscensao() {
    const container = document.getElementById('ascensionButtonContainer');
    const pointsSpan = document.getElementById('prestigePointsTop');
    const barFill = container?.querySelector('.ascension-bar-fill');
    if (!container) return;

    const proximoMarco = calcularProximoMarco();
    const progresso = Math.min(prestigeProgress / proximoMarco, 1);
    const percentual = progresso * 100;
    if (barFill) barFill.style.width = percentual + '%';
    if (pointsSpan) {
        pointsSpan.textContent = `${formatarDinheiro(prestigeProgress)} / ${formatarDinheiro(proximoMarco)} ⭐ (${percentual.toFixed(1)}%) | Pendentes: ${pendingPrestigePoints}`;
    }
    if (progresso >= 1) container.classList.add('pode-ascender');
    else container.classList.remove('pode-ascender');
}

function tentarAscender() {
    if (gamePaused) return;
    if (pendingPrestigePoints <= 0) {
        mostrarFeedback('Você não tem pontos pendentes! Complete mais ciclos da barra.', 'error');
        return;
    }
    // Abre o modal de confirmação mostrando quantos pontos serão reivindicados
    abrirModalConfirmacaoAscensao(pendingPrestigePoints);
}

function abrirModalConfirmacaoAscensao(pontosGanhos) {
    const modal = document.getElementById('confirm-ascension-modal');
    if (!modal) return;
    pausarJogo();

    const gainEl = document.getElementById('ascension-points-gain');
    const totalEl = document.getElementById('ascension-points-total');
    if (gainEl) gainEl.textContent = pontosGanhos;
    if (totalEl) totalEl.textContent = prestigePoints;

    modal.style.display = 'block';

    const cancelBtn = document.getElementById('cancel-ascension-btn');
    if (cancelBtn) {
        cancelBtn.disabled = false;
        cancelBtn.style.opacity = '1';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
            pendingAscensionPoints = 0; // limpa
            retomarJogo();
        };
    }

    const proceedBtn = document.getElementById('proceed-ascension-btn');
    if (proceedBtn) {
        proceedBtn.onclick = () => {
            modal.style.display = 'none';
            realizarAscensao();          // agora usará pendingAscensionPoints
        };
    }
}

function realizarAscensao() {
    const pontosGanhos = pendingPrestigePoints;
    if (pontosGanhos <= 0) {
        mostrarFeedback('Nenhum ponto pendente para reivindicar!', 'error');
        retomarJogo();
        return;
    }

    // Converte os pontos pendentes em pontos permanentes (bônus e gastáveis)
    totalPrestigeEarned += pontosGanhos;   // bônus de produção
    prestigePoints += pontosGanhos;         // pontos para gastar na árvore

    // Zera os pendentes
    pendingPrestigePoints = 0;

    invalidarCacheCalculos();
    // Reseta o jogo (dinheiro, linguagens, upgrades) mas mantém:
    // - totalBarCompletions (já foi incrementado durante os ciclos)
    // - totalPrestigeEarned (bônus)
    // - prestigePoints (gastáveis)
    resetarJogoPreservandoAscensao();

    // Zera o progresso da barra para a próxima run (já está zerado em resetarJogoPreservandoAscensao)
    // Mas garanta que prestigeProgress = 0 dentro do reset.

    fecharModalConfirmacaoAscensao();
    abrirModalArvoreSkills();
}

function resetarJogoPreservandoAscensao() {
    // Cancela animações e timers (código já existente)
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    if (bonusTimeout) clearTimeout(bonusTimeout);
    if (bonusInterval) clearInterval(bonusInterval);
    if (autoClickInterval) clearInterval(autoClickInterval);
    if (playtimeInterval) clearInterval(playtimeInterval);

    // Limpa produções ativas
    for (const id in activeProductions) delete activeProductions[id];
    pauseState.productionRemains = {};

    // Reseta visualmente as barras
    document.querySelectorAll('.barra').forEach(barra => {
        const fill = barra.querySelector('.progress-fill');
        const timer = barra.querySelector('.timer-text');
        if (fill) {
            fill.style.transition = 'none';
            fill.style.width = '0%';
            fill.offsetHeight;
            fill.style.transition = 'width 0.45s cubic-bezier(.22,.9,.36,1)';
        }
        if (timer) timer.textContent = '00:00';
    });

    const savedTotalBarCompletions = totalBarCompletions;
    const savedTotalPrestigeEarned = totalPrestigeEarned;
    const savedPrestigePoints = prestigePoints;
    const savedPendingPrestigePoints = pendingPrestigePoints;
    const savedPrestigeUpgrades = JSON.parse(JSON.stringify(prestigeUpgradesData));
    const savedPrestigeUnlocked = prestigeUnlocked;

    // Reseta dados do jogo
    linguagensData = JSON.parse(JSON.stringify(linguagensDataTemplate));
    upgradesData = JSON.parse(JSON.stringify(upgradesDataTemplate));
    lingUpgradesData = JSON.parse(JSON.stringify(lingUpgradesDataTemplate));
    money = 0;
    totalMoneyEarned = 0;
    prestigeProgress = 0;

    // Restaura
    totalBarCompletions = savedTotalBarCompletions;
    totalPrestigeEarned = savedTotalPrestigeEarned;
    prestigePoints = savedPrestigePoints;
    pendingPrestigePoints = savedPendingPrestigePoints;
    prestigeUpgradesData = savedPrestigeUpgrades;
    prestigeUnlocked = savedPrestigeUnlocked;

    // Limpa maps de upgrades
    elementosUpgrades.clear();
    upgradeTimestamps.clear();

    // Atualiza interface
    if (moneyEl) moneyEl.textContent = "$0.00";
    inicializarInterface();
    atualizarTodosUpgrades();
    atualizarEstatisticas();

    // Reconfigura barra de ascensão
    const container = document.getElementById('ascensionButtonContainer');
    if (container) {
        if (prestigeUnlocked) {
            container.style.display = 'flex';
            container.classList.add('unlocked');
        } else {
            container.style.display = 'none';
        }
    }
    atualizarDisplayAscensao();

    // Reinicia auto-click
    setupAutoClick();

    // Mantém o jogo pausado (a árvore será aberta em seguida)
    gamePaused = true;
    pauseState.active = true;
    document.body.style.pointerEvents = 'none';
    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'block';
}

function fecharModalConfirmacaoAscensao() {
    const modal = document.getElementById('confirm-ascension-modal');
    if (modal) modal.style.display = 'none';
}

function abrirModalArvoreSkills() {
    const modal = document.getElementById('skill-tree-modal');
    if (!modal) return;
    const pontosElement = document.getElementById('skill-tree-points');
    if (pontosElement) pontosElement.textContent = prestigePoints;
    renderizarArvoreSkills();
    modal.style.display = 'block';
}

function fecharModalArvoreSkills() {
    const modal = document.getElementById('skill-tree-modal');
    if (modal) modal.style.display = 'none';
}

function renderizarArvoreSkills() {
    const canvas = document.getElementById('skill-tree-canvas');
    if (!canvas) return;
    canvas.innerHTML = '';
    for (const [id, upgrade] of Object.entries(prestigeUpgradesData)) {
        if (upgrade.requisito) {
            const req = prestigeUpgradesData[upgrade.requisito];
            if (req) criarConexao(req, upgrade);
        }
    }
    for (const [id, upgrade] of Object.entries(prestigeUpgradesData)) {
        criarNoSkill(id, upgrade);
    }
    implementarArrastarCanvas(canvas);
    implementarZoomCanvas();
}

function criarConexao(fromUpgrade, toUpgrade) {
    const canvas = document.getElementById('skill-tree-canvas');
    const connection = document.createElement('div');
    connection.className = 'skill-connection';
    const x1 = fromUpgrade.x + 40;
    const y1 = fromUpgrade.y + 40;
    const x2 = toUpgrade.x + 40;
    const y2 = toUpgrade.y + 40;
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    connection.style.width = length + 'px';
    connection.style.height = '3px';
    connection.style.left = x1 + 'px';
    connection.style.top = y1 + 'px';
    connection.style.transformOrigin = '0 50%';
    connection.style.transform = `rotate(${angle}deg)`;
    if (!fromUpgrade.requisito || prestigeUpgradesData[fromUpgrade.requisito].nivel > 0) {
        connection.classList.add('unlocked');
    }
    canvas.appendChild(connection);
}

function criarNoSkill(id, upgrade) {
    const canvas = document.getElementById('skill-tree-canvas');
    const node = document.createElement('div');
    node.className = 'skill-node';
    node.textContent = upgrade.icone;
    node.style.left = upgrade.x + 'px';
    node.style.top = upgrade.y + 'px';
    const isUnlocked = !upgrade.requisito || (prestigeUpgradesData[upgrade.requisito] && prestigeUpgradesData[upgrade.requisito].nivel > 0);
    if (isUnlocked) node.classList.add('unlocked');
    if (upgrade.nivel > 0) node.classList.add('owned');

    node.addEventListener('mouseenter', (e) => mostrarTooltipSkill(id, upgrade, e));
    node.addEventListener('mousemove', (e) => atualizarPosicaoTooltip(e));
    node.addEventListener('mouseleave', () => esconderTooltipSkill());
    node.addEventListener('click', () => {
        const isUnlocked = !upgrade.requisito || (prestigeUpgradesData[upgrade.requisito] && prestigeUpgradesData[upgrade.requisito].nivel > 0);
        if (isUnlocked && upgrade.nivel < upgrade.nivelMax && prestigePoints >= upgrade.preco) {
            comprarPrestigeUpgrade(id);
        }
    });
    canvas.appendChild(node);
}

function mostrarTooltipSkill(id, upgrade, e) {
    if (!tooltipEl) tooltipEl = document.getElementById('custom-tooltip');
    if (!tooltipEl) return;
    const isUnlocked = !upgrade.requisito || (prestigeUpgradesData[upgrade.requisito] && prestigeUpgradesData[upgrade.requisito].nivel > 0);
    let tooltipText = `${upgrade.icone} ${upgrade.nome}\n${upgrade.descricao}\n\n⭐ Custo: ${upgrade.preco} pontos\n📊 Nível: ${upgrade.nivel}/${upgrade.nivelMax}`;
    if (!isUnlocked) tooltipText += `\n\n🔒 Requer: ${prestigeUpgradesData[upgrade.requisito]?.nome || '?'}`;
    else if (upgrade.nivel >= upgrade.nivelMax) tooltipText += `\n\n✅ Máximo alcançado!`;
    else if (prestigePoints < upgrade.preco) tooltipText += `\n\n💰 Pontos insuficientes!`;
    else tooltipText += `\n\n🖱️ Clique para comprar`;
    tooltipEl.textContent = tooltipText;
    tooltipEl.classList.add('visible');
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 10;
    if (left < 0) left = 5;
    if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 5;
    if (top < 0) top = rect.bottom + 10;
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
}

function atualizarPosicaoTooltip(e) { /* não faz nada */ }
function esconderTooltipSkill() { if (tooltipEl) tooltipEl.classList.remove('visible'); }

function comprarPrestigeUpgrade(id) {
    const up = prestigeUpgradesData[id];
    if (!up || up.nivel >= up.nivelMax || prestigePoints < up.preco) return;
    prestigePoints -= up.preco;
    up.nivel++;
    // Aplica efeitos (se houver)
    if (up.subtipo === 'tempo' || up.subtipo === 'ambos') {
        for (const lang in activeProductions) ajustarTimerParaUpgrade(lang);
    }
    if (up.subtipo === 'autoclick') setupAutoClick();
    const skillTreePoints = document.getElementById('skill-tree-points');
    if (skillTreePoints) skillTreePoints.textContent = prestigePoints;
    renderizarArvoreSkills();
    mostrarFeedback(`⭐ Upgrade "${up.nome}" adquirido!`, 'success');
}

let currentScale = 1.0;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;

function implementarZoomCanvas() {
    const container = document.getElementById('skill-tree-container');
    const canvas = document.getElementById('skill-tree-canvas');
    const zoomIndicator = document.getElementById('zoom-indicator');
    if (!container) return;
    container.addEventListener('wheel', (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const contentX = scrollLeft + mouseX;
        const contentY = scrollTop + mouseY;
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        let newScale = currentScale + delta;
        newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
        if (newScale === currentScale) return;
        const scaleRatio = newScale / currentScale;
        const newScrollLeft = contentX * scaleRatio - mouseX;
        const newScrollTop = contentY * scaleRatio - mouseY;
        currentScale = newScale;
        canvas.style.transform = `scale(${currentScale})`;
        container.scrollLeft = newScrollLeft;
        container.scrollTop = newScrollTop;
        if (zoomIndicator) {
            zoomIndicator.style.display = 'block';
            zoomIndicator.textContent = `Zoom: ${currentScale.toFixed(1)}x`;
            clearTimeout(window.zoomTimeout);
            window.zoomTimeout = setTimeout(() => { zoomIndicator.style.display = 'none'; }, 1500);
        }
    });
}

function implementarArrastarCanvas(canvas) {
    const container = canvas.parentElement;
    if (!container) return;
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    container.addEventListener('mouseenter', () => { if (!isDragging) container.style.cursor = 'grab'; });
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
        container.style.cursor = 'grabbing';
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const walkX = e.clientX - startX;
        const walkY = e.clientY - startY;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });
}

// ------------------------
// AUTO-CLICK
// ------------------------
function setupAutoClick() {
    if (autoClickInterval) clearInterval(autoClickInterval);
    let totalAutoClicks = 0;
    for (const up of Object.values(prestigeUpgradesData)) {
        if (up.subtipo && up.subtipo.includes('autoclick') && up.nivel > 0) {
            totalAutoClicks += up.nivel * up.efeito;
        }
    }
    if (totalAutoClicks > 0) {
        autoClickInterval = setInterval(() => {
            for (let i = 0; i < Math.floor(totalAutoClicks); i++) {
                const btn = document.getElementById('claudinho-click');
                if (btn) btn.click();
            }
        }, 1000);
    }
}

// ------------------------
// BÔNUS FLUTUANTE
// ------------------------
function somaRecompensasLinguagens() {
    let total = 0;
    for (const id in linguagensData) {
        if (linguagensData[id].desbloqueada) total += calcularRecompensaAtual(id);
    }
    return total;
}

function mostrarBonusIcon() {
    if (bonusIconVisible) return;
    const bonusIcon = document.getElementById('bonus-icon');
    if (!bonusIcon) return;
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    bonusIcon.style.left = Math.random() * maxX + 'px';
    bonusIcon.style.top = Math.random() * maxY + 'px';
    bonusIcon.style.display = 'block';
    // Remove classes anteriores
    bonusIcon.classList.remove('visible', 'hiding');
    // Força o reflow para reiniciar a transição
    void bonusIcon.offsetWidth;
    // Inicia o fade-in (5 segundos)
    bonusIcon.classList.add('visible');
    bonusIconVisible = true;

    // Timer para iniciar o fade-out após 20 segundos (25 total - 5 finais)
    if (window.bonusFadeTimeout) clearTimeout(window.bonusFadeTimeout);
    window.bonusFadeTimeout = setTimeout(() => {
        if (bonusIconVisible) {
            // Inicia o fade-out
            bonusIcon.classList.remove('visible');
            bonusIcon.classList.add('hiding');
            // Remove o ícone após o fim do fade-out (5 segundos)
            setTimeout(() => {
                if (bonusIconVisible) {
                    esconderBonusIcon();
                    agendarProximoBonus();
                }
            }, 5000); // 5 segundos de fade-out
        }
    }, 20000); // 20 segundos visível, depois fade-out de 5 segundos
}

function esconderBonusIcon() {
    const bonusIcon = document.getElementById('bonus-icon');
    if (bonusIcon) {
        bonusIcon.classList.remove('visible', 'hiding');
        bonusIcon.style.display = 'none';
    }
    if (window.bonusFadeTimeout) clearTimeout(window.bonusFadeTimeout);
    bonusIconVisible = false;
}

function atualizarBarraBonus() {
    if (!bonusStartTime) return;
    const agora = Date.now();
    const tempoRestante = Math.max(0, BONUS_DURATION - (agora - bonusStartTime));
    const percentual = (tempoRestante / BONUS_DURATION) * 100;
    const progressFill = document.querySelector('.bonus-progress-fill');
    if (progressFill) progressFill.style.width = percentual + '%';
}

function aplicarBonus() {
    if (bonusTimeout) clearTimeout(bonusTimeout);
    if (bonusInterval) clearInterval(bonusInterval);
    const speedOptions = [5, 10, 15];
    const rewardOptions = [10, 50, 100];
    bonusSpeedMultiplier = speedOptions[Math.floor(Math.random() * speedOptions.length)];
    bonusRewardMultiplier = rewardOptions[Math.floor(Math.random() * rewardOptions.length)];
    invalidarCacheCalculos();

    let bonusMoney = somaRecompensasLinguagens() * 0.15;
    for (const up of Object.values(prestigeUpgradesData)) {
        if (up.nivel > 0 && up.subtipo === 'bonusicon') {
            bonusMoney = arredondar(bonusMoney * (1 + up.efeito * up.nivel));
        }
    }

    const bonusIndicator = document.getElementById('bonus-indicator');
    if (bonusIndicator) {
        bonusIndicator.style.display = 'block';
        bonusIndicator.innerHTML = `
            ⭐ BÔNUS ATIVO!<br>
            Velocidade: x${bonusSpeedMultiplier}<br>
            Recompensa: x${bonusRewardMultiplier}
            <div class="bonus-progress-container">
                <div class="bonus-progress-fill"></div>
            </div>
        `;
    }

    bonusStartTime = Date.now();
    bonusInterval = setInterval(atualizarBarraBonus, 100);
    mostrarFeedback(`⭐ Bônus! +$${formatarDinheiro(bonusMoney)}`, 'success');
    mostrarFeedback(`⚡ Velocidade x${bonusSpeedMultiplier} | 💰 Recompensa x${bonusRewardMultiplier}`, 'success');

    for (const id in activeProductions) ajustarTimerParaUpgrade(id);

    bonusTimeout = setTimeout(() => {
    bonusSpeedMultiplier = 1;
    bonusRewardMultiplier = 1;
    invalidarCacheCalculos();
    if (bonusIndicator) {
        bonusIndicator.style.display = 'none';
        bonusIndicator.innerHTML = '';
    }
    if (bonusInterval) clearInterval(bonusInterval);
    bonusStartTime = null;
    mostrarFeedback('⏰ Bônus terminou!', 'reset');
    for (const id in activeProductions) ajustarTimerParaUpgrade(id);
    
    // Agenda o próximo bônus após o término do bônus atual
    agendarProximoBonus();
}, BONUS_DURATION);
}

function agendarProximoBonus() {
    if (bonusIconVisible || nextBonusScheduled) return;
    let baseDelay = Math.random() * (300000 - 60000) + 60000;
    for (const up of Object.values(prestigeUpgradesData)) {
        if (up.nivel > 0 && up.subtipo === 'bonusicon_freq') {
            baseDelay *= (1 - up.efeito * up.nivel);
        }
    }
    const delay = Math.max(60000, baseDelay);
    nextBonusScheduled = true;
    setTimeout(() => { 
        nextBonusScheduled = false;
        mostrarBonusIcon(); 
    }, delay);
}

function ativarSuperBonus() {
    // Cancela qualquer bônus ativo no momento
    if (bonusTimeout) clearTimeout(bonusTimeout);
    if (bonusInterval) clearInterval(bonusInterval);
    
    // Define os multiplicadores extremos
    bonusSpeedMultiplier = 100;
    bonusRewardMultiplier = 100;
    invalidarCacheCalculos();  // Recalcula recompensas e tempos
    
    // (Opcional) Dá um dinheiro extra como recompensa visual
    let bonusMoney = somaRecompensasLinguagens() * 15; // 15x o total das linguagens
    for (const up of Object.values(prestigeUpgradesData)) {
        if (up.nivel > 0 && up.subtipo === 'bonusicon') {
            bonusMoney = Math.ceil(bonusMoney * (1 + up.efeito * up.nivel));
        }
    }
    mostrarFeedback(`💥 SUPER BÔNUS! +$${formatarDinheiro(bonusMoney)}`, 'success');
    mostrarFeedback(`⚡ Velocidade x${bonusSpeedMultiplier} | 💰 Recompensa x${bonusRewardMultiplier}`, 'success');
    
    // Exibe o indicador de bônus na tela
    const bonusIndicator = document.getElementById('bonus-indicator');
    if (bonusIndicator) {
        bonusIndicator.style.display = 'block';
        bonusIndicator.innerHTML = `
            ⭐ SUPER BÔNUS ATIVO!<br>
            Velocidade: x${bonusSpeedMultiplier}<br>
            Recompensa: x${bonusRewardMultiplier}
            <div class="bonus-progress-container">
                <div class="bonus-progress-fill"></div>
            </div>
        `;
    }
    
    bonusStartTime = Date.now();
    bonusInterval = setInterval(atualizarBarraBonus, 100);
    
    // Ajusta os timers de todas as produções ativas (para refletir a nova velocidade)
    for (const id in activeProductions) ajustarTimerParaUpgrade(id);
    
    // Duração padrão do bônus (60 segundos)
    bonusTimeout = setTimeout(() => {
        bonusSpeedMultiplier = 1;
        bonusRewardMultiplier = 1;
        invalidarCacheCalculos();
        if (bonusIndicator) {
            bonusIndicator.style.display = 'none';
            bonusIndicator.innerHTML = '';
        }
        if (bonusInterval) clearInterval(bonusInterval);
        bonusStartTime = null;
        mostrarFeedback('⏰ Super bônus terminou!', 'reset');
        for (const id in activeProductions) ajustarTimerParaUpgrade(id);
    }, BONUS_DURATION);
}

// ------------------------
// ESTATÍSTICAS E UI
// ------------------------
function formatarTempoJogo() {
    const agora = Date.now();
    const diferenca = agora - startTime;
    const segundos = Math.floor(diferenca / 1000);
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
}

function contarLinguagensDesbloqueadas() {
    return Object.values(linguagensData).filter(l => l.desbloqueada).length;
}
function contarTotalUnidades() {
    return Object.values(linguagensData).reduce((acc, l) => acc + l.compras, 0);
}
function contarUpgradesComprados() {
    const globais = Object.values(upgradesData).filter(u => u.nivel > 0).length;
    const linguagem = Object.values(lingUpgradesData).filter(u => u.nivel > 0).length;
    return globais + linguagem;
}
function contarUpgradesAtivos() { return contarUpgradesComprados(); }
function contarLinguagensAutomaticas() {
    return Object.values(linguagensData).filter(l => l.automatic).length;
}

function atualizarEstatisticas() {
    const modal = document.getElementById('menu-modal');
    const isModalVisible = modal && modal.style.display !== 'none';

    const statTotalEarned = document.getElementById('stat-total-earned');
    const statUnlocked = document.getElementById('stat-unlocked');
    const statTotalUnits = document.getElementById('stat-total-units');
    const statPlaytime = document.getElementById('stat-playtime');
    const statUpgrades = document.getElementById('stat-upgrades');
    const statActiveUpgrades = document.getElementById('stat-active-upgrades');
    const statAutoProducoes = document.getElementById('stat-autoproducoes');
    const statPrestigeBonus = document.getElementById('stat-prestige-bonus');
    const statAscensionLevel = document.getElementById('stat-ascension-level');

    if (statTotalEarned) statTotalEarned.textContent = `$${formatarDinheiro(totalMoneyEarned)}`;
    if (statUnlocked) statUnlocked.textContent = `${contarLinguagensDesbloqueadas()}/10`;
    if (statTotalUnits) statTotalUnits.textContent = contarTotalUnidades();
    if (statPlaytime) statPlaytime.textContent = formatarTempoJogo();
    if (statUpgrades) statUpgrades.textContent = contarUpgradesComprados();
    if (statActiveUpgrades) statActiveUpgrades.textContent = contarUpgradesAtivos();
    if (statAutoProducoes) statAutoProducoes.textContent = contarLinguagensAutomaticas();
    if (statPrestigeBonus) statPrestigeBonus.textContent = `${prestigePoints} ⭐ (Total: ${totalPrestigeEarned} pontos, bônus ${totalPrestigeEarned}%)`;
    if (statAscensionLevel) statAscensionLevel.textContent = `Bônus total: ${totalPrestigeEarned}%`;

    if (!isModalVisible) return;

    const lista = document.getElementById('linguagens-stats-list');
    if (lista) {
        lista.innerHTML = '';
        const linguagensOrdenadas = Object.entries(linguagensData).sort(([a], [b]) => a.localeCompare(b));
        for (const [id, data] of linguagensOrdenadas) {
            const item = document.createElement('div');
            item.className = 'lang-stat-item';
            const recompensa = calcularRecompensaAtual(id);
            const tempo = calcularTempoAtual(id);
            const statusIcon = data.desbloqueada ? '✅' : '🔒';
            const automaticIcon = data.automatic ? ' 🔄' : '';
            item.innerHTML = `
                <span class="lang-stat-name ${data.desbloqueada ? 'unlocked' : 'locked'}" title="${id}">
                    ${statusIcon} ${id.toUpperCase()}${automaticIcon}
                </span>
                <span class="lang-stat-value">
                    ${data.compras} un<br>
                    $${formatarDinheiro(recompensa)}<br>
                    ${formatarTempo(tempo)}
                </span>
            `;
            lista.appendChild(item);
        }
    }
}

function ajustarAlturaListaUpgrades() {
    const agora = Date.now();
    if (agora - lastAlturaAjuste < ALTURA_AJUSTE_INTERVAL) return;
    lastAlturaAjuste = agora;
    requestAnimationFrame(() => {
        const linguagens = document.querySelector('.linguagens');
        const upgradesContainer = document.querySelector('.upgrades-container');
        if (linguagens && upgradesContainer) {
            upgradesContainer.style.height = linguagens.offsetHeight + 'px';
        }
    });
}

function agendarAtualizacaoUpgrades(agora) {
    if (agora - lastUpgradeUpdate > UPGRADE_UPDATE_INTERVAL) {
        atualizarTodosUpgrades();
        lastUpgradeUpdate = agora;
        pendingUpgradeUpdate = false;
    } else if (!pendingUpgradeUpdate) {
        pendingUpgradeUpdate = true;
        setTimeout(() => {
            if (pendingUpgradeUpdate) {
                atualizarTodosUpgrades();
                lastUpgradeUpdate = Date.now();
                pendingUpgradeUpdate = false;
            }
        }, UPGRADE_UPDATE_INTERVAL - (agora - lastUpgradeUpdate));
    }
}

function agendarAtualizacaoEstatisticas(agora) {
    if (agora - lastStatsUpdate > STATS_UPDATE_INTERVAL) {
        atualizarEstatisticas();
        lastStatsUpdate = agora;
        pendingStatsUpdate = false;
    } else if (!pendingStatsUpdate) {
        pendingStatsUpdate = true;
        setTimeout(() => {
            if (pendingStatsUpdate) {
                atualizarEstatisticas();
                lastStatsUpdate = Date.now();
                pendingStatsUpdate = false;
            }
        }, STATS_UPDATE_INTERVAL - (agora - lastStatsUpdate));
    }
}

// ------------------------
// MENU, DEBUG E RESET
// ------------------------
function abrirMenu() {
    const modal = document.getElementById('menu-modal');
    if (modal) {
        modal.style.display = 'block';
        atualizarEstatisticas();
        const statsTab = document.querySelector('[data-tab="stats"]');
        if (statsTab) statsTab.click();
    }
}
function fecharMenu() {
    const modal = document.getElementById('menu-modal');
    if (modal) modal.style.display = 'none';
}
function adicionarDinheiro(quantia) {
    money = arredondar(money + quantia);
    totalMoneyEarned = arredondar(totalMoneyEarned + quantia);
    prestigeProgress = arredondar(prestigeProgress + quantia);
    if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);
    verificarProgressoAscensao();
    atualizarEstatisticas();
    atualizarTodosUpgrades();
    mostrarFeedback(`+$${formatarDinheiro(quantia)} adicionado!`, 'success');
}

function resetarJogo() {
    if (bonusTimeout) clearTimeout(bonusTimeout);
    if (bonusInterval) clearInterval(bonusInterval);
    if (autoClickInterval) clearInterval(autoClickInterval);
    if (playtimeInterval) clearInterval(playtimeInterval);

    money = 0;
    totalMoneyEarned = 0;
    prestigeUnlocked = false;
    prestigePoints = 0;
    prestigeBonus = 0;
    prestigeProgress = 0;
    prestigePointsGainedThisRun = 0;
    totalBonus = 0;
    for (const key in prestigeUpgradesData) prestigeUpgradesData[key].nivel = 0;

    linguagensData = JSON.parse(JSON.stringify(linguagensDataTemplate));
    upgradesData = JSON.parse(JSON.stringify(upgradesDataTemplate));
    lingUpgradesData = JSON.parse(JSON.stringify(lingUpgradesDataTemplate));

    for (const id in activeProductions) delete activeProductions[id];
    for (const key in progressoAtivo) progressoAtivo[key] = false;
    elementosUpgrades.clear();
    upgradeTimestamps.clear();

    document.querySelectorAll('.barra').forEach(barra => {
        const fill = barra.querySelector('.progress-fill');
        const timer = barra.querySelector('.timer-text');
        if (fill) {
            fill.style.transition = 'none';
            fill.style.width = '0%';
            fill.offsetHeight;
            fill.style.transition = 'width 0.45s cubic-bezier(.22,.9,.36,1)';
        }
        if (timer) timer.textContent = '00:00';
    });

    if (moneyEl) moneyEl.textContent = "$0.00";
    document.getElementById('ascensionButtonContainer').style.display = 'none';

    startTime = Date.now();
    iniciarTemporizador();

    inicializarInterface();
    atualizarTodosUpgrades();
    atualizarEstatisticas();
    ajustarAlturaListaUpgrades();
    mostrarFeedback('✅ Jogo resetado com sucesso!', 'reset');
}

function iniciarTemporizador() {
    if (playtimeInterval) clearInterval(playtimeInterval);
    startTime = Date.now();
    playtimeInterval = setInterval(() => {
        const menuModal = document.getElementById('menu-modal');
        if (menuModal && menuModal.style.display === 'block') atualizarEstatisticas();
    }, 1000);
}

function mostrarConfirmacaoReset() {
    const modal = document.getElementById('confirm-reset-modal');
    if (modal) {
        modal.style.display = 'block';
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.reset-confirm-btn');
        if (cancelBtn) cancelBtn.onclick = () => modal.style.display = 'none';
        if (confirmBtn) confirmBtn.onclick = () => {
            modal.style.display = 'none';
            resetarJogo();
            fecharMenu();
        };
        modal.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
    }
}

function mostrarConfirmacaoDinheiro() {
    const modal = document.getElementById('confirm-money-modal');
    if (modal) {
        modal.style.display = 'block';
        const currentBalance = document.getElementById('current-balance');
        const newBalance = document.getElementById('new-balance');
        if (currentBalance) currentBalance.textContent = `$${formatarDinheiro(money)}`;
        if (newBalance) newBalance.textContent = `$${formatarDinheiro(money + 100000)}`;
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.add-money-confirm-btn');
        if (cancelBtn) cancelBtn.onclick = () => modal.style.display = 'none';
        if (confirmBtn) confirmBtn.onclick = () => {
            adicionarDinheiro(100000);
            modal.style.display = 'none';
        };
        modal.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
    }
}

function inicializarMenu() {
    const openMenuBtn = document.getElementById('open-menu');
    if (openMenuBtn) openMenuBtn.addEventListener('click', abrirMenu);
    const closeMenuBtn = document.querySelector('.close-menu');
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', fecharMenu);
    const superBonusBtn = document.getElementById('super-bonus-btn');
    if (superBonusBtn) superBonusBtn.addEventListener('click', ativarSuperBonus);

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('menu-modal');
        if (event.target === modal) fecharMenu();
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabContent = document.getElementById(`${tabId}-tab`);
            if (tabContent) tabContent.classList.add('active');
            if (tabId === 'stats') atualizarEstatisticas();
        });
    });
    const addMoneyBtn = document.getElementById('add-100k-btn');
    if (addMoneyBtn) addMoneyBtn.addEventListener('click', mostrarConfirmacaoDinheiro);
    const resetGameBtn = document.getElementById('reset-game-btn');
    if (resetGameBtn) resetGameBtn.addEventListener('click', mostrarConfirmacaoReset);
}

function inicializarControlesMultiplicador() {
    const botoes = document.querySelectorAll('.multiplicador-btn');
    if (!botoes.length) return;
    botoes.forEach(botao => {
        botao.addEventListener('click', function() {
            multiplicadorCompra = parseInt(this.dataset.mult);
            botoes.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            atualizarInterfaceLinguagens();
            mostrarFeedback(`Multiplicador definido para x${multiplicadorCompra}`, 'success');
        });
    });
}

function inicializarInterface() {
    inicializarControlesMultiplicador();

    document.querySelectorAll(".ling").forEach(ling => {
        const id = ling.dataset.id;
        const data = linguagensData[id];
        if (!data) return;
        const precoTotal = calcularPrecoUnitario(id, multiplicadorCompra);
        const btn = ling.querySelector(".buy-btn");
        if (btn) {
            if (multiplicadorCompra > 1) {
                btn.innerHTML = `Comprar x${multiplicadorCompra}<br><span class="preco-pequeno">$${formatarDinheiro(precoTotal)}</span>`;
            } else {
                btn.innerHTML = `Comprar<br><span class="preco-pequeno">$${formatarDinheiro(precoTotal)}</span>`;
            }
            btn.replaceWith(btn.cloneNode(true));
        }
        const countEl = ling.querySelector(".compra-count");
        if (countEl) countEl.textContent = data.compras;
        if (data.desbloqueada) {
            ling.dataset.locked = "false";
            const img = ling.querySelector("img");
            if (img) {
                img.style.filter = "none";
                img.style.opacity = "1";
            }
        } else {
            ling.dataset.locked = "true";
            const img = ling.querySelector("img");
            if (img) {
                img.style.filter = "grayscale(100%)";
                img.style.opacity = "0.5";
            }
        }
        const bonusIcon = document.getElementById('bonus-icon');
        if (bonusIcon) {
            bonusIcon.addEventListener('click', () => {
            if (!bonusIconVisible) return;
            if (window.bonusFadeTimeout) clearTimeout(window.bonusFadeTimeout);
            aplicarBonus();
            esconderBonusIcon();
            agendarProximoBonus();
        });
    }
});

    document.querySelectorAll(".buy-btn").forEach(btn => {
        btn.addEventListener("click", (event) => {
            event.stopPropagation();
            if (gamePaused) return;
            const id = btn.dataset.id;
            if (!comprarLinguagemMultipla(id, multiplicadorCompra)) {
                btn.classList.add("shake");
                setTimeout(() => btn.classList.remove("shake"), 300);
            }
        });
    });

    document.querySelectorAll(".clickable").forEach(img => {
        img.addEventListener("click", () => {
            const id = img.dataset.id;
            iniciarProducao(id);
        });
    });

    document.getElementById('claudinho-click').addEventListener('click', function() {
        if (gamePaused) return;
        let ganhoBase = 0.10;
        for (const up of Object.values(upgradesData)) {
            if (up.nivel > 0 && up.tipo === 'global' && up.subtipo === 'clique') {
                const efeito = normalizarEfeitoParaMultiploDe5(up.efeito);
                ganhoBase = arredondar(ganhoBase * (1 + efeito));
            }
        }
        ganhoBase *= (1 + totalBonus / 100);
        money += ganhoBase;
        totalMoneyEarned += ganhoBase;
        prestigeProgress += ganhoBase;
        verificarProgressoAscensao();
        if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);
        criarPopUpDinheiro(ganhoBase, this, 30);
        agendarAtualizacaoUpgrades(Date.now());
        agendarAtualizacaoEstatisticas(Date.now());
    });

    document.addEventListener('click', (event) => {
        if (gamePaused) return;
        const btn = event.target.closest('.upgrade-btn-row');
        if (!btn) return;
        event.stopPropagation();
        const id = btn.dataset.id;
        const tipo = btn.dataset.tipo;
        if (tipo === 'linguagem') comprarLingUpgrade(id);
        else if (tipo === 'global') comprarUpgrade(id);
    });

    atualizarTodosUpgrades();
    ajustarAlturaListaUpgrades();
    setupAutoClick();
    atualizarReferenciasBotoesAscensao();
}

function inicializarSidebar() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const openMenuFromSidebar = document.getElementById('open-menu-from-sidebar');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            hamburgerBtn.classList.remove('active');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', () => {
            hamburgerBtn.classList.remove('active');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
    if (openMenuFromSidebar) {
        openMenuFromSidebar.addEventListener('click', () => {
            hamburgerBtn.classList.remove('active');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            setTimeout(() => abrirMenu(), 200);
        });
    }
}

let ascensionBarListenerAdded = false;

function atualizarReferenciasBotoesAscensao() {
    const ascensionBar = document.getElementById('ascensionButtonContainer');
    if (ascensionBar && !ascensionBarListenerAdded) {
        ascensionBar.addEventListener('click', tentarAscender);
        ascensionBarListenerAdded = true;
    }

    const closeSkillTreeBtn = document.querySelector('.close-skill-tree');
    if (closeSkillTreeBtn) {
        closeSkillTreeBtn.addEventListener('click', () => {
            fecharModalArvoreSkills();
            retomarJogo();   // agora retoma o jogo
        });
    }

    const skillTreeAscendBtn = document.getElementById('skill-tree-ascend-btn');
    if (skillTreeAscendBtn) {
        skillTreeAscendBtn.addEventListener('click', () => {
            fecharModalArvoreSkills();
            retomarJogo();
            mostrarFeedback('⭐ Upgrades aplicados! Continue progredindo.', 'success');
        });
    }

    
}

function initTooltip() {
    tooltipEl = document.getElementById('custom-tooltip');
    if (tooltipEl) {
        tooltipEl.classList.remove('visible');
        tooltipEl.textContent = '';
    }
}

function observarLinguagens() {
    const linguagens = document.querySelector('.linguagens');
    if (!linguagens) return;
    if (window.resizeObserver) window.resizeObserver.disconnect();
    window.resizeObserver = new ResizeObserver(() => ajustarAlturaListaUpgrades());
    window.resizeObserver.observe(linguagens);
}

function ajustarProporcao() {
    const LARGURA_BASE = 1920;
    const ALTURA_BASE = 1080;
    const larguraAtual = window.innerWidth;
    const alturaAtual = window.innerHeight;
    let fatorEscala = Math.min(larguraAtual / LARGURA_BASE, alturaAtual / ALTURA_BASE);
    fatorEscala = Math.min(Math.max(fatorEscala, 0.625), 1);
    document.documentElement.style.setProperty('--scale', fatorEscala);
}

// ------------------------
// INICIALIZAÇÃO DO JOGO
// ------------------------
document.addEventListener('DOMContentLoaded', () => {
    try {
        iniciarTemporizador();
        inicializarInterface();
        inicializarMenu();
        inicializarSidebar();
        atualizarEstatisticas();
        initTooltip();
        ajustarAlturaListaUpgrades();
        observarLinguagens();
        agendarProximoBonus();
        window.addEventListener('resize', () => {
            ajustarAlturaListaUpgrades();
            ajustarProporcao();
        });
        ajustarProporcao();
        document.addEventListener('keydown', (event) => {
            if (event.key === 'm' || event.key === 'M') abrirMenu();
            if (event.key === 'r' || event.key === 'R') {
                if (confirm('Tem certeza que deseja resetar TODO o progresso do jogo?\nIsso inclui dinheiro, linguagens, upgrades, ascensão e o tempo de jogo!')) resetarJogo();
            }
            if (event.key === 'u' || event.key === 'U') {
                atualizarTodosUpgrades();
                console.log('⚡ Display dos upgrades atualizado via tecla U');
            }
            if (event.key === 'g' || event.key === 'G') adicionarDinheiro(100000000000);
        });
        console.log('✅ I.T Adventure iniciado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar o jogo:', error);
        mostrarFeedback('❌ Erro ao carregar o jogo!', 'error');
    }
});