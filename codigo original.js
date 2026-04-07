// =======================
// I.T Adventure - Sistema Completo com Ascensão (Prestige)
// =======================

// Sistema de sufixos para grandes números
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

// ⚡ OTIMIZAÇÃO: Cache para formatação de números (evita recálculo)
const formatCache = new Map();
const CACHE_THRESHOLD = 0.01; // só recomputa se mudou 1% o valor

function formatarDinheiro(valor) {
    const cacheKey = Math.floor(valor * 100); // limita a granularidade do cache
    if (formatCache.has(cacheKey)) {
        return formatCache.get(cacheKey);
    }
    
    const resultado = formatarGrandeNumero(valor);
    
    // Manter cache limitado (máx 1000 entradas)
    if (formatCache.size > 1000) {
        const firstKey = formatCache.keys().next().value;
        formatCache.delete(firstKey);
    }
    
    formatCache.set(cacheKey, resultado);
    return resultado;
}

function arredondar(valor) {
    return Math.round(valor * 100) / 100;
}

// Normaliza efeitos de upgrades para múltiplos de 5% (arredonda para cima)
function normalizarEfeitoParaMultiploDe5(efeito) {
    // Converte para percentual e arredonda para cima ao múltiplo de 5 mais próximo
    const percentual = Math.ceil((efeito * 100) / 5) * 5;
    return percentual / 100;
}

// Aplica bônus com arredondamento para cima
function aplicarBonusComArredondamento(valor, bonus) {
    return Math.ceil(valor * (1 + bonus));
}

// =======================
// VARIÁVEIS GLOBAIS
// =======================
let money = 0.00;
let totalMoneyEarned = 0.00;
let gamePaused = false; // pausa o jogo durante menu de ascensão
const moneyEl = document.getElementById("money");
if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);

let startTime = Date.now();
let playtimeInterval = null;

// Controle de pausa para ascensão
let pauseState = {
    active: false,
    pausedAt: 0,
    productionRemains: {} // { linguagemId: remainSeconds }
};

// Mapa de produções ativas
let activeProductions = {};

let animationFrameId = null;

let progressoAtivo = {};

let elementosUpgrades = new Map();

// Timestamps para ordenar upgrades por novidade
let upgradeTimestamps = new Map();

// Sistema de multiplicador de compra
let multiplicadorCompra = 1;

// =======================
// POP-UP DE DESCRIÇÃO (SEGUE O MOUSE)
// =======================
let tooltipEl = null;

// =======================
// SISTEMA DE OTIMIZAÇÃO - THROTTLE/DEBOUNCE
// =======================
let lastUpgradeUpdate = 0;
let lastStatsUpdate = 0;
let lastMoneyUpdate = 0;
let pendingUpgradeUpdate = false;
let pendingStatsUpdate = false;
const UPGRADE_UPDATE_INTERVAL = 100; // atualizar upgrades a cada 100ms
const STATS_UPDATE_INTERVAL = 150;   // atualizar stats a cada 150ms
const MONEY_UPDATE_INTERVAL = 50;    // atualizar dinheiro a cada 50ms
let cachedMoney = 0;
let cachedTotalMoneyEarned = 0;

// =======================
// DADOS DAS LINGUAGENS
// =======================
const linguagensDataTemplate = {
    html: {
        tempo: 10,
        recompensaBase: 1.50,
        precoBase: 10.00,
        precoAtual: 10.00,
        multiplicadorPreco: 1.02,
        multiplicadorRecompensa: 0.4,
        compras: 1,
        desbloqueada: true,
        automatic: false
    },
    python: {
        tempo: 30,
        recompensaBase: 8.00,
        precoBase: 25.00,
        precoAtual: 25.00,
        multiplicadorPreco: 1.04,
        multiplicadorRecompensa: 0.4,
        compras: 0,
        desbloqueada: false,
        automatic: false
    },
    java: {
        tempo: 60,
        recompensaBase: 25.00,
        precoBase: 50.00,
        precoAtual: 50.00,
        multiplicadorPreco: 1.06,
        multiplicadorRecompensa: 0.4,
        compras: 0,
        desbloqueada: false,
        automatic: false
    },
    c: {
        tempo: 180,
        recompensaBase: 80.00,
        precoBase: 250.00,
        precoAtual: 250.00,
        multiplicadorPreco: 1.08,
        multiplicadorRecompensa: 0.4,
        compras: 0,
        desbloqueada: false,
        automatic: false
    },
    ts: {
        tempo: 600,
        recompensaBase: 250.00,
        precoBase: 500.00,
        precoAtual: 500.00,
        multiplicadorPreco: 1.10,
        multiplicadorRecompensa: 0.4,
        compras: 0,
        desbloqueada: false,
        automatic: false
    },
    flutter: {
        tempo: 1800,
        recompensaBase: 800.00,
        precoBase: 2500.00,
        precoAtual: 2500.00,
        multiplicadorPreco: 1.12,
        multiplicadorRecompensa: 0.4,
        compras: 0,
        desbloqueada: false,
        automatic: false
    },
    rust: {
        tempo: 3600,
        recompensaBase: 2500.00,
        precoBase: 5000.00,
        precoAtual: 5000.00,
        multiplicadorPreco: 1.14,
        multiplicadorRecompensa: 0.4,
        compras: 0,
        desbloqueada: false,
        automatic: false
    },
    cobol: {
        tempo: 7200,
        recompensaBase: 8000.00,
        precoBase: 25000.00,
        precoAtual: 25000.00,
        multiplicadorPreco: 1.16,
        multiplicadorRecompensa: 0.4,
        compras: 0,
        desbloqueada: false,
        automatic: false
    },
    assembly: {
        tempo: 14400,
        recompensaBase: 25000.00,
        precoBase: 50000.00,
        precoAtual: 50000.00,
        multiplicadorPreco: 1.18,
        multiplicadorRecompensa: 0.4,
        compras: 0,
        desbloqueada: false,
        automatic: false
    },
    templeos: {
        tempo: 28800,
        recompensaBase: 80000.00,
        precoBase: 250000.00,
        precoAtual: 250000.00,
        multiplicadorPreco: 1.20,
        multiplicadorRecompensa: 0.4,
        compras: 0,
        desbloqueada: false,
        automatic: false
    }
};

let linguagensData = JSON.parse(JSON.stringify(linguagensDataTemplate));

// =======================
// UPGRADES GLOBAIS (GERAIS) - Compra única
// =======================
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

let upgradesData = JSON.parse(JSON.stringify(upgradesDataTemplate));

// =======================
// UPGRADES DE LINGUAGEM (ESPECÍFICOS) - Compra única
// =======================
const lingUpgradesDataTemplate = {
    // HTML
    html_css: {
        nome: "CSS Integrado",
        descricao: "Aumenta o ganho do HTML em 10%",
        icone: "🎨",
        precoBase: 200,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    html_seo: {
        nome: "SEO Estruturado",
        descricao: "Aumenta o ganho do HTML em 15%",
        icone: "🔍",
        precoBase: 400,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 10 }
    },
    html_estendido: {
        nome: "HTML5 Estendido",
        descricao: "Reduz o tempo do HTML em 10%",
        icone: "🌐",
        precoBase: 300,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.08,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 15 }
    },
    html_semantica: {
        nome: "Semântica Perfeita",
        descricao: "Aumenta o ganho do HTML em 20%",
        icone: "🏷️",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.20,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 20 }
    },
    html_auto: {
        nome: "Automatização HTML",
        descricao: "Faz o HTML reiniciar automaticamente após cada ciclo (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },

    // Python
    python_tensorflow: {
        nome: "TensorFlow Light",
        descricao: "Aumenta o ganho do Python em 15%",
        icone: "🧠",
        precoBase: 500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "python",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    python_sklearn: {
        nome: "Scikit-learn Overclock",
        descricao: "Reduz o tempo do Python em 10%",
        icone: "📊",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.07,
        tipo: "linguagem",
        linguagemId: "python",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    python_fastapi: {
        nome: "FastAPI Boost",
        descricao: "Aumenta o ganho do Python em 15%",
        icone: "⚡",
        precoBase: 700,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "python",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    python_pandas: {
        nome: "Pandas Avançado",
        descricao: "Reduz o tempo do Python em 10%",
        icone: "🐼",
        precoBase: 550,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.06,
        tipo: "linguagem",
        linguagemId: "python",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    python_numpy: {
        nome: "NumPy Otimizado",
        descricao: "Aumenta o ganho do Python em 10%",
        icone: "🔢",
        precoBase: 450,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "python",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 8 }
    },
    python_reducao: {
        nome: "Redução de Tempo de Execução",
        descricao: "Reduz o tempo do Python em 10%",
        icone: "⏱️",
        precoBase: 800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "python",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 30 }
    },
    python_multiprocess: {
        nome: "Multiprocessamento Expandido",
        descricao: "Aumenta o ganho do Python em 20%",
        icone: "⚙️",
        precoBase: 1000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.18,
        tipo: "linguagem",
        linguagemId: "python",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 40 }
    },
    python_auto: {
        nome: "Automatização Python",
        descricao: "Faz o Python reiniciar automaticamente (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "python",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },

    // Java
    java_springboot: {
        nome: "Springboot",
        descricao: "Aumenta o ganho do Java em 20%",
        icone: "🍃",
        precoBase: 800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.20,
        tipo: "linguagem",
        linguagemId: "java",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    java_springsecurity: {
        nome: "Spring Security",
        descricao: "Reduz o tempo do Java em 10%",
        icone: "🔒",
        precoBase: 700,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.08,
        tipo: "linguagem",
        linguagemId: "java",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    java_quarkus: {
        nome: "Quarkus",
        descricao: "Aumenta o ganho do Java em 15%",
        icone: "🚀",
        precoBase: 900,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "java",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    java_micronaut: {
        nome: "Micronaut",
        descricao: "Reduz o tempo do Java em 10%",
        icone: "🌌",
        precoBase: 850,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.07,
        tipo: "linguagem",
        linguagemId: "java",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    java_jvm: {
        nome: "JVM Otimizada",
        descricao: "Aumenta o ganho do Java em 15%",
        icone: "☕",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "java",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 8 }
    },
    java_gc: {
        nome: "Garbage Collector Inteligente",
        descricao: "Reduz o tempo do Java em 10%",
        icone: "🗑️",
        precoBase: 750,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "java",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 25 }
    },
    java_maven: {
        nome: "Maven Ultimate Build",
        descricao: "Aumenta o ganho do Java em 18%",
        icone: "📦",
        precoBase: 950,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.18,
        tipo: "linguagem",
        linguagemId: "java",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 30 }
    },
    java_microservices: {
        nome: "Microserviços Automatizados",
        descricao: "Reduz o tempo do Java em 12%",
        icone: "🔧",
        precoBase: 1200,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "java",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 40 }
    },
    java_auto: {
        nome: "Automatização Java",
        descricao: "Faz o Java reiniciar automaticamente (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "java",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },

    // C
    c_ponteiros: {
        nome: "Ponteiros Otimizados",
        descricao: "Aumenta o ganho do C em 15%",
        icone: "👉",
        precoBase: 400,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "c",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    c_gerenciamento: {
        nome: "Gerenciamento Manual Aprimorado",
        descricao: "Reduz o tempo do C em 7%",
        icone: "✋",
        precoBase: 450,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.07,
        tipo: "linguagem",
        linguagemId: "c",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    c_biblioteca: {
        nome: "Biblioteca de Performance Insana",
        descricao: "Aumenta o ganho do C em 20%",
        icone: "📚",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.20,
        tipo: "linguagem",
        linguagemId: "c",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    c_compilacao: {
        nome: "Compilação Ultra Rápida com GCC++",
        descricao: "Reduz o tempo do C em 10%",
        icone: "⚡",
        precoBase: 700,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "c",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    c_bitshifting: {
        nome: "Bit Shifting Avançado",
        descricao: "Aumenta o ganho do C em 12%",
        icone: "🔄",
        precoBase: 500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "c",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 8 }
    },
    c_naoseguro: {
        nome: "Código Não-seguro Otimizado",
        descricao: "Reduz o tempo do C em 8%",
        icone: "⚠️",
        precoBase: 550,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.08,
        tipo: "linguagem",
        linguagemId: "c",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 12 }
    },
    c_compilacaoParalela: {
        nome: "Compilação Paralela Avançada",
        descricao: "Aumenta o ganho do C em 18%",
        icone: "⚙️",
        precoBase: 900,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.18,
        tipo: "linguagem",
        linguagemId: "c",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 30 }
    },
    c_auto: {
        nome: "Automatização C",
        descricao: "Faz o C reiniciar automaticamente (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "c",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },

    // TypeScript
    ts_reactnative: {
        nome: "React Native",
        descricao: "Aumenta o ganho do TypeScript em 20%",
        icone: "📱",
        precoBase: 800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.20,
        tipo: "linguagem",
        linguagemId: "ts",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    ts_strict: {
        nome: "Strict Mode Supremo",
        descricao: "Reduz o tempo do TypeScript em 8%",
        icone: "🔒",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.08,
        tipo: "linguagem",
        linguagemId: "ts",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    ts_tipagem: {
        nome: "Tipagem Profunda",
        descricao: "Aumenta o ganho do TypeScript em 15%",
        icone: "🔍",
        precoBase: 700,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "ts",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    ts_decorators: {
        nome: "Decorators V2",
        descricao: "Reduz o tempo do TypeScript em 7%",
        icone: "🎀",
        precoBase: 650,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.07,
        tipo: "linguagem",
        linguagemId: "ts",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    ts_auto: {
        nome: "Automatização TypeScript",
        descricao: "Faz o TypeScript reiniciar automaticamente (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "ts",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },

    // JavaScript (mapeado para ts por enquanto)
    js_node: {
        nome: "Node.js",
        descricao: "Aumenta o ganho do JavaScript em 20%",
        icone: "🟢",
        precoBase: 700,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.20,
        tipo: "linguagem",
        linguagemId: "ts", // temporário
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },

    // Flutter
    flutter_skia: {
        nome: "Skia Booster",
        descricao: "Aumenta o ganho do Flutter em 12%",
        icone: "🎨",
        precoBase: 500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "flutter",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    flutter_componentes: {
        nome: "Componentes Customizados",
        descricao: "Reduz o tempo do Flutter em 6%",
        icone: "🧩",
        precoBase: 550,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.06,
        tipo: "linguagem",
        linguagemId: "flutter",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    flutter_animacoes: {
        nome: "Animações Otimizadas",
        descricao: "Aumenta o ganho do Flutter em 15%",
        icone: "✨",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "flutter",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    flutter_hotReload: {
        nome: "Hot Reload Aprimorado",
        descricao: "Reduz o tempo do Flutter em 10%",
        icone: "🔥",
        precoBase: 700,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "flutter",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    flutter_widgets: {
        nome: "Widgets Avançados",
        descricao: "Aumenta o ganho do Flutter em 18%",
        icone: "📦",
        precoBase: 650,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.18,
        tipo: "linguagem",
        linguagemId: "flutter",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 8 }
    },
    flutter_material: {
        nome: "Material You++",
        descricao: "Reduz o tempo do Flutter em 8%",
        icone: "🎭",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.08,
        tipo: "linguagem",
        linguagemId: "flutter",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 12 }
    },
    flutter_cross: {
        nome: "Cross-Plataforma Expandido",
        descricao: "Aumenta o ganho do Flutter em 22%",
        icone: "🌍",
        precoBase: 900,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.22,
        tipo: "linguagem",
        linguagemId: "flutter",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 30 }
    },
    flutter_auto: {
        nome: "Automatização Flutter",
        descricao: "Faz o Flutter reiniciar automaticamente (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "flutter",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },

    // Rust
    rust_crates: {
        nome: "Crates Especializados",
        descricao: "Aumenta o ganho do Rust em 14%",
        icone: "📦",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.14,
        tipo: "linguagem",
        linguagemId: "rust",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    rust_compile: {
        nome: "Compile Time Wizard",
        descricao: "Reduz o tempo do Rust em 8%",
        icone: "⚡",
        precoBase: 700,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.08,
        tipo: "linguagem",
        linguagemId: "rust",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    rust_serenity: {
        nome: "Serenity Engine",
        descricao: "Aumenta o ganho do Rust em 18%",
        icone: "🧘",
        precoBase: 800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.18,
        tipo: "linguagem",
        linguagemId: "rust",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    rust_ownership: {
        nome: "Ownership Aprimorado",
        descricao: "Reduz o tempo do Rust em 7%",
        icone: "🔒",
        precoBase: 650,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.07,
        tipo: "linguagem",
        linguagemId: "rust",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    rust_borrow: {
        nome: "Borrow Checker Otimizado",
        descricao: "Aumenta o ganho do Rust em 12%",
        icone: "🔍",
        precoBase: 550,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "rust",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 8 }
    },
    rust_macros: {
        nome: "Macros Místicas",
        descricao: "Reduz o tempo do Rust em 10%",
        icone: "🔮",
        precoBase: 750,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "rust",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 25 }
    },
    rust_auto: {
        nome: "Automatização Rust",
        descricao: "Faz o Rust reiniciar automaticamente (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "rust",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },

    // COBOL
    cobol_mainframe: {
        nome: "Mainframe Modernizado",
        descricao: "Aumenta o ganho do COBOL em 10%",
        icone: "🏢",
        precoBase: 400,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "cobol",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    cobol_modernizacao: {
        nome: "Modernização Inexistente",
        descricao: "Reduz o tempo do COBOL em 5% (raro)",
        icone: "🕰️",
        precoBase: 500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.05,
        tipo: "linguagem",
        linguagemId: "cobol",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    cobol_3000: {
        nome: "Cobol 3000 (Só Memes)",
        descricao: "Aumenta o ganho do COBOL em 15% (ironia)",
        icone: "😄",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "cobol",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    cobol_relatorios: {
        nome: "Estruturas de Relatório Avançadas",
        descricao: "Reduz o tempo do COBOL em 7%",
        icone: "📊",
        precoBase: 550,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.07,
        tipo: "linguagem",
        linguagemId: "cobol",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    cobol_auto: {
        nome: "Automatização COBOL",
        descricao: "Faz o COBOL reiniciar automaticamente (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "cobol",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },

    // Assembly
    assembly_simd: {
        nome: "Instruções SIMD",
        descricao: "Aumenta o ganho do Assembly em 20%",
        icone: "⚡",
        precoBase: 700,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.20,
        tipo: "linguagem",
        linguagemId: "assembly",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    assembly_baixoNivel: {
        nome: "Operações de Baixo Nível",
        descricao: "Reduz o tempo do Assembly em 8%",
        icone: "🔧",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.08,
        tipo: "linguagem",
        linguagemId: "assembly",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    assembly_doom: {
        nome: "Programar DOOM",
        descricao: "Aumenta o ganho do Assembly em 25%",
        icone: "👾",
        precoBase: 1000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.25,
        tipo: "linguagem",
        linguagemId: "assembly",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    assembly_instrucoes: {
        nome: "Instruções Otimizadas",
        descricao: "Reduz o tempo do Assembly em 10%",
        icone: "⚙️",
        precoBase: 650,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "assembly",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 8 }
    },
    assembly_registradores: {
        nome: "Manipulação Direta de Registradores",
        descricao: "Aumenta o ganho do Assembly em 18%",
        icone: "📟",
        precoBase: 750,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.18,
        tipo: "linguagem",
        linguagemId: "assembly",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 12 }
    },
    assembly_hex: {
        nome: "Código Hex Energizado",
        descricao: "Reduz o tempo do Assembly em 12%",
        icone: "🔢",
        precoBase: 800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "assembly",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    assembly_auto: {
        nome: "Automatização Assembly",
        descricao: "Faz o Assembly reiniciar automaticamente (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "assembly",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },

    // TempleOS
    templeos_inspiracao1: {
        nome: "Inspiração Divina I",
        descricao: "Aumenta o ganho do TempleOS em 10%",
        icone: "✨",
        precoBase: 1000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 5 }
    },
    templeos_inspiracao2: {
        nome: "Inspiração Divina II",
        descricao: "Reduz o tempo do TempleOS em 5%",
        icone: "✨✨",
        precoBase: 1200,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.05,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    templeos_inspiracao3: {
        nome: "Inspiração Divina III",
        descricao: "Aumenta o ganho do TempleOS em 15%",
        icone: "✨✨✨",
        precoBase: 1500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    templeos_inspiracao4: {
        nome: "Inspiração Divina IV",
        descricao: "Reduz o tempo do TempleOS em 7%",
        icone: "✨✨✨✨",
        precoBase: 1800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.07,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    templeos_inspiracao5: {
        nome: "Inspiração Divina V",
        descricao: "Aumenta o ganho do TempleOS em 20%",
        icone: "✨✨✨✨✨",
        precoBase: 2000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.20,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 25 }
    },
    templeos_inspiracao6: {
        nome: "Inspiração Divina VI",
        descricao: "Reduz o tempo do TempleOS em 10%",
        icone: "✨✨✨✨✨✨",
        precoBase: 2200,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 30 }
    },
    templeos_inspiracao7: {
        nome: "Inspiração Divina VII",
        descricao: "Aumenta o ganho do TempleOS em 25%",
        icone: "✨✨✨✨✨✨✨",
        precoBase: 2500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.25,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 35 }
    },
    templeos_inspiracao8: {
        nome: "Inspiração Divina VIII",
        descricao: "Reduz o tempo do TempleOS em 12%",
        icone: "✨✨✨✨✨✨✨✨",
        precoBase: 2800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 40 }
    },
    templeos_inspiracao9: {
        nome: "Inspiração Divina IX",
        descricao: "Aumenta o ganho do TempleOS em 30%",
        icone: "✨✨✨✨✨✨✨✨✨",
        precoBase: 3000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.30,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 45 }
    },
    templeos_inspiracao10: {
        nome: "Inspiração Divina X",
        descricao: "Reduz o tempo do TempleOS em 15%",
        icone: "✨✨✨✨✨✨✨✨✨✨",
        precoBase: 3500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 50 }
    },
    templeos_compilacao: {
        nome: "Compilação Celestial",
        descricao: "Aumenta o ganho do TempleOS em 50%",
        icone: "🌟",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.50,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 60 }
    },
    templeos_execucao: {
        nome: "Execução Sagrada",
        descricao: "Reduz o tempo do TempleOS em 25%",
        icone: "⛪",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.25,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 70 }
    },
    templeos_auto: {
        nome: "Automatização TempleOS",
        descricao: "Faz o TempleOS reiniciar automaticamente (requer nível 25)",
        icone: "🤖",
        precoBase: 5000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        tipo: "linguagem",
        linguagemId: "templeos",
        subtipo: "automacao",
        requisito: { tipo: "compras", valor: 25 }
    },
    html_boost1: {
        nome: "HTML Básico Avançado",
        descricao: "Aumenta o ganho do HTML em 5%",
        icone: "🌐",
        precoBase: 200,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.05,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 3 }
    },
    html_boost2: {
        nome: "HTML Intermediário",
        descricao: "Aumenta o ganho do HTML em 7%",
        icone: "🌐",
        precoBase: 350,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.07,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 6 }
    },
    html_boost3: {
        nome: "HTML Avançado",
        descricao: "Aumenta o ganho do HTML em 10%",
        icone: "🌐",
        precoBase: 600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 10 }
    },
    html_boost4: {
        nome: "HTML Expert",
        descricao: "Aumenta o ganho do HTML em 12%",
        icone: "🌐",
        precoBase: 900,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 15 }
    },
    html_boost5: {
        nome: "HTML Master",
        descricao: "Aumenta o ganho do HTML em 15%",
        icone: "🌐",
        precoBase: 1500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 20 }
    },
    html_boost6: {
        nome: "HTML Legend",
        descricao: "Aumenta o ganho do HTML em 20%",
        icone: "🌐",
        precoBase: 2500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.20,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 25 }
    },
    html_time1: {
        nome: "HTML Acelerado I",
        descricao: "Reduz o tempo do HTML em 3%",
        icone: "⏱️",
        precoBase: 300,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.03,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 5 }
    },
    html_time2: {
        nome: "HTML Acelerado II",
        descricao: "Reduz o tempo do HTML em 4%",
        icone: "⏱️",
        precoBase: 500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.04,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 10 }
    },
    html_time3: {
        nome: "HTML Acelerado III",
        descricao: "Reduz o tempo do HTML em 5%",
        icone: "⏱️",
        precoBase: 800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.05,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 15 }
    },
    html_time4: {
        nome: "HTML Acelerado IV",
        descricao: "Reduz o tempo do HTML em 6%",
        icone: "⏱️",
        precoBase: 1200,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.06,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 20 }
    },
    html_time5: {
        nome: "HTML Acelerado V",
        descricao: "Reduz o tempo do HTML em 7%",
        icone: "⏱️",
        precoBase: 1800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.07,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 25 }
    },
    html_dual1: {
        nome: "HTML Otimizado I",
        descricao: "Aumenta o ganho em 4% e reduz o tempo em 2%",
        icone: "✨",
        precoBase: 400,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.04,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "ambos",
        requisito: { tipo: "compras", valor: 8 }
    },
    html_dual2: {
        nome: "HTML Otimizado II",
        descricao: "Aumenta o ganho em 6% e reduz o tempo em 3%",
        icone: "✨",
        precoBase: 700,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.06,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "ambos",
        requisito: { tipo: "compras", valor: 14 }
    },
    html_dual3: {
        nome: "HTML Otimizado III",
        descricao: "Aumenta o ganho em 8% e reduz o tempo em 4%",
        icone: "✨",
        precoBase: 1100,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.08,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "ambos",
        requisito: { tipo: "compras", valor: 20 }
    },
    html_dual4: {
        nome: "HTML Otimizado IV",
        descricao: "Aumenta o ganho em 10% e reduz o tempo em 5%",
        icone: "✨",
        precoBase: 1600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "ambos",
        requisito: { tipo: "compras", valor: 26 }
    },
    html_dual5: {
        nome: "HTML Otimizado V",
        descricao: "Aumenta o ganho em 12% e reduz o tempo em 6%",
        icone: "✨",
        precoBase: 2200,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "ambos",
        requisito: { tipo: "compras", valor: 32 }
    },
    html_special1: {
        nome: "HTML Semântico Profissional",
        descricao: "Aumenta o ganho do HTML em 15%",
        icone: "🏷️",
        precoBase: 2000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.15,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 30 }
    },
    html_special2: {
        nome: "HTML Canvas Pro",
        descricao: "Aumenta o ganho do HTML em 10% e reduz tempo em 5%",
        icone: "🎨",
        precoBase: 2500,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.10,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "ambos",
        requisito: { tipo: "compras", valor: 35 }
    },
    html_special3: {
        nome: "HTML Web Components",
        descricao: "Aumenta o ganho do HTML em 18%",
        icone: "🧩",
        precoBase: 3000,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.18,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 40 }
    },
    html_special4: {
        nome: "HTML Acessibilidade (A11y)",
        descricao: "Reduz o tempo do HTML em 8%",
        icone: "♿",
        precoBase: 2800,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.08,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "tempo",
        requisito: { tipo: "compras", valor: 38 }
    },
    html_special5: {
        nome: "HTML SEO Avançado",
        descricao: "Aumenta o ganho do HTML em 12%",
        icone: "🔍",
        precoBase: 2600,
        multiplicadorPreco: 1.0,
        nivel: 0,
        nivelMax: 1,
        efeito: 0.12,
        tipo: "linguagem",
        linguagemId: "html",
        subtipo: "rendimento",
        requisito: { tipo: "compras", valor: 36 }
    },

    // Python (17 novos, total 25)
    python_boost1: { nome: "Python Básico+", icone: "🐍", precoBase: 300, efeito: 0.05, subtipo: "rendimento", requisito: { valor: 4 } },
    python_boost2: { nome: "Python Intermediário", icone: "🐍", precoBase: 500, efeito: 0.07, subtipo: "rendimento", requisito: { valor: 8 } },
    python_boost3: { nome: "Python Avançado", icone: "🐍", precoBase: 800, efeito: 0.10, subtipo: "rendimento", requisito: { valor: 12 } },
    python_boost4: { nome: "Python Expert", icone: "🐍", precoBase: 1200, efeito: 0.12, subtipo: "rendimento", requisito: { valor: 16 } },
    python_boost5: { nome: "Python Master", icone: "🐍", precoBase: 1800, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 20 } },
    python_boost6: { nome: "Python Legend", icone: "🐍", precoBase: 2500, efeito: 0.20, subtipo: "rendimento", requisito: { valor: 25 } },
    python_time1: { nome: "Python Acelerado I", icone: "⏱️", precoBase: 400, efeito: 0.03, subtipo: "tempo", requisito: { valor: 6 } },
    python_time2: { nome: "Python Acelerado II", icone: "⏱️", precoBase: 650, efeito: 0.04, subtipo: "tempo", requisito: { valor: 11 } },
    python_time3: { nome: "Python Acelerado III", icone: "⏱️", precoBase: 1000, efeito: 0.05, subtipo: "tempo", requisito: { valor: 16 } },
    python_time4: { nome: "Python Acelerado IV", icone: "⏱️", precoBase: 1500, efeito: 0.06, subtipo: "tempo", requisito: { valor: 21 } },
    python_time5: { nome: "Python Acelerado V", icone: "⏱️", precoBase: 2200, efeito: 0.07, subtipo: "tempo", requisito: { valor: 26 } },
    python_dual1: { nome: "Python Otimizado I", icone: "✨", precoBase: 500, efeito: 0.04, subtipo: "ambos", requisito: { valor: 9 } },
    python_dual2: { nome: "Python Otimizado II", icone: "✨", precoBase: 850, efeito: 0.06, subtipo: "ambos", requisito: { valor: 15 } },
    python_dual3: { nome: "Python Otimizado III", icone: "✨", precoBase: 1300, efeito: 0.08, subtipo: "ambos", requisito: { valor: 21 } },
    python_dual4: { nome: "Python Otimizado IV", icone: "✨", precoBase: 1900, efeito: 0.10, subtipo: "ambos", requisito: { valor: 27 } },
    python_dual5: { nome: "Python Otimizado V", icone: "✨", precoBase: 2600, efeito: 0.12, subtipo: "ambos", requisito: { valor: 33 } },
    python_special: { nome: "Python Data Science Pro", icone: "📊", precoBase: 3000, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 40 } },

    // Java (16 novos, total 25)
    java_boost1: { nome: "Java Básico+", icone: "☕", precoBase: 350, efeito: 0.05, subtipo: "rendimento", requisito: { valor: 4 } },
    java_boost2: { nome: "Java Intermediário", icone: "☕", precoBase: 600, efeito: 0.07, subtipo: "rendimento", requisito: { valor: 8 } },
    java_boost3: { nome: "Java Avançado", icone: "☕", precoBase: 900, efeito: 0.10, subtipo: "rendimento", requisito: { valor: 12 } },
    java_boost4: { nome: "Java Expert", icone: "☕", precoBase: 1400, efeito: 0.12, subtipo: "rendimento", requisito: { valor: 16 } },
    java_boost5: { nome: "Java Master", icone: "☕", precoBase: 2000, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 20 } },
    java_boost6: { nome: "Java Legend", icone: "☕", precoBase: 2800, efeito: 0.20, subtipo: "rendimento", requisito: { valor: 25 } },
    java_time1: { nome: "Java Acelerado I", icone: "⏱️", precoBase: 450, efeito: 0.03, subtipo: "tempo", requisito: { valor: 6 } },
    java_time2: { nome: "Java Acelerado II", icone: "⏱️", precoBase: 750, efeito: 0.04, subtipo: "tempo", requisito: { valor: 11 } },
    java_time3: { nome: "Java Acelerado III", icone: "⏱️", precoBase: 1100, efeito: 0.05, subtipo: "tempo", requisito: { valor: 16 } },
    java_time4: { nome: "Java Acelerado IV", icone: "⏱️", precoBase: 1600, efeito: 0.06, subtipo: "tempo", requisito: { valor: 21 } },
    java_time5: { nome: "Java Acelerado V", icone: "⏱️", precoBase: 2300, efeito: 0.07, subtipo: "tempo", requisito: { valor: 26 } },
    java_dual1: { nome: "Java Otimizado I", icone: "✨", precoBase: 550, efeito: 0.04, subtipo: "ambos", requisito: { valor: 9 } },
    java_dual2: { nome: "Java Otimizado II", icone: "✨", precoBase: 900, efeito: 0.06, subtipo: "ambos", requisito: { valor: 15 } },
    java_dual3: { nome: "Java Otimizado III", icone: "✨", precoBase: 1400, efeito: 0.08, subtipo: "ambos", requisito: { valor: 21 } },
    java_dual4: { nome: "Java Otimizado IV", icone: "✨", precoBase: 2000, efeito: 0.10, subtipo: "ambos", requisito: { valor: 27 } },
    java_dual5: { nome: "Java Otimizado V", icone: "✨", precoBase: 2700, efeito: 0.12, subtipo: "ambos", requisito: { valor: 33 } },
    java_special: { nome: "Java Enterprise Pro", icone: "🏢", precoBase: 3200, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 40 } },

    // C (17 novos, total 25)
    c_boost1: { nome: "C Básico+", icone: "⚙️", precoBase: 300, efeito: 0.05, subtipo: "rendimento", requisito: { valor: 4 } },
    c_boost2: { nome: "C Intermediário", icone: "⚙️", precoBase: 500, efeito: 0.07, subtipo: "rendimento", requisito: { valor: 8 } },
    c_boost3: { nome: "C Avançado", icone: "⚙️", precoBase: 800, efeito: 0.10, subtipo: "rendimento", requisito: { valor: 12 } },
    c_boost4: { nome: "C Expert", icone: "⚙️", precoBase: 1200, efeito: 0.12, subtipo: "rendimento", requisito: { valor: 16 } },
    c_boost5: { nome: "C Master", icone: "⚙️", precoBase: 1800, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 20 } },
    c_boost6: { nome: "C Legend", icone: "⚙️", precoBase: 2500, efeito: 0.20, subtipo: "rendimento", requisito: { valor: 25 } },
    c_time1: { nome: "C Acelerado I", icone: "⏱️", precoBase: 400, efeito: 0.03, subtipo: "tempo", requisito: { valor: 6 } },
    c_time2: { nome: "C Acelerado II", icone: "⏱️", precoBase: 650, efeito: 0.04, subtipo: "tempo", requisito: { valor: 11 } },
    c_time3: { nome: "C Acelerado III", icone: "⏱️", precoBase: 1000, efeito: 0.05, subtipo: "tempo", requisito: { valor: 16 } },
    c_time4: { nome: "C Acelerado IV", icone: "⏱️", precoBase: 1500, efeito: 0.06, subtipo: "tempo", requisito: { valor: 21 } },
    c_time5: { nome: "C Acelerado V", icone: "⏱️", precoBase: 2200, efeito: 0.07, subtipo: "tempo", requisito: { valor: 26 } },
    c_dual1: { nome: "C Otimizado I", icone: "✨", precoBase: 500, efeito: 0.04, subtipo: "ambos", requisito: { valor: 9 } },
    c_dual2: { nome: "C Otimizado II", icone: "✨", precoBase: 850, efeito: 0.06, subtipo: "ambos", requisito: { valor: 15 } },
    c_dual3: { nome: "C Otimizado III", icone: "✨", precoBase: 1300, efeito: 0.08, subtipo: "ambos", requisito: { valor: 21 } },
    c_dual4: { nome: "C Otimizado IV", icone: "✨", precoBase: 1900, efeito: 0.10, subtipo: "ambos", requisito: { valor: 27 } },
    c_dual5: { nome: "C Otimizado V", icone: "✨", precoBase: 2600, efeito: 0.12, subtipo: "ambos", requisito: { valor: 33 } },
    c_special: { nome: "C Kernel Hacker", icone: "💻", precoBase: 3000, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 40 } },

    // TypeScript/JS (19 novos, total 25)
    ts_boost1: { nome: "TS Básico+", icone: "🔷", precoBase: 300, efeito: 0.05, subtipo: "rendimento", requisito: { valor: 4 } },
    ts_boost2: { nome: "TS Intermediário", icone: "🔷", precoBase: 500, efeito: 0.07, subtipo: "rendimento", requisito: { valor: 8 } },
    ts_boost3: { nome: "TS Avançado", icone: "🔷", precoBase: 800, efeito: 0.10, subtipo: "rendimento", requisito: { valor: 12 } },
    ts_boost4: { nome: "TS Expert", icone: "🔷", precoBase: 1200, efeito: 0.12, subtipo: "rendimento", requisito: { valor: 16 } },
    ts_boost5: { nome: "TS Master", icone: "🔷", precoBase: 1800, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 20 } },
    ts_boost6: { nome: "TS Legend", icone: "🔷", precoBase: 2500, efeito: 0.20, subtipo: "rendimento", requisito: { valor: 25 } },
    ts_time1: { nome: "TS Acelerado I", icone: "⏱️", precoBase: 400, efeito: 0.03, subtipo: "tempo", requisito: { valor: 6 } },
    ts_time2: { nome: "TS Acelerado II", icone: "⏱️", precoBase: 650, efeito: 0.04, subtipo: "tempo", requisito: { valor: 11 } },
    ts_time3: { nome: "TS Acelerado III", icone: "⏱️", precoBase: 1000, efeito: 0.05, subtipo: "tempo", requisito: { valor: 16 } },
    ts_time4: { nome: "TS Acelerado IV", icone: "⏱️", precoBase: 1500, efeito: 0.06, subtipo: "tempo", requisito: { valor: 21 } },
    ts_time5: { nome: "TS Acelerado V", icone: "⏱️", precoBase: 2200, efeito: 0.07, subtipo: "tempo", requisito: { valor: 26 } },
    ts_dual1: { nome: "TS Otimizado I", icone: "✨", precoBase: 500, efeito: 0.04, subtipo: "ambos", requisito: { valor: 9 } },
    ts_dual2: { nome: "TS Otimizado II", icone: "✨", precoBase: 850, efeito: 0.06, subtipo: "ambos", requisito: { valor: 15 } },
    ts_dual3: { nome: "TS Otimizado III", icone: "✨", precoBase: 1300, efeito: 0.08, subtipo: "ambos", requisito: { valor: 21 } },
    ts_dual4: { nome: "TS Otimizado IV", icone: "✨", precoBase: 1900, efeito: 0.10, subtipo: "ambos", requisito: { valor: 27 } },
    ts_dual5: { nome: "TS Otimizado V", icone: "✨", precoBase: 2600, efeito: 0.12, subtipo: "ambos", requisito: { valor: 33 } },
    ts_special1: { nome: "TS Advanced Types", icone: "🔷", precoBase: 2800, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 38 } },
    ts_special2: { nome: "TS Node.js Pro", icone: "🟢", precoBase: 3000, efeito: 0.12, subtipo: "ambos", requisito: { valor: 42 } },
    ts_special3: { nome: "TS React Master", icone: "⚛️", precoBase: 3200, efeito: 0.18, subtipo: "rendimento", requisito: { valor: 45 } },

    // Flutter (17 novos, total 25)
    flutter_boost1: { nome: "Flutter Básico+", icone: "📱", precoBase: 400, efeito: 0.05, subtipo: "rendimento", requisito: { valor: 4 } },
    flutter_boost2: { nome: "Flutter Intermediário", icone: "📱", precoBase: 650, efeito: 0.07, subtipo: "rendimento", requisito: { valor: 8 } },
    flutter_boost3: { nome: "Flutter Avançado", icone: "📱", precoBase: 1000, efeito: 0.10, subtipo: "rendimento", requisito: { valor: 12 } },
    flutter_boost4: { nome: "Flutter Expert", icone: "📱", precoBase: 1500, efeito: 0.12, subtipo: "rendimento", requisito: { valor: 16 } },
    flutter_boost5: { nome: "Flutter Master", icone: "📱", precoBase: 2200, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 20 } },
    flutter_boost6: { nome: "Flutter Legend", icone: "📱", precoBase: 3000, efeito: 0.20, subtipo: "rendimento", requisito: { valor: 25 } },
    flutter_time1: { nome: "Flutter Acelerado I", icone: "⏱️", precoBase: 500, efeito: 0.03, subtipo: "tempo", requisito: { valor: 6 } },
    flutter_time2: { nome: "Flutter Acelerado II", icone: "⏱️", precoBase: 800, efeito: 0.04, subtipo: "tempo", requisito: { valor: 11 } },
    flutter_time3: { nome: "Flutter Acelerado III", icone: "⏱️", precoBase: 1200, efeito: 0.05, subtipo: "tempo", requisito: { valor: 16 } },
    flutter_time4: { nome: "Flutter Acelerado IV", icone: "⏱️", precoBase: 1700, efeito: 0.06, subtipo: "tempo", requisito: { valor: 21 } },
    flutter_time5: { nome: "Flutter Acelerado V", icone: "⏱️", precoBase: 2400, efeito: 0.07, subtipo: "tempo", requisito: { valor: 26 } },
    flutter_dual1: { nome: "Flutter Otimizado I", icone: "✨", precoBase: 600, efeito: 0.04, subtipo: "ambos", requisito: { valor: 9 } },
    flutter_dual2: { nome: "Flutter Otimizado II", icone: "✨", precoBase: 1000, efeito: 0.06, subtipo: "ambos", requisito: { valor: 15 } },
    flutter_dual3: { nome: "Flutter Otimizado III", icone: "✨", precoBase: 1500, efeito: 0.08, subtipo: "ambos", requisito: { valor: 21 } },
    flutter_dual4: { nome: "Flutter Otimizado IV", icone: "✨", precoBase: 2100, efeito: 0.10, subtipo: "ambos", requisito: { valor: 27 } },
    flutter_dual5: { nome: "Flutter Otimizado V", icone: "✨", precoBase: 2800, efeito: 0.12, subtipo: "ambos", requisito: { valor: 33 } },
    flutter_special: { nome: "Flutter Web & Desktop", icone: "🖥️", precoBase: 3500, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 40 } },

    // Rust (18 novos, total 25)
    rust_boost1: { nome: "Rust Básico+", icone: "🦀", precoBase: 500, efeito: 0.05, subtipo: "rendimento", requisito: { valor: 4 } },
    rust_boost2: { nome: "Rust Intermediário", icone: "🦀", precoBase: 800, efeito: 0.07, subtipo: "rendimento", requisito: { valor: 8 } },
    rust_boost3: { nome: "Rust Avançado", icone: "🦀", precoBase: 1200, efeito: 0.10, subtipo: "rendimento", requisito: { valor: 12 } },
    rust_boost4: { nome: "Rust Expert", icone: "🦀", precoBase: 1800, efeito: 0.12, subtipo: "rendimento", requisito: { valor: 16 } },
    rust_boost5: { nome: "Rust Master", icone: "🦀", precoBase: 2500, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 20 } },
    rust_boost6: { nome: "Rust Legend", icone: "🦀", precoBase: 3500, efeito: 0.20, subtipo: "rendimento", requisito: { valor: 25 } },
    rust_time1: { nome: "Rust Acelerado I", icone: "⏱️", precoBase: 600, efeito: 0.03, subtipo: "tempo", requisito: { valor: 6 } },
    rust_time2: { nome: "Rust Acelerado II", icone: "⏱️", precoBase: 950, efeito: 0.04, subtipo: "tempo", requisito: { valor: 11 } },
    rust_time3: { nome: "Rust Acelerado III", icone: "⏱️", precoBase: 1400, efeito: 0.05, subtipo: "tempo", requisito: { valor: 16 } },
    rust_time4: { nome: "Rust Acelerado IV", icone: "⏱️", precoBase: 2000, efeito: 0.06, subtipo: "tempo", requisito: { valor: 21 } },
    rust_time5: { nome: "Rust Acelerado V", icone: "⏱️", precoBase: 2800, efeito: 0.07, subtipo: "tempo", requisito: { valor: 26 } },
    rust_dual1: { nome: "Rust Otimizado I", icone: "✨", precoBase: 700, efeito: 0.04, subtipo: "ambos", requisito: { valor: 9 } },
    rust_dual2: { nome: "Rust Otimizado II", icone: "✨", precoBase: 1100, efeito: 0.06, subtipo: "ambos", requisito: { valor: 15 } },
    rust_dual3: { nome: "Rust Otimizado III", icone: "✨", precoBase: 1600, efeito: 0.08, subtipo: "ambos", requisito: { valor: 21 } },
    rust_dual4: { nome: "Rust Otimizado IV", icone: "✨", precoBase: 2300, efeito: 0.10, subtipo: "ambos", requisito: { valor: 27 } },
    rust_dual5: { nome: "Rust Otimizado V", icone: "✨", precoBase: 3100, efeito: 0.12, subtipo: "ambos", requisito: { valor: 33 } },
    rust_special1: { nome: "Rust Embedded", icone: "🔌", precoBase: 4000, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 40 } },
    rust_special2: { nome: "Rust WebAssembly", icone: "🌐", precoBase: 4500, efeito: 0.12, subtipo: "ambos", requisito: { valor: 45 } },

    // COBOL (20 novos, total 25)
    cobol_boost1: { nome: "COBOL Básico+", icone: "🏛️", precoBase: 400, efeito: 0.05, subtipo: "rendimento", requisito: { valor: 4 } },
    cobol_boost2: { nome: "COBOL Intermediário", icone: "🏛️", precoBase: 700, efeito: 0.07, subtipo: "rendimento", requisito: { valor: 8 } },
    cobol_boost3: { nome: "COBOL Avançado", icone: "🏛️", precoBase: 1100, efeito: 0.10, subtipo: "rendimento", requisito: { valor: 12 } },
    cobol_boost4: { nome: "COBOL Expert", icone: "🏛️", precoBase: 1600, efeito: 0.12, subtipo: "rendimento", requisito: { valor: 16 } },
    cobol_boost5: { nome: "COBOL Master", icone: "🏛️", precoBase: 2300, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 20 } },
    cobol_boost6: { nome: "COBOL Legend", icone: "🏛️", precoBase: 3200, efeito: 0.20, subtipo: "rendimento", requisito: { valor: 25 } },
    cobol_time1: { nome: "COBOL Acelerado I", icone: "⏱️", precoBase: 500, efeito: 0.03, subtipo: "tempo", requisito: { valor: 6 } },
    cobol_time2: { nome: "COBOL Acelerado II", icone: "⏱️", precoBase: 850, efeito: 0.04, subtipo: "tempo", requisito: { valor: 11 } },
    cobol_time3: { nome: "COBOL Acelerado III", icone: "⏱️", precoBase: 1300, efeito: 0.05, subtipo: "tempo", requisito: { valor: 16 } },
    cobol_time4: { nome: "COBOL Acelerado IV", icone: "⏱️", precoBase: 1900, efeito: 0.06, subtipo: "tempo", requisito: { valor: 21 } },
    cobol_time5: { nome: "COBOL Acelerado V", icone: "⏱️", precoBase: 2700, efeito: 0.07, subtipo: "tempo", requisito: { valor: 26 } },
    cobol_dual1: { nome: "COBOL Otimizado I", icone: "✨", precoBase: 600, efeito: 0.04, subtipo: "ambos", requisito: { valor: 9 } },
    cobol_dual2: { nome: "COBOL Otimizado II", icone: "✨", precoBase: 1000, efeito: 0.06, subtipo: "ambos", requisito: { valor: 15 } },
    cobol_dual3: { nome: "COBOL Otimizado III", icone: "✨", precoBase: 1500, efeito: 0.08, subtipo: "ambos", requisito: { valor: 21 } },
    cobol_dual4: { nome: "COBOL Otimizado IV", icone: "✨", precoBase: 2200, efeito: 0.10, subtipo: "ambos", requisito: { valor: 27 } },
    cobol_dual5: { nome: "COBOL Otimizado V", icone: "✨", precoBase: 3000, efeito: 0.12, subtipo: "ambos", requisito: { valor: 33 } },
    cobol_special1: { nome: "COBOL Batch Processing", icone: "📦", precoBase: 3500, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 38 } },
    cobol_special2: { nome: "COBOL Legacy Integration", icone: "🔗", precoBase: 3800, efeito: 0.10, subtipo: "ambos", requisito: { valor: 42 } },
    cobol_special3: { nome: "COBOL Year 2038 Ready", icone: "📅", precoBase: 4000, efeito: 0.12, subtipo: "tempo", requisito: { valor: 45 } },
    cobol_special4: { nome: "COBOL Mainframe Pro", icone: "🏢", precoBase: 4500, efeito: 0.20, subtipo: "rendimento", requisito: { valor: 50 } },

    // Assembly (18 novos, total 25)
    assembly_boost1: { nome: "Assembly Básico+", icone: "🔧", precoBase: 600, efeito: 0.05, subtipo: "rendimento", requisito: { valor: 4 } },
    assembly_boost2: { nome: "Assembly Intermediário", icone: "🔧", precoBase: 900, efeito: 0.07, subtipo: "rendimento", requisito: { valor: 8 } },
    assembly_boost3: { nome: "Assembly Avançado", icone: "🔧", precoBase: 1400, efeito: 0.10, subtipo: "rendimento", requisito: { valor: 12 } },
    assembly_boost4: { nome: "Assembly Expert", icone: "🔧", precoBase: 2000, efeito: 0.12, subtipo: "rendimento", requisito: { valor: 16 } },
    assembly_boost5: { nome: "Assembly Master", icone: "🔧", precoBase: 2800, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 20 } },
    assembly_boost6: { nome: "Assembly Legend", icone: "🔧", precoBase: 3800, efeito: 0.20, subtipo: "rendimento", requisito: { valor: 25 } },
    assembly_time1: { nome: "Assembly Acelerado I", icone: "⏱️", precoBase: 700, efeito: 0.03, subtipo: "tempo", requisito: { valor: 6 } },
    assembly_time2: { nome: "Assembly Acelerado II", icone: "⏱️", precoBase: 1100, efeito: 0.04, subtipo: "tempo", requisito: { valor: 11 } },
    assembly_time3: { nome: "Assembly Acelerado III", icone: "⏱️", precoBase: 1600, efeito: 0.05, subtipo: "tempo", requisito: { valor: 16 } },
    assembly_time4: { nome: "Assembly Acelerado IV", icone: "⏱️", precoBase: 2300, efeito: 0.06, subtipo: "tempo", requisito: { valor: 21 } },
    assembly_time5: { nome: "Assembly Acelerado V", icone: "⏱️", precoBase: 3200, efeito: 0.07, subtipo: "tempo", requisito: { valor: 26 } },
    assembly_dual1: { nome: "Assembly Otimizado I", icone: "✨", precoBase: 800, efeito: 0.04, subtipo: "ambos", requisito: { valor: 9 } },
    assembly_dual2: { nome: "Assembly Otimizado II", icone: "✨", precoBase: 1300, efeito: 0.06, subtipo: "ambos", requisito: { valor: 15 } },
    assembly_dual3: { nome: "Assembly Otimizado III", icone: "✨", precoBase: 1900, efeito: 0.08, subtipo: "ambos", requisito: { valor: 21 } },
    assembly_dual4: { nome: "Assembly Otimizado IV", icone: "✨", precoBase: 2700, efeito: 0.10, subtipo: "ambos", requisito: { valor: 27 } },
    assembly_dual5: { nome: "Assembly Otimizado V", icone: "✨", precoBase: 3600, efeito: 0.12, subtipo: "ambos", requisito: { valor: 33 } },
    assembly_special1: { nome: "Assembly Reverse Engineering", icone: "🔍", precoBase: 4200, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 40 } },
    assembly_special2: { nome: "Assembly Bootloader", icone: "🖥️", precoBase: 4800, efeito: 0.10, subtipo: "ambos", requisito: { valor: 45 } },

    // TempleOS (12 novos, total 25)
    templeos_extra1: { nome: "TempleOS Bênção I", icone: "✨", precoBase: 800, efeito: 0.05, subtipo: "rendimento", requisito: { valor: 5 } },
    templeos_extra2: { nome: "TempleOS Bênção II", icone: "✨✨", precoBase: 1300, efeito: 0.07, subtipo: "rendimento", requisito: { valor: 10 } },
    templeos_extra3: { nome: "TempleOS Bênção III", icone: "✨✨✨", precoBase: 2000, efeito: 0.10, subtipo: "rendimento", requisito: { valor: 15 } },
    templeos_extra4: { nome: "TempleOS Bênção IV", icone: "✨✨✨✨", precoBase: 3000, efeito: 0.12, subtipo: "rendimento", requisito: { valor: 20 } },
    templeos_extra5: { nome: "TempleOS Bênção V", icone: "✨✨✨✨✨", precoBase: 4500, efeito: 0.15, subtipo: "rendimento", requisito: { valor: 25 } },
    templeos_extra6: { nome: "TempleOS Velocidade I", icone: "⏱️", precoBase: 900, efeito: 0.03, subtipo: "tempo", requisito: { valor: 8 } },
    templeos_extra7: { nome: "TempleOS Velocidade II", icone: "⏱️", precoBase: 1500, efeito: 0.04, subtipo: "tempo", requisito: { valor: 14 } },
    templeos_extra8: { nome: "TempleOS Velocidade III", icone: "⏱️", precoBase: 2300, efeito: 0.05, subtipo: "tempo", requisito: { valor: 20 } },
    templeos_extra9: { nome: "TempleOS Velocidade IV", icone: "⏱️", precoBase: 3400, efeito: 0.06, subtipo: "tempo", requisito: { valor: 26 } },
    templeos_extra10: { nome: "TempleOS Velocidade V", icone: "⏱️", precoBase: 4800, efeito: 0.07, subtipo: "tempo", requisito: { valor: 32 } },
    templeos_extra11: { nome: "TempleOS Dual I", icone: "✨⏱️", precoBase: 1200, efeito: 0.04, subtipo: "ambos", requisito: { valor: 12 } },
    templeos_extra12: { nome: "TempleOS Dual II", icone: "✨⏱️", precoBase: 2200, efeito: 0.06, subtipo: "ambos", requisito: { valor: 22 } }
};

let lingUpgradesData = JSON.parse(JSON.stringify(lingUpgradesDataTemplate));

// =======================
// SISTEMA DE ASCENSÃO CORRIGIDO
// =======================
let prestigeUnlocked = false;
let prestigePoints = 0;
let prestigeBonus = 0; // bônus percentual total = ascensionLevel
let prestigeProgress = 0;
let prestigePointsGainedThisRun = 0; // pontos ganhos na run atual (para confirmar)
const PRESTIGE_BASE = 1e9; // primeiro marco
let ascensionLevel = 0;

function calcularProximoMarco() {
    return PRESTIGE_BASE * (ascensionLevel + 1);
}

function verificarProgressoAscensao() {
    // Desbloqueia a ascensão quando totalMoneyEarned atinge 1e9
    if (!prestigeUnlocked && totalMoneyEarned >= 1e9) {
        prestigeUnlocked = true;
        const container = document.getElementById('ascensionButtonContainer');
        if (container) {
            container.style.display = 'flex';
            container.classList.add('unlocked');
        }
        mostrarFeedback('⭐ Ascensão desbloqueada!', 'success');
        // Garante que o listener da barra seja adicionado após desbloquear
        atualizarReferenciasBotoesAscensao();
    }

    // Se ainda não desbloqueada, não processa pontos
    if (!prestigeUnlocked) return;

    // Enquanto o progresso atual atingir ou ultrapassar o próximo marco, concede pontos
    let proximoMarco = calcularProximoMarco();
    let pontosGanhos = 0;
    while (prestigeProgress >= proximoMarco) {
        prestigePoints++;
        prestigePointsGainedThisRun++;
        prestigeProgress -= proximoMarco;
        pontosGanhos++;
        proximoMarco = calcularProximoMarco(); // recalcula com novo nível
        invalidarCacheCalculos();
        mostrarFeedback(`⭐ +1 Ponto de Ascensão! Total: ${prestigePoints}`, 'success');
    }
    if (pontosGanhos > 0) {
        console.log(`🎉 Ascensão: +${pontosGanhos} ponto(s). Progresso restante: ${prestigeProgress}`);
    }

    // Atualiza a interface da barra de ascensão
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
        pointsSpan.textContent = `${formatarDinheiro(prestigeProgress)} / ${formatarDinheiro(proximoMarco)} ⭐ (${percentual.toFixed(1)}%)`;
    }

    if (progresso >= 1) {
        container.classList.add('pode-ascender');
    } else {
        container.classList.remove('pode-ascender');
    }
}

function tentarAscender() {
    if (gamePaused) return;
    const proximoMarco = calcularProximoMarco();
    if (prestigeProgress < proximoMarco) {
        mostrarFeedback('Ainda não atingiu o próximo nível de ascensão!', 'error');
        return;
    }
    abrirModalConfirmacaoAscensao();
}

function realizarAscensao() {
    ascensionLevel++;
    prestigePoints++;
    prestigeBonus = ascensionLevel; // 1% por nível

    resetarJogoPreservandoAscensao();

    fecharModalConfirmacaoAscensao();
    fecharModalArvoreSkills();
    retomarJogo();

    mostrarFeedback(`⭐ Ascensão concluída! Nível ${ascensionLevel} com ${prestigePoints} ponto(s).`, 'success');
}

function resetarJogoPreservandoAscensao() {
    money = 0;
    totalMoneyEarned = 0;
    linguagensData = JSON.parse(JSON.stringify(linguagensDataTemplate));
    upgradesData = JSON.parse(JSON.stringify(upgradesDataTemplate));
    lingUpgradesData = JSON.parse(JSON.stringify(lingUpgradesDataTemplate));

    for (const id in activeProductions) delete activeProductions[id];
    for (const key in progressoAtivo) progressoAtivo[key] = false;

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

    prestigeProgress = 0;
    setupAutoClick();
    if (moneyEl) moneyEl.textContent = "$0.00";
    document.getElementById('ascensionButtonContainer').style.display = 'flex';
    atualizarDisplayAscensao();
    inicializarInterface();
    atualizarTodosUpgrades();
    atualizarEstatisticas();
}

// =======================
// UPGRADES DE ASCENSÃO (PERMANENTES)
// =======================
let prestigeUpgradesData = {
    prodGlobal1: {
        nome: "Produção Global +10%",
        descricao: "Aumenta a produção de todas as linguagens em 10%.",
        icone: "🌍",
        preco: 1,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.10,
        tipo: "global",
        subtipo: "rendimento",
        requisito: null,
        x: 1450, y: 750
    },
    tempoGlobal1: {
        nome: "Velocidade Global +5%",
        descricao: "Reduz o tempo de todas as linguagens em 5%.",
        icone: "⏩",
        preco: 1,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.05,
        tipo: "global",
        subtipo: "tempo",
        requisito: "prodGlobal1",
        x: 1250, y: 550
    },
    tempoGlobal2: {
        nome: "Aceleração Crítica",
        descricao: "Reduz o tempo em 3% durante produções críticas.",
        icone: "⚡",
        preco: 2,
        nivel: 0,
        nivelMax: 8,
        efeito: 0.03,
        tipo: "global",
        subtipo: "tempo_critico",
        requisito: "tempoGlobal1",
        x: 1150, y: 450
    },
    tempoGlobal3: {
        nome: "Fluxo Contínuo",
        descricao: "Reduz o tempo de espera entre produções em 10%.",
        icone: "🌊",
        preco: 3,
        nivel: 0,
        nivelMax: 6,
        efeito: 0.10,
        tipo: "global",
        subtipo: "tempo_espera",
        requisito: "tempoGlobal2",
        x: 1050, y: 350
    },
    prodGlobal2: {
        nome: "Multiplicador Global",
        descricao: "Multiplica a produção global por 1.05x.",
        icone: "✨",
        preco: 2,
        nivel: 0,
        nivelMax: 8,
        efeito: 1.05,
        tipo: "global",
        subtipo: "multiplicador",
        requisito: "prodGlobal1",
        x: 1650, y: 550
    },
    prodGlobal3: {
        nome: "Surtos de Produtividade",
        descricao: "Chance de 5% de dobrar a produção por nível.",
        icone: "🎯",
        preco: 3,
        nivel: 0,
        nivelMax: 5,
        efeito: 0.05,
        tipo: "global",
        subtipo: "sorte_prod",
        requisito: "prodGlobal2",
        x: 1750, y: 450
    },
    prodGlobal4: {
        nome: "Onda de Eficiência",
        descricao: "Produção aumenta 8% durante períodos de baixa atividade.",
        icone: "🌊",
        preco: 2,
        nivel: 0,
        nivelMax: 7,
        efeito: 0.08,
        tipo: "global",
        subtipo: "eficiencia",
        requisito: "prodGlobal3",
        x: 1850, y: 350
    },
    priceDiscount: {
        nome: "Desconto Comercial",
        descricao: "Reduz o custo de compra de linguagens em 5%.",
        icone: "💲",
        preco: 2,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.05,
        tipo: "global",
        subtipo: "preco",
        requisito: "prodGlobal1",
        x: 1850, y: 650
    },
    priceDiscount2: {
        nome: "Negociação Mestre",
        descricao: "Reduz custos de upgrades em 3%.",
        icone: "🤝",
        preco: 3,
        nivel: 0,
        nivelMax: 8,
        efeito: 0.03,
        tipo: "global",
        subtipo: "preco_upgrades",
        requisito: "priceDiscount",
        x: 1950, y: 550
    },
    priceDiscount3: {
        nome: "Economia Circular",
        descricao: "5% de chance de reembolsar custo de compras.",
        icone: "🔄",
        preco: 4,
        nivel: 0,
        nivelMax: 5,
        efeito: 0.05,
        tipo: "global",
        subtipo: "reembolso",
        requisito: "priceDiscount2",
        x: 2050, y: 450
    },
    autoClick: {
        nome: "Automação Claudinho",
        descricao: "Gera um clique automático por segundo.",
        icone: "🤖",
        preco: 3,
        nivel: 0,
        nivelMax: 10,
        efeito: 1,
        tipo: "global",
        subtipo: "autoclick",
        requisito: "priceDiscount",
        x: 2150, y: 750
    },
    autoClick2: {
        nome: "IA Assistente",
        descricao: "Cliques automáticos inteligentes que priorizam linguagens mais produtivas.",
        icone: "🧠",
        preco: 4,
        nivel: 0,
        nivelMax: 6,
        efeito: 1.5,
        tipo: "global",
        subtipo: "autoclick_inteligente",
        requisito: "autoClick",
        x: 2350, y: 850
    },
    autoClick3: {
        nome: "Rede Neural",
        descricao: "Cliques automáticos aprendem e otimizam padrões de produção.",
        icone: "🕸️",
        preco: 5,
        nivel: 0,
        nivelMax: 4,
        efeito: 2.0,
        tipo: "global",
        subtipo: "autoclick_ml",
        requisito: "autoClick2",
        x: 2550, y: 950
    },
    bonusIconBoost: {
        nome: "Amuleto do Bônus",
        descricao: "Aumenta o valor dos ícones de bônus em 20%.",
        icone: "⭐",
        preco: 2,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.20,
        tipo: "global",
        subtipo: "bonusicon",
        requisito: "prodGlobal1",
        x: 1050, y: 650
    },
    bonusIconBoost2: {
        nome: "Sorte Estelar",
        descricao: "Chance dobrada de ícones de bônus aparecerem.",
        icone: "🌟",
        preco: 3,
        nivel: 0,
        nivelMax: 8,
        efeito: 2.0,
        tipo: "global",
        subtipo: "bonusicon_freq",
        requisito: "bonusIconBoost",
        x: 950, y: 550
    },
    bonusIconBoost3: {
        nome: "Constelação da Sorte",
        descricao: "Ícones de bônus podem aparecer em cascata.",
        icone: "🌌",
        preco: 4,
        nivel: 0,
        nivelMax: 5,
        efeito: 0.15,
        tipo: "global",
        subtipo: "bonusicon_cascata",
        requisito: "bonusIconBoost2",
        x: 850, y: 450
    },
    multiplicadorClique: {
        nome: "Clique Poderoso",
        descricao: "Cliques no Claudinho rendem 50% mais.",
        icone: "👆",
        preco: 2,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.50,
        tipo: "global",
        subtipo: "clique",
        requisito: "prodGlobal1",
        x: 1450, y: 1050
    },
    multiplicadorClique2: {
        nome: "Toque Mágico",
        descricao: "Cliques têm 10% de chance de serem críticos (3x valor).",
        icone: "✨",
        preco: 3,
        nivel: 0,
        nivelMax: 8,
        efeito: 0.10,
        tipo: "global",
        subtipo: "clique_critico",
        requisito: "multiplicadorClique",
        x: 1550, y: 1150
    },
    multiplicadorClique3: {
        nome: "Combo de Cliques",
        descricao: "Cliques consecutivos ganham bônus cumulativo.",
        icone: "🔥",
        preco: 4,
        nivel: 0,
        nivelMax: 6,
        efeito: 0.05,
        tipo: "global",
        subtipo: "clique_combo",
        requisito: "multiplicadorClique2",
        x: 1650, y: 1250
    },
    htmlBoost: {
        nome: "HTML Acelerado",
        descricao: "Aumenta a produção de HTML em 25%.",
        icone: "🌐",
        preco: 1,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.25,
        tipo: "linguagem-especifica",
        linguagem: "html",
        subtipo: "rendimento",
        requisito: "prodGlobal1",
        x: 1450, y: 450
    },
    htmlTimeBoost: {
        nome: "HTML Otimizado",
        descricao: "Reduz o tempo de HTML em 15%.",
        icone: "⚡",
        preco: 2,
        nivel: 0,
        nivelMax: 8,
        efeito: 0.15,
        tipo: "linguagem-especifica",
        linguagem: "html",
        subtipo: "tempo",
        requisito: "htmlBoost",
        x: 1350, y: 350
    },
    cssBoost: {
        nome: "CSS Elegante",
        descricao: "Aumenta a produção de CSS em 25%.",
        icone: "🎨",
        preco: 1,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.25,
        tipo: "linguagem-especifica",
        linguagem: "css",
        subtipo: "rendimento",
        requisito: "htmlBoost",
        x: 1550, y: 350
    },
    cssTimeBoost: {
        nome: "CSS Fluido",
        descricao: "Reduz o tempo de CSS em 15%.",
        icone: "🌊",
        preco: 2,
        nivel: 0,
        nivelMax: 8,
        efeito: 0.15,
        tipo: "linguagem-especifica",
        linguagem: "css",
        subtipo: "tempo",
        requisito: "cssBoost",
        x: 1650, y: 250
    },
    jsBoost: {
        nome: "JavaScript Dinâmico",
        descricao: "Aumenta a produção de JavaScript em 25%.",
        icone: "⚙️",
        preco: 2,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.25,
        tipo: "linguagem-especifica",
        linguagem: "js",
        subtipo: "rendimento",
        requisito: "cssBoost",
        x: 1250, y: 250
    },
    jsTimeBoost: {
        nome: "JavaScript Compilado",
        descricao: "Reduz o tempo de JavaScript em 15%.",
        icone: "🚀",
        preco: 3,
        nivel: 0,
        nivelMax: 8,
        efeito: 0.15,
        tipo: "linguagem-especifica",
        linguagem: "js",
        subtipo: "tempo",
        requisito: "jsBoost",
        x: 1150, y: 150
    },
    pythonBoost: {
        nome: "Python Turbo",
        descricao: "Aumenta a produção de Python em 25%.",
        icone: "🐍",
        preco: 2,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.25,
        tipo: "linguagem-especifica",
        linguagem: "python",
        subtipo: "rendimento",
        requisito: "jsBoost",
        x: 750, y: 250
    },
    pythonTimeBoost: {
        nome: "Python Otimizado",
        descricao: "Reduz o tempo de Python em 15%.",
        icone: "⚡",
        preco: 3,
        nivel: 0,
        nivelMax: 8,
        efeito: 0.15,
        tipo: "linguagem-especifica",
        linguagem: "python",
        subtipo: "tempo",
        requisito: "pythonBoost",
        x: 650, y: 150
    },
    javaBoost: {
        nome: "Java Enterprise",
        descricao: "Aumenta a produção de Java em 25%.",
        icone: "☕",
        preco: 3,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.25,
        tipo: "linguagem-especifica",
        linguagem: "java",
        subtipo: "rendimento",
        requisito: "pythonBoost",
        x: 550, y: 50
    },
    javaTimeBoost: {
        nome: "Java JIT",
        descricao: "Reduz o tempo de Java em 15%.",
        icone: "⚡",
        preco: 4,
        nivel: 0,
        nivelMax: 8,
        efeito: 0.15,
        tipo: "linguagem-especifica",
        linguagem: "java",
        subtipo: "tempo",
        requisito: "javaBoost",
        x: 450, y: 150
    },
    cppBoost: {
        nome: "C++ Performance",
        descricao: "Aumenta a produção de C++ em 25%.",
        icone: "⚡",
        preco: 4,
        nivel: 0,
        nivelMax: 10,
        efeito: 0.25,
        tipo: "linguagem-especifica",
        linguagem: "cpp",
        subtipo: "rendimento",
        requisito: "javaBoost",
        x: 350, y: 50
    },
    cppTimeBoost: {
        nome: "C++ Compilado",
        descricao: "Reduz o tempo de C++ em 15%.",
        icone: "🚀",
        preco: 5,
        nivel: 0,
        nivelMax: 8,
        efeito: 0.15,
        tipo: "linguagem-especifica",
        linguagem: "cpp",
        subtipo: "tempo",
        requisito: "cppBoost",
        x: 250, y: 50
    },
    offlineProgress: {
        nome: "Progresso Offline",
        descricao: "Ganha 10% da produção normal quando offline.",
        icone: "⏰",
        preco: 5,
        nivel: 0,
        nivelMax: 5,
        efeito: 0.10,
        tipo: "global",
        subtipo: "offline",
        requisito: "prodGlobal4",
        x: 1950, y: 250
    },
    criticalMultiplier: {
        nome: "Multiplicador Crítico",
        descricao: "Produções críticas valem 25% mais por nível.",
        icone: "💎",
        preco: 4,
        nivel: 0,
        nivelMax: 6,
        efeito: 0.25,
        tipo: "global",
        subtipo: "critico",
        requisito: "prodGlobal3",
        x: 1750, y: 150
    },
    efficiencyMaster: {
        nome: "Mestre da Eficiência",
        descricao: "Reduz todos os custos em 2% e aumenta produção em 3%.",
        icone: "🎓",
        preco: 6,
        nivel: 0,
        nivelMax: 4,
        efeito: { custo: 0.02, prod: 0.03 },
        tipo: "global",
        subtipo: "mestre",
        requisito: "criticalMultiplier",
        x: 1850, y: 50
    }
};

// =======================
// APLICAR BÔNUS DE ASCENSÃO
// =======================
function aplicarBonusAscensao(valorBase, tipo, linguagemId = null) {
    let valor = valorBase;
    for (const up of Object.values(prestigeUpgradesData)) {
        if (up.nivel > 0) {
            if (up.tipo === 'global' && up.subtipo === tipo) {
                if (tipo === 'tempo') valor *= (1 - up.nivel * up.efeito);
                else valor *= (1 + up.nivel * up.efeito);
            } else if (up.tipo === 'linguagem-especifica' && up.linguagem === linguagemId && up.subtipo === tipo) {
                if (tipo === 'tempo') valor *= (1 - up.nivel * up.efeito);
                else valor *= (1 + up.nivel * up.efeito);
            }
        }
    }
    return valor;
}

// =======================
// ORDEM DOS UPGRADES (para exibição, não mais usado, mas mantido)
// =======================
const upgradesOrdemFixa = []; // Não usado, pois ordenamos por timestamp

// =======================
// SISTEMA DE TEMPO DE JOGO
// =======================
function iniciarTemporizador() {
    if (playtimeInterval) clearInterval(playtimeInterval);
    startTime = Date.now();
    
    playtimeInterval = setInterval(() => {
        const menuModal = document.getElementById('menu-modal');
        if (menuModal && menuModal.style.display === 'block') {
            atualizarEstatisticas();
        }
    }, 1000);
}

function formatarTempoJogo() {
    const agora = Date.now();
    const diferenca = agora - startTime;
    const segundos = Math.floor(diferenca / 1000);
    
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
}

// =======================
// FUNÇÕES DE VERIFICAÇÃO DE REQUISITOS
// =======================
function verificarRequisitoLingUpgrade(upgrade) {
    if (!upgrade.requisito) return true;
    const data = linguagensData[upgrade.linguagemId];
    if (!data) return false;
    if (upgrade.requisito.tipo === 'compras') {
        return data.compras >= upgrade.requisito.valor;
    }
    return false;
}

// =======================
// CÁLCULOS DE PREÇOS E RECOMPENSAS (COM UPGRADES)
// =======================
// ⚡ OTIMIZAÇÃO: Cache para cálculos de recompensa e tempo
const calculoCache = {
    recompensa: new Map(),
    tempo: new Map()
};

function invalidarCacheCalculos() {
    calculoCache.recompensa.clear();
    calculoCache.tempo.clear();
}

function calcularRecompensaAtual(id) {
    // ⚡ Verificar cache
    if (calculoCache.recompensa.has(id)) {
        return calculoCache.recompensa.get(id);
    }
    
    const data = linguagensData[id];
    if (!data) return 0;
    
    let recompensaBaseComBonus = data.recompensaBase;
    if (data.compras > 1) {
        const bonusPorUnidade = data.multiplicadorRecompensa;
        const bonusTotal = bonusPorUnidade * (data.compras - 1);
        recompensaBaseComBonus = arredondar(data.recompensaBase * (1 + bonusTotal));
    }
    
    let recompensaAtual = recompensaBaseComBonus;
    
    // Aplicar upgrades globais que afetam rendimento
    for (const [upId, up] of Object.entries(upgradesData)) {
        if (up.nivel > 0 && up.tipo === 'global') {
            const efeitoNormalizado = normalizarEfeitoParaMultiploDe5(up.efeito);
            
            if (up.subtipo === 'rendimento') {
                recompensaAtual = Math.ceil(recompensaAtual * (1 + efeitoNormalizado));
            } else if (up.subtipo === 'ambos') {
                recompensaAtual = Math.ceil(recompensaAtual * (1 + efeitoNormalizado));
            } else if (up.subtipo === 'gambiarra') {
                recompensaAtual = Math.ceil(recompensaAtual * (1 + efeitoNormalizado));
            } else if (up.subtipo === 'vibe') {
                recompensaAtual = Math.ceil(recompensaAtual * (1 + efeitoNormalizado));
            } else if (up.tipo === 'linguagem-especifica' && up.linguagem === id) {
                recompensaAtual = Math.ceil(recompensaAtual * (1 + efeitoNormalizado));
            }
        }
    }
    
    // Aplicar upgrades de linguagem
    for (const [upId, up] of Object.entries(lingUpgradesData)) {
        if (up.linguagemId === id && up.nivel > 0) {
            const efeitoNormalizado = normalizarEfeitoParaMultiploDe5(up.efeito);
            
            if (up.subtipo === 'rendimento') {
                recompensaAtual = Math.ceil(recompensaAtual * (1 + efeitoNormalizado));
            } else if (up.subtipo === 'ambos') {
                recompensaAtual = Math.ceil(recompensaAtual * (1 + efeitoNormalizado));
            }
        }
    }
    
    // Aplicar bônus temporário do ícone
    recompensaAtual *= bonusRewardMultiplier;
    
    // Aplicar bônus de ascensão (pontos e upgrades permanentes)
    recompensaAtual *= (1 + prestigeBonus / 100);   // cada ponto = 1%
    recompensaAtual = aplicarBonusAscensao(recompensaAtual, 'rendimento', id);
    
    recompensaAtual = arredondar(recompensaAtual);
    
    calculoCache.recompensa.set(id, recompensaAtual);
    return recompensaAtual;
}

function calcularTempoAtual(id) {
    if (calculoCache.tempo.has(id)) {
        return calculoCache.tempo.get(id);
    }
    
    const data = linguagensData[id];
    if (!data) return data.tempo;
    
    let tempoAtual = data.tempo;
    
    for (const [upId, up] of Object.entries(upgradesData)) {
        if (up.nivel > 0 && up.tipo === 'global') {
            const efeitoNormalizado = normalizarEfeitoParaMultiploDe5(up.efeito);
            
            if (up.subtipo === 'tempo') {
                tempoAtual *= (1 - efeitoNormalizado);
            } else if (up.subtipo === 'ambos') {
                tempoAtual *= (1 - efeitoNormalizado);
            } else if (up.subtipo === 'gambiarra') {
                if (up.efeitoNegativo) {
                    tempoAtual *= (1 + up.efeitoNegativo);
                }
            } else if (up.subtipo === 'vibe') {
                if (up.efeitoNegativo) {
                    tempoAtual *= (1 + up.efeitoNegativo);
                }
            }
        }
    }
    
    for (const [upId, up] of Object.entries(lingUpgradesData)) {
        if (up.linguagemId === id && up.nivel > 0) {
            const efeitoNormalizado = normalizarEfeitoParaMultiploDe5(up.efeito);
            
            if (up.subtipo === 'tempo') {
                tempoAtual *= (1 - efeitoNormalizado);
            } else if (up.subtipo === 'ambos') {
                tempoAtual *= (1 - efeitoNormalizado);
            }
        }
    }
    
    tempoAtual /= bonusSpeedMultiplier;
    tempoAtual = aplicarBonusAscensao(tempoAtual, 'tempo', id);
    
    tempoAtual = Math.max(0.1, tempoAtual);
    tempoAtual = Math.round(tempoAtual * 10) / 10;
    
    calculoCache.tempo.set(id, tempoAtual);
    return tempoAtual;
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
        if (up.nivel > 0 && up.subtipo === 'preco') {
            const efeitoNormalizado = normalizarEfeitoParaMultiploDe5(up.efeito);
            const discountFactor = Math.max(0, 1 - efeitoNormalizado * up.nivel);
            precoTotal = Math.max(1, Math.ceil(precoTotal * discountFactor));
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
            const efeitoNormalizado = normalizarEfeitoParaMultiploDe5(up.efeito);
            const discountFactor = Math.max(0, 1 - efeitoNormalizado * up.nivel);
            preco = Math.max(1, Math.ceil(preco * discountFactor));
        }
    }
    
    return preco;
}

// =======================
// SISTEMA DE AUTOMATIZAÇÃO (AUTO-REINÍCIO)
// =======================
function ativarAutomaticoSeDisponivel(id) {
    const data = linguagensData[id];
    if (!data) return;
    
    const autoUpgrade = Object.values(lingUpgradesData).find(up => up.linguagemId === id && up.subtipo === 'automacao' && up.nivel > 0);
    if (autoUpgrade) {
        data.automatic = true;
    } else {
        data.automatic = false;
    }
}

// =======================
// FUNÇÕES DE INTERFACE
// =======================
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
    } catch (e) {
        // fallback
    }

    const angulo = Math.random() * 2 * Math.PI;
    const distancia = Math.random() * raio;
    const offsetX = Math.cos(angulo) * distancia;
    const offsetY = Math.sin(angulo) * distancia;

    popUp.style.left = (centroX + offsetX) + 'px';
    popUp.style.top = (centroY + offsetY) + 'px';
    popUp.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(popUp);

    setTimeout(() => {
        if (popUp.parentNode) {
            popUp.remove();
        }
    }, 1500);
}

// =======================
// SISTEMA DE ANIMAÇÃO CONTÍNUA DA BARRA
// =======================
function iniciarAnimacaoBarras() {
    if (animationFrameId || gamePaused) return;
    function loop() {
        if (gamePaused) {
            animationFrameId = null;
            return;
        }

        const agora = Date.now();
        let algumaAtiva = false;

        for (const [id, prod] of Object.entries(activeProductions)) {
            algumaAtiva = true;
            const elapsed = (agora - prod.startTime) / 1000;
            const total = prod.totalDuration;

            if (elapsed >= total) {
                delete activeProductions[id];
                completarProducao(id);
            } else {
                const barra = document.getElementById(`barra-${id}`);
                if (barra) {
                    const fill = barra.querySelector(".progress-fill");
                    const timer = barra.querySelector(".timer-text");
                    if (fill) {
                        const pct = (elapsed / total) * 100;
                        fill.style.width = pct + "%";
                    }
                    if (timer) {
                        const restante = Math.max(0, total - elapsed);
                        timer.textContent = formatarTempo(restante);
                    }
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

// =======================
// PAUSA / RETOMA DO JOGO (ASCENSÃO)
// =======================
function pausarJogo() {
    if (pauseState.active) return;
    console.log("⏸️ Pausando jogo");
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

    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
        tooltip.textContent = '';
    }

    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'block';
}

function desbloquearInteracao() {
    document.body.style.pointerEvents = '';
}

function retomarJogo() {
    if (!pauseState.active) return;
    console.log("▶️ Retomando jogo");
    pauseState.active = false;
    gamePaused = false;

    for (const [id, remain] of Object.entries(pauseState.productionRemains)) {
        activeProductions[id] = {
            startTime: Date.now(),
            totalDuration: remain
        };
    }
    pauseState.productionRemains = {};

    iniciarAnimacaoBarras();

    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'none';

    desbloquearInteracao();
}

// =======================
// AJUSTE DE TIMER QUANDO UPGRADE MUDA O TEMPO
// =======================
function ajustarTimerParaUpgrade(id) {
    if (!activeProductions[id]) return;

    const prod = activeProductions[id];
    const agora = Date.now();
    const elapsed = (agora - prod.startTime) / 1000;

    const novoTempoTotal = calcularTempoAtual(id);

    if (elapsed >= novoTempoTotal) {
        delete activeProductions[id];
        completarProducao(id);
        return;
    }

    prod.totalDuration = novoTempoTotal;
}

function iniciarProducao(id) {
    if (gamePaused) {
        console.warn(`⏸️ Jogo pausado, não pode iniciar produção de ${id}`);
        return;
    }
    if (activeProductions[id]) {
        console.warn(`⚠️ Produção de ${id} já em andamento`);
        return;
    }
    const data = linguagensData[id];
    if (!data || !data.desbloqueada) {
        console.warn(`❌ Linguagem ${id} não desbloqueada`);
        return;
    }

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

    activeProductions[id] = {
        startTime: Date.now(),
        totalDuration: tempoAtual
    };

    console.log(`🚀 Iniciando produção de ${id} (${tempoAtual}s)`);
    iniciarAnimacaoBarras();
}

function completarProducao(id) {
    const recompensaTotal = calcularRecompensaAtual(id);
    console.log(`🎯 Ciclo concluído: ${id} | +$${recompensaTotal}`);

    money = arredondar(money + recompensaTotal);
    totalMoneyEarned = arredondar(totalMoneyEarned + recompensaTotal);
    prestigeProgress = arredondar(prestigeProgress + recompensaTotal);
    
    if (moneyEl) {
        moneyEl.textContent = "$" + formatarDinheiro(money);
        console.log(`💰 Novo saldo: ${moneyEl.textContent}`);
    }

    verificarProgressoAscensao();

    const agora = Date.now();
    agendarAtualizacaoUpgrades(agora);
    agendarAtualizacaoEstatisticas(agora);

    const barra = document.getElementById(`barra-${id}`);
    const icon = document.querySelector(`.clickable[data-id="${id}"]`);
    if (icon) {
        criarPopUpDinheiro(recompensaTotal, icon, 50);
    }

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
    progressoAtivo[id] = false;

    delete activeProductions[id];

    const data = linguagensData[id];
    if (data && data.automatic) {
        console.log(`🔄 Reinício automático imediato de ${id}`);
        iniciarProducao(id);
        return;
    }

    setTimeout(() => {
        if (barra) {
            barra.offsetWidth;
            barra.classList.add("shake");
        }
    }, 250);
}

// =======================
// FUNÇÕES DE THROTTLE PARA OTIMIZAÇÃO
// =======================
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

// =======================
// SISTEMA DE UPGRADES COM APARECIMENTO PROGRESSIVO E ORDENAÇÃO POR NOVIDADE
// =======================
function verificarSeUpgradeGlobalDeveAparecer(upgradeId, upgradeData) {
    if (upgradeData.nivel >= upgradeData.nivelMax) return false;
    if (elementosUpgrades.has(`global_${upgradeId}`)) return true;
    
    const limiteAparecimento = upgradeData.limiteAparecimento || (upgradeData.precoAtual * 0.5);
    if (money >= upgradeData.precoAtual || money >= limiteAparecimento) return true;
    
    return false;
}

function verificarSeLingUpgradeDeveAparecer(upgradeId, upgradeData) {
    if (upgradeData.nivel >= upgradeData.nivelMax) return false;
    if (elementosUpgrades.has(`linguagem_${upgradeId}`)) return true;
    
    if (!verificarRequisitoLingUpgrade(upgradeData)) return false;
    
    const dataLinguagem = linguagensData[upgradeData.linguagemId];
    if (!dataLinguagem || !dataLinguagem.desbloqueada) return false;
    
    const preco = calcularPrecoLingUpgrade(upgradeId);
    if (money >= preco || money >= preco * 0.5) return true;
    
    return false;
}

function atualizarTodosUpgrades() {
    const lista = document.getElementById('all-upgrades');
    const noUpgradesMessage = document.getElementById('no-upgrades-message');
    const upgradesTitle = document.querySelector('.upgrades-title');
    
    if (!lista) return;
    
    const upgradesDisponiveis = new Map();
    
    for (const [id, upgrade] of Object.entries(upgradesData)) {
        if (upgrade.nivel < upgrade.nivelMax) {
            const deveAparecer = verificarSeUpgradeGlobalDeveAparecer(id, upgrade);
            if (deveAparecer) {
                const upgradeId = `global_${id}`;
                let timestamp = upgradeTimestamps.get(upgradeId);
                if (!timestamp) {
                    timestamp = Date.now();
                    upgradeTimestamps.set(upgradeId, timestamp);
                }
                upgradesDisponiveis.set(upgradeId, {
                    id,
                    tipo: 'global',
                    data: upgrade,
                    preco: upgrade.precoAtual,
                    disponivel: money >= upgrade.precoAtual,
                    nivel: upgrade.nivel,
                    nivelMax: upgrade.nivelMax,
                    upgradeId: upgradeId,
                    timestamp: timestamp
                });
            }
        }
    }
    
    for (const [id, upgrade] of Object.entries(lingUpgradesData)) {
        if (upgrade.nivel < upgrade.nivelMax) {
            const deveAparecer = verificarSeLingUpgradeDeveAparecer(id, upgrade);
            if (deveAparecer) {
                const upgradeId = `linguagem_${id}`;
                let timestamp = upgradeTimestamps.get(upgradeId);
                if (!timestamp) {
                    timestamp = Date.now();
                    upgradeTimestamps.set(upgradeId, timestamp);
                }
                const preco = calcularPrecoLingUpgrade(id);
                upgradesDisponiveis.set(upgradeId, {
                    id,
                    tipo: 'linguagem',
                    data: upgrade,
                    preco: preco,
                    disponivel: money >= preco,
                    nivel: upgrade.nivel,
                    nivelMax: upgrade.nivelMax,
                    linguagemId: upgrade.linguagemId,
                    upgradeId: upgradeId,
                    timestamp: timestamp
                });
            }
        }
    }
    
    const totalDisponiveis = upgradesDisponiveis.size;
    
    if (totalDisponiveis === 0) {
        if (noUpgradesMessage) noUpgradesMessage.style.display = 'block';
        if (upgradesTitle) upgradesTitle.classList.remove('com-novos-upgrades');
        lista.innerHTML = '';
        elementosUpgrades.clear();

        if (tooltipEl) {
            tooltipEl.classList.remove('visible');
            tooltipEl.textContent = '';
        }

        ajustarAlturaListaUpgrades();
        return;
    } else {
        if (noUpgradesMessage) noUpgradesMessage.style.display = 'none';
    }
    
    const upgradesOrdenados = Array.from(upgradesDisponiveis.values()).sort((a, b) => b.timestamp - a.timestamp);
    
    const fragment = document.createDocumentFragment();
    let novosUpgrades = 0;
    
    for (const upgradeInfo of upgradesOrdenados) {
        const upgradeId = upgradeInfo.upgradeId;
        let elemento = elementosUpgrades.get(upgradeId);
        const isNovo = !elemento;
        
        if (elemento) {
            atualizarElementoUpgrade(elemento, upgradeInfo);
        } else {
            elemento = criarElementoUpgrade(upgradeInfo);
            elementosUpgrades.set(upgradeId, elemento);
        }
        
        if (isNovo) {
            elemento.classList.add('novo-upgrade');
            novosUpgrades++;
        }
        
        fragment.appendChild(elemento);
    }
    
    for (const [upgradeId, elemento] of elementosUpgrades) {
        if (!upgradesDisponiveis.has(upgradeId) && elemento.parentNode === lista) {
            elemento.remove();
            elementosUpgrades.delete(upgradeId);
            upgradeTimestamps.delete(upgradeId);
        }
    }
    
    lista.innerHTML = '';
    lista.appendChild(fragment);
    
    if (novosUpgrades > 0 && upgradesTitle) {
        upgradesTitle.classList.add('com-novos-upgrades');
    }

    ajustarAlturaListaUpgrades();
}

function criarElementoUpgrade(upgradeInfo) {
    const { id, tipo, data, preco, disponivel, nivel, nivelMax, linguagemId, upgradeId } = upgradeInfo;
    
    const row = document.createElement('div');
    row.className = `upgrade-row ${tipo}`;
    row.dataset.id = id;
    row.dataset.tipo = tipo;
    row.dataset.upgradeId = upgradeId;
    
    if (disponivel) row.classList.add('available');
    if (nivel > 0) row.classList.add('purchased');
    
    let tooltipText = '';
    let botaoTexto = `Comprar ($${formatarDinheiro(preco)})`;
    
    if (tipo === 'global') {
        tooltipText = data.descricao;
        
        row.innerHTML = `
            <div class="upgrade-icon-row">${data.icone}</div>
            <div class="upgrade-info-row">
                <div class="upgrade-name-row">${data.nome}</div>
                <div class="upgrade-details-row">
                    <span class="upgrade-status-row ${disponivel ? 'available' : 'locked'}">
                        ${disponivel ? '!' : '$'}
                    </span>
                </div>
            </div>
            <button class="upgrade-btn-row ${disponivel ? 'available' : ''}" 
                    data-id="${id}"
                    data-tipo="global"
                    ${!disponivel ? 'disabled' : ''}>
                ${botaoTexto}
            </button>
            <div class="upgrade-tooltip">${tooltipText}</div>
        `;
    } else {
        const linguagemData = linguagensData[linguagemId];
        const recompensaAtual = calcularRecompensaAtual(linguagemId);
        const tempoAtual = calcularTempoAtual(linguagemId);
        
        tooltipText = `${data.descricao}\n💰 Valor: $${formatarDinheiro(recompensaAtual)}\n⏱️ Tempo: ${formatarTempo(tempoAtual)}`;
        if (data.requisito) {
            tooltipText += `\nRequer: ${data.requisito.valor} unidades de ${linguagemId.toUpperCase()}`;
        }
        
        row.innerHTML = `
            <div class="upgrade-icon-row ${linguagemId}">${data.icone}</div>
            <div class="upgrade-info-row">
                <div class="upgrade-name-row">${data.nome}</div>
                <div class="upgrade-details-row">
                    <span class="upgrade-status-row ${disponivel ? 'available' : 'locked'}">
                        ${disponivel ? '!' : '#'}
                    </span>
                </div>
            </div>
            <button class="upgrade-btn-row ${disponivel ? 'available' : ''}" 
                    data-id="${id}"
                    data-tipo="linguagem"
                    ${!disponivel ? 'disabled' : ''}>
                ${botaoTexto}
            </button>
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
        if (!tooltipEl) tooltipEl = document.getElementById('custom-tooltip');
        if (!tooltipEl) return;
        if (!tooltipEl.classList.contains('visible')) return;
        
        tooltipEl.style.left = e.pageX + 15 + 'px';
        tooltipEl.style.top = e.pageY - 30 + 'px';
    });
    
    row.addEventListener('mouseleave', function() {
        if (!tooltipEl) tooltipEl = document.getElementById('custom-tooltip');
        if (!tooltipEl) return;
        tooltipEl.classList.remove('visible');
    });
    
    return row;
}

function atualizarElementoUpgrade(elemento, upgradeInfo) {
    const { id, tipo, data, preco, disponivel, nivel, nivelMax, linguagemId, upgradeId } = upgradeInfo;
    
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
        const recompensaAtual = calcularRecompensaAtual(linguagemId);
        const tempoAtual = calcularTempoAtual(linguagemId);
        
        let tooltipText = `${data.descricao}\n💰 Valor: $${formatarDinheiro(recompensaAtual)}\n⏱️ Tempo: ${formatarTempo(tempoAtual)}`;
        if (data.requisito) {
            tooltipText += `\nRequer: ${data.requisito.valor} unidades de ${linguagemId.toUpperCase()}`;
        }
        
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
        for (const linguagemId in activeProductions) {
            if (activeProductions[linguagemId]) ajustarTimerParaUpgrade(linguagemId);
        }
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
    
    if (money < preco) {
        const btn = document.querySelector(`.upgrade-btn-row[data-id="${id}"][data-tipo="linguagem"]`);
        if (btn) {
            btn.classList.add("shake");
            setTimeout(() => btn.classList.remove("shake"), 300);
        }
        return false;
    }
    
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
            if (img) {
                img.click();
            }
        }
    }
    
    atualizarTodosUpgrades();
    atualizarInterfaceLinguagens();
    atualizarEstatisticas();
    
    mostrarFeedback(`✅ ${upgrade.nome} comprado!`, 'success');
    return true;
}

// =======================
// SISTEMA DE MULTIPLICADOR DE COMPRA
// =======================
function inicializarControlesMultiplicador() {
    const botoesMultiplicador = document.querySelectorAll('.multiplicador-btn');
    if (!botoesMultiplicador.length) return;
    
    botoesMultiplicador.forEach(botao => {
        botao.addEventListener('click', function() {
            const novoMultiplicador = parseInt(this.dataset.mult);
            multiplicadorCompra = novoMultiplicador;
            
            botoesMultiplicador.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            atualizarInterfaceLinguagens();
            mostrarFeedback(`Multiplicador definido para x${novoMultiplicador}`, 'success');
        });
    });
}

// =======================
// COMPRA DE LINGUAGENS COM MULTIPLICADOR
// =======================
function comprarLinguagemMultipla(id, quantidade) {
    const ling = document.querySelector(`.ling[data-id="${id}"]`);
    const data = linguagensData[id];
    if (!data) return false;
    
    const precoTotal = calcularPrecoUnitario(id, quantidade);
    
    if (money >= precoTotal) {
        money = arredondar(money - precoTotal);
        if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);
        
        for (let i = 0; i < quantidade; i++) {
            data.compras++;
            data.precoAtual = arredondar(data.precoAtual * data.multiplicadorPreco);
        }
        
        invalidarCacheCalculos();
        
        const countEl = ling.querySelector(".compra-count");
        if (countEl) countEl.textContent = data.compras;
        
        if (!data.desbloqueada && id !== "html") {
            data.desbloqueada = true;
            ling.dataset.locked = "false";
            const img = ling.querySelector("img");
            if (img) {
                img.style.filter = "none";
                img.style.opacity = "1";
            }
            console.log(`✅ Linguagem ${id} desbloqueada!`);
        }
        
        atualizarTodosUpgrades();
        atualizarEstatisticas();
        atualizarInterfaceLinguagens();
        ajustarAlturaListaUpgrades();
        
        return true;
    } else {
        return false;
    }
}

// =======================
// INTERFACE DAS LINGUAGENS
// =======================
function atualizarInterfaceLinguagens() {
    document.querySelectorAll(".ling").forEach(ling => {
        const id = ling.dataset.id;
        const data = linguagensData[id];
        if (!data) return;
        
        const precoAtual = calcularPrecoUnitario(id, multiplicadorCompra);
        const btn = ling.querySelector(".buy-btn");
        if (btn) {
            if (multiplicadorCompra > 1) {
                btn.innerHTML = `Comprar x${multiplicadorCompra}<br><span class="preco-pequeno">$${formatarDinheiro(precoAtual)}</span>`;
            } else {
                btn.innerHTML = `Comprar<br><span class="preco-pequeno">$${formatarDinheiro(precoAtual)}</span>`;
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

function inicializarInterface() {
    try {
        inicializarControlesMultiplicador();
        
        document.querySelectorAll(".ling").forEach(ling => {
            const id = ling.dataset.id;
            const data = linguagensData[id];
            if (!data) return;
            
            const precoAtual = calcularPrecoUnitario(id, multiplicadorCompra);
            const btn = ling.querySelector(".buy-btn");
            if (btn) {
                if (multiplicadorCompra > 1) {
                    btn.innerHTML = `Comprar x${multiplicadorCompra}<br><span class="preco-pequeno">$${formatarDinheiro(precoAtual)}</span>`;
                } else {
                    btn.innerHTML = `Comprar<br><span class="preco-pequeno">$${formatarDinheiro(precoAtual)}</span>`;
                }
                btn.replaceWith(btn.cloneNode(true));
            }
            
            const countEl = ling.querySelector(".compra-count");
            if (countEl) {
                countEl.textContent = data.compras;
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
        
        atualizarTodosUpgrades();
        ajustarAlturaListaUpgrades();
        setupAutoClick();
        
        atualizarReferenciasBotoesAscensao();
        
        console.log('✅ Interface do jogo inicializada com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar interface:', error);
    }
}

// =======================
// FUNÇÕES AUXILIARES
// =======================
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

function contarLinguagensDesbloqueadas() {
    return Object.values(linguagensData).filter(data => data.desbloqueada).length;
}

function contarTotalUnidades() {
    return Object.values(linguagensData).reduce((total, data) => total + data.compras, 0);
}

function contarUpgradesComprados() {
    const globais = Object.values(upgradesData).filter(u => u.nivel > 0).length;
    const linguagens = Object.values(lingUpgradesData).filter(u => u.nivel > 0).length;
    return globais + linguagens;
}

function contarUpgradesAtivos() {
    return contarUpgradesComprados();
}

function contarLinguagensAutomaticas() {
    return Object.values(linguagensData).filter(l => l.automatic).length;
}

// =======================
// ESTATÍSTICAS
// =======================
function atualizarEstatisticas() {
    try {
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
        if (statPrestigeBonus) statPrestigeBonus.textContent = `${prestigePoints} ⭐ (${prestigeBonus}% bônus passivo)`;
        if (statAscensionLevel) statAscensionLevel.textContent = `Nível ${ascensionLevel} (${ascensionLevel}% bônus passivo)`;
        
        if (!isModalVisible) return;
        
        const lista = document.getElementById('linguagens-stats-list');
        if (lista) {
            lista.innerHTML = '';
            const linguagensOrdenadas = Object.entries(linguagensData).sort(([idA], [idB]) => idA.localeCompare(idB));
            
            for (const [id, data] of linguagensOrdenadas) {
                const item = document.createElement('div');
                item.className = 'lang-stat-item';
                
                const recompensaAtual = calcularRecompensaAtual(id);
                const tempoAtual = calcularTempoAtual(id);
                
                const statusIcon = data.desbloqueada ? '✅' : '🔒';
                const statusClass = data.desbloqueada ? 'unlocked' : 'locked';
                const automaticIcon = data.automatic ? ' 🔄' : '';
                
                item.innerHTML = `
                    <span class="lang-stat-name ${statusClass}" title="${id}">
                        ${statusIcon} ${id.toUpperCase()}${automaticIcon}
                    </span>
                    <span class="lang-stat-value">
                        ${data.compras} un<br>
                        $${formatarDinheiro(recompensaAtual)}<br>
                        ${formatarTempo(tempoAtual)}
                    </span>
                `;
                lista.appendChild(item);
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

// =======================
// SISTEMA DE CLIQUE NAS LINGUAGENS
// =======================
document.querySelectorAll(".clickable").forEach(img => {
    img.addEventListener("click", () => {
        const id = img.dataset.id;
        iniciarProducao(id);
    });
});

// =======================
// CLIQUE NO CLAUDINHO
// =======================
document.getElementById('claudinho-click').addEventListener('click', function() {
    if (gamePaused) return;

    let ganhoBase = 0.10;
    for (const up of Object.values(upgradesData)) {
        if (up.nivel > 0 && up.tipo === 'global' && up.subtipo === 'clique') {
            const efeitoNormalizado = normalizarEfeitoParaMultiploDe5(up.efeito);
            ganhoBase = Math.ceil(ganhoBase * (1 + efeitoNormalizado));
        }
    }
    ganhoBase = aplicarBonusAscensao(ganhoBase, 'clique');
    
    money += ganhoBase;
    totalMoneyEarned += ganhoBase;
    prestigeProgress += ganhoBase;
    verificarProgressoAscensao();
    
    if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);
    
    criarPopUpDinheiro(ganhoBase, this, 30);
    atualizarTodosUpgrades();
    atualizarEstatisticas();
});

// =======================
// COMPRA DE UPGRADES (EVENT LISTENER)
// =======================
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

// =======================
// SISTEMA DE MENU E DEBUG
// =======================
function mostrarFeedback(mensagem, tipo) {
    try {
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
    } catch (error) {
        console.error('Erro ao mostrar feedback:', error);
    }
}

function abrirMenu() {
    try {
        const modal = document.getElementById('menu-modal');
        if (modal) {
            modal.style.display = 'block';
            atualizarEstatisticas();
            const statsTab = document.querySelector('[data-tab="stats"]');
            if (statsTab) statsTab.click();
        }
    } catch (error) {
        console.error('Erro ao abrir menu:', error);
    }
}

function fecharMenu() {
    const modal = document.getElementById('menu-modal');
    if (modal) modal.style.display = 'none';
}

function inicializarMenu() {
    try {
        const openMenuBtn = document.getElementById('open-menu');
        if (openMenuBtn) openMenuBtn.addEventListener('click', abrirMenu);
        
        const closeMenuBtn = document.querySelector('.close-menu');
        if (closeMenuBtn) closeMenuBtn.addEventListener('click', fecharMenu);
        
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
        
        console.log('✅ Sistema de menu inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar menu:', error);
    }
}

function mostrarConfirmacaoReset() {
    try {
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
    } catch (error) {
        console.error('Erro ao mostrar confirmação de reset:', error);
    }
}

function mostrarConfirmacaoDinheiro() {
    try {
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
                atualizarEstatisticas();
                atualizarTodosUpgrades();
            };
            modal.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
        }
    } catch (error) {
        console.error('Erro ao mostrar confirmação de dinheiro:', error);
    }
}

function adicionarDinheiro(quantia) {
    try {
        money = arredondar(money + quantia);
        totalMoneyEarned = arredondar(totalMoneyEarned + quantia);
        prestigeProgress = arredondar(prestigeProgress + quantia);
        
        if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);
        
        verificarProgressoAscensao();
        
        const menuModal = document.getElementById('menu-modal');
        if (menuModal && menuModal.style.display === 'block') atualizarEstatisticas();
        
        atualizarTodosUpgrades();
        mostrarFeedback(`+$${formatarDinheiro(quantia)} adicionado!`, 'success');
    } catch (error) {
        console.error('Erro ao adicionar dinheiro:', error);
    }
}

function resetarJogo() {
    try {
        console.log('🔄 Iniciando reset completo do jogo...');
        
        for (const id in activeProductions) {
            delete activeProductions[id];
        }
        
        money = 0.00;
        totalMoneyEarned = 0.00;
        prestigeUnlocked = false;
        prestigePoints = 0;
        prestigeBonus = 0;
        prestigeProgress = 0;
        prestigePointsGainedThisRun = 0;
        for (const key in prestigeUpgradesData) {
            prestigeUpgradesData[key].nivel = 0;
        }
        
        if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);
        
        linguagensData = JSON.parse(JSON.stringify(linguagensDataTemplate));
        upgradesData = JSON.parse(JSON.stringify(upgradesDataTemplate));
        lingUpgradesData = JSON.parse(JSON.stringify(lingUpgradesDataTemplate));
        
        elementosUpgrades.clear();
        upgradeTimestamps.clear();
        multiplicadorCompra = 1;
        
        iniciarTemporizador();
        inicializarInterface();
        
        for (const key in progressoAtivo) progressoAtivo[key] = false;
        
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
        
        document.querySelectorAll('.upgrade-row.novo-upgrade').forEach(el => el.classList.remove('novo-upgrade'));
        
        document.getElementById('ascensionButtonContainer').style.display = 'none';
        
        atualizarTodosUpgrades();
        atualizarEstatisticas();
        ajustarAlturaListaUpgrades();

        tooltipEl = document.getElementById('custom-tooltip');
        if (tooltipEl) {
            tooltipEl.classList.remove('visible');
            tooltipEl.textContent = '';
        }
        
        mostrarFeedback('✅ Jogo resetado com sucesso!', 'reset');
    } catch (error) {
        console.error('❌ Erro ao resetar jogo:', error);
        mostrarFeedback('❌ Erro ao resetar o jogo!', 'error');
    }
}

// =======================
// NOVO: Funções para confirmação e árvore de skills
function abrirModalConfirmacaoAscensao() {
    const modal = document.getElementById('confirm-ascension-modal');
    if (!modal) return;

    pausarJogo();

    const pontosAGanhar = prestigePointsGainedThisRun;
    const totalPontos = prestigePoints;

    const gainEl = document.getElementById('ascension-points-gain');
    const totalEl = document.getElementById('ascension-points-total');
    if (gainEl) gainEl.textContent = pontosAGanhar;
    if (totalEl) totalEl.textContent = totalPontos;

    modal.style.display = 'block';
    
    modal.onclick = (event) => {
        event.stopPropagation();
    };

    const cancelBtn = document.getElementById('cancel-ascension-btn');
    if (cancelBtn) {
        cancelBtn.disabled = true;
        cancelBtn.style.opacity = '0.5';
        cancelBtn.style.cursor = 'not-allowed';
    }

    const proceedBtn = document.getElementById('proceed-ascension-btn');
    if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.addEventListener('click', function() {
            const pontosAtuais = prestigePointsGainedThisRun;
            const upgradesComprados = JSON.parse(JSON.stringify(prestigeUpgradesData));

            resetarJogoPreservandoAscensao(pontosAtuais, upgradesComprados);

            prestigePointsGainedThisRun = 0;

            fecharModalConfirmacaoAscensao();
            abrirModalArvoreSkills();
        });
    } else {
        alert('Botão proceed-ascension-btn não encontrado!');
    }
}

function fecharModalConfirmacaoAscensao() {
    const modal = document.getElementById('confirm-ascension-modal');
    if (modal) modal.style.display = 'none';

    desbloquearInteracao();
    retomarJogo();
}

function abrirModalArvoreSkills() {
    const modal = document.getElementById('skill-tree-modal');
    if (!modal) {
        alert('ERRO: Modal skill-tree-modal não encontrado!');
        return;
    }
    
    const pontosElement = document.getElementById('skill-tree-points');
    if (pontosElement) {
        pontosElement.textContent = prestigePoints;
    }
    
    const closeBtn = document.querySelector('.close-skill-tree');
    if (closeBtn) {
        closeBtn.disabled = true;
        closeBtn.style.opacity = '0.5';
        closeBtn.style.cursor = 'not-allowed';
    }
    
    atualizarReferenciasBotoesAscensao();
    
    renderizarArvoreSkills();
    modal.style.display = 'block';
}

function fecharModalArvoreSkills() {
    const modal = document.getElementById('skill-tree-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function renderizarArvoreSkills() {
    const canvas = document.getElementById('skill-tree-canvas');
    if (!canvas) {
        alert('ERRO: Canvas skill-tree-canvas não encontrado!');
        return;
    }
    
    canvas.innerHTML = '';
    
    try {
        for (const [id, upgrade] of Object.entries(prestigeUpgradesData)) {
            if (upgrade.requisito) {
                const reqUpgrade = prestigeUpgradesData[upgrade.requisito];
                if (reqUpgrade) {
                    criarConexao(reqUpgrade, upgrade);
                }
            }
        }
        
        for (const [id, upgrade] of Object.entries(prestigeUpgradesData)) {
            criarNoSkill(id, upgrade);
        }
        
        implementarArrastarCanvas(canvas);
        implementarZoomCanvas();
    } catch (error) {
        alert('ERRO na renderização: ' + error.message);
        console.error('Erro na renderização da árvore de skills:', error);
    }
}

let currentScale = 1.0;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;

function implementarZoomCanvas() {
    const container = document.getElementById('skill-tree-container');
    const canvas = document.getElementById('skill-tree-canvas');
    const zoomIndicator = document.getElementById('zoom-indicator');

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
            window.zoomTimeout = setTimeout(() => {
                zoomIndicator.style.display = 'none';
            }, 1500);
        }
    });
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
    
    if (!fromUpgrade.requisito || prestigeUpgradesData[fromUpgrade.requisito].nivel >= prestigeUpgradesData[fromUpgrade.requisito].nivelMax) {
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
    
    const isUnlocked = !upgrade.requisito || prestigeUpgradesData[upgrade.requisito].nivel >= prestigeUpgradesData[upgrade.requisito].nivelMax;
    if (isUnlocked) {
        node.classList.add('unlocked');
    }
    
    if (upgrade.nivel > 0) {
        node.classList.add('owned');
    }
    
    node.addEventListener('mouseenter', function(e) {
        mostrarTooltipSkill(id, upgrade, e);
    });
    
    node.addEventListener('mousemove', function(e) {
        atualizarPosicaoTooltip(e);
    });
    
    node.addEventListener('mouseleave', function() {
        esconderTooltipSkill();
    });
    
    node.addEventListener('click', (e) => {
        e.stopPropagation();
        const upgradeData = prestigeUpgradesData[id];
        const isUnlocked = !upgradeData.requisito || prestigeUpgradesData[upgradeData.requisito].nivel >= prestigeUpgradesData[upgradeData.requisito].nivelMax;
        const canAfford = prestigePoints >= upgradeData.preco;
        
        if (isUnlocked && upgradeData.nivel < upgradeData.nivelMax && canAfford) {
            comprarPrestigeUpgrade(id);
        }
    });
    
    canvas.appendChild(node);
}

function mostrarTooltipSkill(id, upgrade, e) {
    if (!tooltipEl) tooltipEl = document.getElementById('custom-tooltip');
    if (!tooltipEl) return;
    
    const node = e.currentTarget;
    if (!node) return;
    
    const isUnlocked = !upgrade.requisito || prestigeUpgradesData[upgrade.requisito].nivel > 0;
    const canAfford = prestigePoints >= upgrade.preco;
    
    let tooltipText = `${upgrade.icone} ${upgrade.nome}\n${upgrade.descricao}\n\n⭐ Custo: ${upgrade.preco} pontos\n📊 Nível: ${upgrade.nivel}/${upgrade.nivelMax}`;
    
    if (!isUnlocked) {
        tooltipText += `\n\n🔒 Requer: ${prestigeUpgradesData[upgrade.requisito].nome}`;
    } else if (upgrade.nivel >= upgrade.nivelMax) {
        tooltipText += `\n\n✅ Máximo alcançado!`;
    } else if (!canAfford) {
        tooltipText += `\n\n💰 Pontos insuficientes!`;
    } else {
        tooltipText += `\n\n🖱️ Clique para comprar`;
    }
    
    tooltipEl.textContent = tooltipText;
    tooltipEl.classList.add('visible');
    
    const rect = node.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 10;
    
    if (left < 0) left = 5;
    if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 5;
    }
    if (top < 0) {
        top = rect.bottom + 10;
    }
    
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
}

function atualizarPosicaoTooltip(e) {
    // não faz nada
}

function esconderTooltipSkill() {
    if (!tooltipEl) tooltipEl = document.getElementById('custom-tooltip');
    if (!tooltipEl) return;
    tooltipEl.classList.remove('visible');
}

function comprarUpgradeSkill(id) {
    const upgrade = prestigeUpgradesData[id];
    if (!upgrade || upgrade.nivel >= upgrade.nivelMax || prestigePoints < upgrade.preco) return;
    
    upgrade.nivel++;
    prestigePoints -= upgrade.preco;
    
    prestigeBonus = prestigePoints;
    
    invalidarCacheCalculos();
    
    const pontosElement = document.getElementById('skill-tree-points');
    if (pontosElement) {
        pontosElement.textContent = prestigePoints;
    }
    
    atualizarDisplayAscensao();
    renderizarArvoreSkills();
    
    mostrarFeedback(`⭐ Upgrade "${upgrade.nome}" adquirido!`, 'success');
}

function implementarArrastarCanvas(canvas) {
    const container = canvas.parentElement;

    let isDragging = false;
    let startX, startY;
    let scrollLeft, scrollTop;

    container.addEventListener('mouseenter', () => {
        if (!isDragging) {
            container.style.cursor = 'grab';
        }
    });

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

let autoClickInterval = null;
function setupAutoClick() {
    if (autoClickInterval) clearInterval(autoClickInterval);

    let totalAutoClicks = 0;
    for (const [id, up] of Object.entries(prestigeUpgradesData)) {
        if (up.subtipo && up.subtipo.includes('autoclick') && up.nivel > 0) {
            if (up.subtipo === 'autoclick') {
                totalAutoClicks += up.nivel * up.efeito;
            } else if (up.subtipo === 'autoclick_inteligente') {
                totalAutoClicks += up.nivel * up.efeito;
            } else if (up.subtipo === 'autoclick_ml') {
                totalAutoClicks += up.nivel * up.efeito;
            }
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

function renderizarPrestigeUpgrades() {
    const container = document.getElementById('prestige-upgrades-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const [id, up] of Object.entries(prestigeUpgradesData)) {
        if (up.nivel >= up.nivelMax) continue;
        
        const row = document.createElement('div');
        row.className = 'upgrade-row prestige';
        
        const podeComprar = prestigePoints >= up.preco;
        
        row.innerHTML = `
            <div class="upgrade-icon-row">${up.icone}</div>
            <div class="upgrade-info-row">
                <div class="upgrade-name-row">${up.nome} (Nível ${up.nivel}/${up.nivelMax})</div>
                <div class="upgrade-desc-row">${up.descricao}</div>
            </div>
            <button class="upgrade-btn-row ${podeComprar ? 'available' : ''}" 
                    data-prestige-id="${id}"
                    ${!podeComprar ? 'disabled' : ''}>
                Comprar (${up.preco} ⭐)
            </button>
        `;
        
        const btn = row.querySelector('button');
        if (btn) {
            btn.addEventListener('click', () => comprarPrestigeUpgrade(id));
        }
        container.appendChild(row);
    }
    
    if (container.children.length === 0) {
        container.innerHTML = '<p class="no-upgrades">Todos os upgrades adquiridos!</p>';
    }
}

function comprarPrestigeUpgrade(id) {
    const up = prestigeUpgradesData[id];
    if (!up) return;
    if (up.nivel >= up.nivelMax) return;
    if (prestigePoints < up.preco) return;
    
    prestigePoints -= up.preco;
    up.nivel++;
    
    const ascensionPointsModal = document.getElementById('ascensionPointsModal');
    if (ascensionPointsModal) ascensionPointsModal.textContent = prestigePoints;
    
    const skillTreePoints = document.getElementById('skill-tree-points');
    if (skillTreePoints) skillTreePoints.textContent = prestigePoints;
    
    mostrarFeedback(`✅ Upgrade ${up.nome} adquirido!`, 'success');
    
    renderizarPrestigeUpgrades();
    renderizarArvoreSkills();
    
    if (up.subtipo === 'tempo' || up.subtipo === 'ambos') {
        for (const lang in activeProductions) {
            ajustarTimerParaUpgrade(lang);
        }
    }
    if (up.subtipo === 'autoclick') {
        setupAutoClick();
    }
}

function ascender() {
    const pontosAtuais = prestigePoints;
    const upgradesComprados = JSON.parse(JSON.stringify(prestigeUpgradesData));
    
    resetarJogoPreservandoAscensao(pontosAtuais, upgradesComprados);
    
    fecharModalAscensao();
    
    mostrarFeedback('⭐ Ascensão concluída! Bônus permanente ativo.', 'success');
}

function resetarJogoPreservandoAscensao(pontos, upgrades) {
    money = 0;
    totalMoneyEarned = 0;
    linguagensData = JSON.parse(JSON.stringify(linguagensDataTemplate));
    upgradesData = JSON.parse(JSON.stringify(upgradesDataTemplate));
    lingUpgradesData = JSON.parse(JSON.stringify(lingUpgradesDataTemplate));
    
    for (const id in activeProductions) delete activeProductions[id];
    
    for (const key in progressoAtivo) progressoAtivo[key] = false;
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

    prestigeProgress = 0;
    prestigePointsGainedThisRun = 0;
    
    prestigePoints = pontos;
    prestigeUpgradesData = upgrades;
    
    ascensionLevel++;
    prestigeBonus = ascensionLevel;
    
    setupAutoClick();
    
    if (moneyEl) moneyEl.textContent = "$0.00";
    
    if (prestigeUnlocked) {
        document.getElementById('ascensionButtonContainer').style.display = 'flex';
    } else {
        document.getElementById('ascensionButtonContainer').style.display = 'none';
    }
    
    verificarProgressoAscensao();
    
    inicializarInterface();
    atualizarTodosUpgrades();
    atualizarEstatisticas();
}

// =======================
// EVENTOS DE TECLADO
// =======================
document.addEventListener('keydown', function(event) {
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

// =======================
// INICIALIZAÇÃO DO POP-UP
// =======================
function initTooltip() {
    tooltipEl = document.getElementById('custom-tooltip');
    if (tooltipEl) {
        tooltipEl.classList.remove('visible');
        tooltipEl.textContent = '';
    }
}

// =======================
// FUNÇÃO PARA AJUSTAR ALTURA DA LISTA DE UPGRADES
// =======================
let lastAlturaAjuste = 0;
const ALTURA_AJUSTE_INTERVAL = 50;

function ajustarAlturaListaUpgrades() {
    const agora = Date.now();
    
    if (agora - lastAlturaAjuste < ALTURA_AJUSTE_INTERVAL) {
        return;
    }
    
    lastAlturaAjuste = agora;
    
    requestAnimationFrame(() => {
        const linguagens = document.querySelector('.linguagens');
        const upgradesContainer = document.querySelector('.upgrades-container');
        if (!linguagens || !upgradesContainer) return;
        
        const alturaLinguagens = linguagens.offsetHeight;
        upgradesContainer.style.height = alturaLinguagens + 'px';
    });
}

// =======================
// OBSERVADOR DE MUDANÇA DE TAMANHO DAS LINGUAGENS
// =======================
let resizeObserver;
function observarLinguagens() {
    const linguagens = document.querySelector('.linguagens');
    if (!linguagens) return;
    
    if (resizeObserver) resizeObserver.disconnect();
    
    resizeObserver = new ResizeObserver(entries => {
        ajustarAlturaListaUpgrades();
    });
    
    resizeObserver.observe(linguagens);
}

// =======================
// SISTEMA DE SIDEBAR (HAMBURGER)
// =======================
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
            
            setTimeout(() => {
                abrirMenu();
            }, 200);
        });
    }
    
    console.log('✅ Sistema de sidebar inicializado com sucesso');
}

// =======================
// ATUALIZAR REFERÊNCIAS DE BOTÕES NA INICIALIZAÇÃO
// =======================
let ascensionBarListenerAdded = false;

function atualizarReferenciasBotoesAscensao() {
    const ascensionBar = document.getElementById('ascensionButtonContainer');
    if (ascensionBar && !ascensionBarListenerAdded) {
        ascensionBar.addEventListener('click', () => {
            console.log("🔘 Barra de ascensão clicada");
            if (gamePaused) {
                console.warn("Jogo pausado, não pode ascender");
                return;
            }
            const proximoMarco = calcularProximoMarco();
            console.log(`Progresso: ${prestigeProgress}, Marco: ${proximoMarco}`);
            if (prestigeProgress < proximoMarco) {
                mostrarFeedback('Ainda não atingiu o próximo nível de ascensão!', 'error');
                return;
            }
            abrirModalConfirmacaoAscensao();
        });
        ascensionBarListenerAdded = true;
        console.log("✅ Listener de ascensão adicionado");
    }
    
    const closeSkillTreeBtn = document.querySelector('.close-skill-tree');
    if (closeSkillTreeBtn) {
        closeSkillTreeBtn.addEventListener('click', () => {
            if (pauseState.active) return;
            fecharModalArvoreSkills();
        });
    }
    
    const skillTreeAscendBtn = document.getElementById('skill-tree-ascend-btn');
    if (skillTreeAscendBtn) {
        skillTreeAscendBtn.addEventListener('click', () => {
            if (pauseState.active) return;
            fecharModalArvoreSkills();
            retomarJogo();

            mostrarFeedback('⭐ Upgrades aplicados! Continue progredindo.', 'success');
        });
    }
    
    const confirmAscensionModal = document.getElementById('confirm-ascension-modal');
    if (confirmAscensionModal) {
        confirmAscensionModal.addEventListener('click', (event) => {
            if (pauseState.active) return;
            if (event.target === confirmAscensionModal) {
                fecharModalConfirmacaoAscensao();
            }
        });
    }
    
    const skillTreeModal = document.getElementById('skill-tree-modal');
    if (skillTreeModal) {
        skillTreeModal.style.pointerEvents = 'auto';
    }
}

// =======================
// SISTEMA DE ÍCONE DE BÔNUS FLUTUANTE
// =======================
let bonusIcon = document.getElementById('bonus-icon');
let bonusIndicator = document.getElementById('bonus-indicator');
let bonusTimeout = null;
let bonusInterval = null;
let bonusStartTime = null;

let bonusSpeedMultiplier = 1;
let bonusRewardMultiplier = 1;

const BONUS_DURATION = 60000;

function somaRecompensasLinguagens() {
    let total = 0;
    for (const id in linguagensData) {
        if (linguagensData[id].desbloqueada) {
            total += calcularRecompensaAtual(id);
        }
    }
    return total;
}

function mostrarBonusIcon() {
    if (!bonusIcon) return;

    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    const left = Math.random() * maxX;
    const top = Math.random() * maxY;

    bonusIcon.style.left = left + 'px';
    bonusIcon.style.top = top + 'px';
    bonusIcon.style.display = 'block';

    console.log('⭐ Ícone de bônus apareceu!');
}

function esconderBonusIcon() {
    if (bonusIcon) {
        bonusIcon.style.display = 'none';
    }
}

function atualizarBarraBonus() {
    if (!bonusStartTime) return;
    const agora = Date.now();
    const tempoDecorrido = agora - bonusStartTime;
    const tempoRestante = Math.max(0, BONUS_DURATION - tempoDecorrido);
    const percentual = (tempoRestante / BONUS_DURATION) * 100;

    const progressFill = document.querySelector('.bonus-progress-fill');
    if (progressFill) {
        progressFill.style.width = percentual + '%';
    }
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
            bonusMoney = Math.ceil(bonusMoney * (1 + up.efeito * up.nivel));
        }
    }

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

    for (const id in activeProductions) {
        ajustarTimerParaUpgrade(id);
    }

    bonusTimeout = setTimeout(() => {
        bonusSpeedMultiplier = 1;
        bonusRewardMultiplier = 1;
        
        invalidarCacheCalculos();
        
        if (bonusIndicator) {
            bonusIndicator.style.display = 'none';
            bonusIndicator.innerHTML = '';
        }
        if (bonusInterval) {
            clearInterval(bonusInterval);
            bonusInterval = null;
        }
        bonusStartTime = null;
        mostrarFeedback('⏰ Bônus terminou!', 'reset');
        
        for (const id in activeProductions) {
            ajustarTimerParaUpgrade(id);
        }
    }, BONUS_DURATION);
}

if (bonusIcon) {
    bonusIcon.addEventListener('click', () => {
        esconderBonusIcon();
        aplicarBonus();
        agendarProximoBonus();
    });
}

function agendarProximoBonus() {
    let baseDelay = Math.random() * (300000 - 60000) + 60000;
    
    for (const up of Object.values(prestigeUpgradesData)) {
        if (up.nivel > 0 && up.subtipo === 'bonusicon_freq') {
            baseDelay *= (1 - up.efeito * up.nivel);
        }
    }
    
    const delay = Math.max(30000, baseDelay);
    
    setTimeout(() => {
        mostrarBonusIcon();
    }, delay);
}

// =======================
// INICIALIZAÇÃO DO JOGO
// =======================
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🎮 Iniciando I.T Adventure...');
        iniciarTemporizador();
        inicializarInterface();
        inicializarMenu();
        inicializarSidebar();
        atualizarEstatisticas();
        initTooltip();
        ajustarAlturaListaUpgrades();
        observarLinguagens();
        agendarProximoBonus();
        window.addEventListener('resize', ajustarAlturaListaUpgrades);
        
        atualizarReferenciasBotoesAscensao();
        
        console.log('✅ I.T Adventure iniciado com sucesso!');
        console.log('📋 Teclas de atalho: M, R, U, G');
    } catch (error) {
        console.error('❌ Erro ao inicializar o jogo:', error);
        mostrarFeedback('❌ Erro ao carregar o jogo!', 'error');
    }
    const upgradesList = document.getElementById('all-upgrades');
    if (upgradesList) {
        upgradesList.addEventListener('mouseleave', () => {
            if (tooltipEl) {
                tooltipEl.classList.remove('visible');
                tooltipEl.textContent = '';
            }
        });
    }
});

// =======================
// SISTEMA DE ESCALA PROPORCIONAL
// =======================
function ajustarProporcao() {
    const LARGURA_BASE = 1920;
    const ALTURA_BASE = 1080;
    const larguraAtual = window.innerWidth;
    const alturaAtual = window.innerHeight;
    let fatorEscala = Math.min(larguraAtual / LARGURA_BASE, alturaAtual / ALTURA_BASE);
    fatorEscala = Math.min(Math.max(fatorEscala, 0.625), 1);
    document.documentElement.style.setProperty('--scale', fatorEscala);
}

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(ajustarProporcao, 50);
    ajustarAlturaListaUpgrades();
});

window.addEventListener('load', () => {
    ajustarProporcao();
    ajustarAlturaListaUpgrades();
});