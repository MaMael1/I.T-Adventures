// =======================
// I.T Adventure - Sistema Completo Atualizado
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

function formatarDinheiro(valor) {
    return formatarGrandeNumero(valor);
}

function arredondar(valor) {
    return Math.round(valor * 100) / 100;
}

// =======================
// VARIÁVEIS GLOBAIS
// =======================
let money = 0.00;
let totalMoneyEarned = 0.00;
const moneyEl = document.getElementById("money");
if (moneyEl) moneyEl.textContent = "$" + formatarDinheiro(money);

let startTime = Date.now();
let playtimeInterval = null;
let intervalosAtivos = {};
let timersInfo = {};
let elementosUpgrades = new Map();
let progressoAtivo = {};

// Sistema de multiplicador de compra
let multiplicadorCompra = 1;

// =======================
// DADOS DAS LINGUAGENS
// =======================
const linguagensDataTemplate = {
    html: {
        tempo: 10,
        recompensaBase: 1.50,
        precoBase: 15.00,
        precoAtual: 15.00,
        multiplicadorPreco: 1.08,
        multiplicadorRecompensa: 0.30,
        compras: 1,
        desbloqueada: true,
        nivelUpgrade: 0,
        autoclickAtivo: false
    },
    python: {
        tempo: 30,
        recompensaBase: 8.00,
        precoBase: 50.00,
        precoAtual: 50.00,
        multiplicadorPreco: 1.10,
        multiplicadorRecompensa: 0.28,
        compras: 0,
        desbloqueada: false,
        nivelUpgrade: 0,
        autoclickAtivo: false
    },
    java: {
        tempo: 60,
        recompensaBase: 25.00,
        precoBase: 100.00,
        precoAtual: 100.00,
        multiplicadorPreco: 1.12,
        multiplicadorRecompensa: 0.26,
        compras: 0,
        desbloqueada: false,
        nivelUpgrade: 0,
        autoclickAtivo: false
    },
    c: {
        tempo: 180,
        recompensaBase: 80.00,
        precoBase: 500.00,
        precoAtual: 500.00,
        multiplicadorPreco: 1.14,
        multiplicadorRecompensa: 0.24,
        compras: 0,
        desbloqueada: false,
        nivelUpgrade: 0,
        autoclickAtivo: false
    },
    ts: {
        tempo: 600,
        recompensaBase: 250.00,
        precoBase: 1000.00,
        precoAtual: 1000.00,
        multiplicadorPreco: 1.16,
        multiplicadorRecompensa: 0.22,
        compras: 0,
        desbloqueada: false,
        nivelUpgrade: 0,
        autoclickAtivo: false
    },
    flutter: {
        tempo: 1800,
        recompensaBase: 800.00,
        precoBase: 5000.00,
        precoAtual: 5000.00,
        multiplicadorPreco: 1.18,
        multiplicadorRecompensa: 0.20,
        compras: 0,
        desbloqueada: false,
        nivelUpgrade: 0,
        autoclickAtivo: false
    },
    rust: {
        tempo: 3600,
        recompensaBase: 2500.00,
        precoBase: 10000.00,
        precoAtual: 10000.00,
        multiplicadorPreco: 1.20,
        multiplicadorRecompensa: 0.18,
        compras: 0,
        desbloqueada: false,
        nivelUpgrade: 0,
        autoclickAtivo: false
    },
    cobol: {
        tempo: 7200,
        recompensaBase: 8000.00,
        precoBase: 50000.00,
        precoAtual: 50000.00,
        multiplicadorPreco: 1.22,
        multiplicadorRecompensa: 0.16,
        compras: 0,
        desbloqueada: false,
        nivelUpgrade: 0,
        autoclickAtivo: false
    },
    assembly: {
        tempo: 14400,
        recompensaBase: 25000.00,
        precoBase: 100000.00,
        precoAtual: 100000.00,
        multiplicadorPreco: 1.24,
        multiplicadorRecompensa: 0.14,
        compras: 0,
        desbloqueada: false,
        nivelUpgrade: 0,
        autoclickAtivo: false
    },
    templeos: {
        tempo: 28800,
        recompensaBase: 80000.00,
        precoBase: 500000.00,
        precoAtual: 500000.00,
        multiplicadorPreco: 1.26,
        multiplicadorRecompensa: 0.12,
        compras: 0,
        desbloqueada: false,
        nivelUpgrade: 0,
        autoclickAtivo: false
    }
};

let linguagensData = JSON.parse(JSON.stringify(linguagensDataTemplate));

// =======================
// UPGRADES GLOBAIS COM LIMIAR DE APARECIMENTO
// =======================
const upgradesDataTemplate = {
    speed: {
        nome: "Velocidade ++",
        descricao: "Reduz tempo das linguagens em 10%",
        icone: "🚀",
        precoBase: 1000,
        precoAtual: 1000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 5,
        efeito: 0.10,
        tipo: "global",
        subtipo: "tempo",
        limiteAparecimento: 500
    },
    income: {
        nome: "Rendimento ++",
        descricao: "Aumenta ganhos em 25%",
        icone: "💰",
        precoBase: 2000,
        precoAtual: 2000,
        multiplicadorPreco: 1.6,
        nivel: 0,
        nivelMax: 5,
        efeito: 0.25,
        tipo: "global",
        subtipo: "rendimento",
        limiteAparecimento: 1000
    },
    discount: {
        nome: "Desconto Expert",
        descricao: "Reduz preços em 12%",
        icone: "🏷️",
        precoBase: 1500,
        precoAtual: 1500,
        multiplicadorPreco: 1.7,
        nivel: 0,
        nivelMax: 5,
        efeito: 0.12,
        tipo: "global",
        subtipo: "desconto",
        limiteAparecimento: 750
    },
    autoclick: {
        nome: "Auto-Clicker",
        descricao: "Clica automaticamente a cada 30s",
        icone: "🤖",
        precoBase: 5000,
        precoAtual: 5000,
        multiplicadorPreco: 2.0,
        nivel: 0,
        nivelMax: 3,
        efeito: 30,
        tipo: "global",
        subtipo: "autoclick",
        intervalo: null,
        limiteAparecimento: 2500
    },
    multiplier: {
        nome: "Multiplicador XP",
        descricao: "Aumenta bônus por unidade em 50%",
        icone: "🎯",
        precoBase: 3000,
        precoAtual: 3000,
        multiplicadorPreco: 1.8,
        nivel: 0,
        nivelMax: 3,
        efeito: 1.5,
        tipo: "global",
        subtipo: "multiplier",
        limiteAparecimento: 1500
    },
    energy: {
        nome: "Energia Máxima",
        descricao: "Aumenta limite de produções simultâneas",
        icone: "⚡",
        precoBase: 2500,
        precoAtual: 2505,
        multiplicadorPreco: 1.9,
        nivel: 0,
        nivelMax: 3,
        efeito: 1,
        tipo: "global",
        subtipo: "energia",
        limiteAparecimento: 1250
    }
};

let upgradesData = JSON.parse(JSON.stringify(upgradesDataTemplate));

// =======================
// UPGRADES DE LINGUAGEM
// =======================
const lingUpgradesDataTemplate = {
    html: {
        nome: "HTML Master",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "🌐",
        precoBase: 500,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "html",
        proximoMarco: 10,
        autoclickNivel: 5
    },
    python: {
        nome: "Python Expert",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "🐍",
        precoBase: 1000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "python",
        proximoMarco: 10,
        autoclickNivel: 5
    },
    java: {
        nome: "Java Pro",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "☕",
        precoBase: 2000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "java",
        proximoMarco: 10,
        autoclickNivel: 5
    },
    c: {
        nome: "C Master",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "⚙️",
        precoBase: 5000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "c",
        proximoMarco: 10,
        autoclickNivel: 5
    },
    ts: {
        nome: "TypeScript Expert",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "📘",
        precoBase: 10000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "ts",
        proximoMarco: 10,
        autoclickNivel: 5
    },
    flutter: {
        nome: "Flutter Guru",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "📱",
        precoBase: 25000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "flutter",
        proximoMarco: 10,
        autoclickNivel: 5
    },
    rust: {
        nome: "Rust Master",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "🦀",
        precoBase: 50000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "rust",
        proximoMarco: 10,
        autoclickNivel: 5
    },
    cobol: {
        nome: "COBOL Legend",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "💾",
        precoBase: 100000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "cobol",
        proximoMarco: 10,
        autoclickNivel: 5
    },
    assembly: {
        nome: "Assembly Wizard",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "🔧",
        precoBase: 250000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "assembly",
        proximoMarco: 10,
        autoclickNivel: 5
    },
    templeos: {
        nome: "TempleOS God",
        descricaoBase: "Velocidade +20% | Valor +20%",
        icone: "👑",
        precoBase: 500000,
        multiplicadorPreco: 1.5,
        nivel: 0,
        nivelMax: 10,
        reducaoTempo: 0.20,
        aumentoValor: 0.20,
        tipo: "linguagem",
        linguagemId: "templeos",
        proximoMarco: 10,
        autoclickNivel: 5
    }
};

let lingUpgradesData = JSON.parse(JSON.stringify(lingUpgradesDataTemplate));

// =======================
// ORDEM DOS UPGRADES
// =======================
const upgradesOrdemFixa = [
    'global_speed',
    'global_income', 
    'global_discount',
    'global_autoclick',
    'global_multiplier',
    'global_energy',
    'linguagem_html',
    'linguagem_python',
    'linguagem_java',
    'linguagem_c',
    'linguagem_ts',
    'linguagem_flutter',
    'linguagem_rust',
    'linguagem_cobol',
    'linguagem_assembly',
    'linguagem_templeos'
];

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
// CÁLCULOS DE PRECOS E RECOMPENSAS
// =======================
function calcularProximoMarco(id) {
    const data = linguagensData[id];
    const upgrade = lingUpgradesData[id];
    
    if (!data || !upgrade) return 0;
    
    const nivelAtual = upgrade.nivel;
    
    if (nivelAtual === 0) return 10;
    else if (nivelAtual === 1) return 50;
    else if (nivelAtual === 2) return 100;
    else return 100 + (nivelAtual - 2) * 100;
}

function verificarUpgradeDisponivel(id) {
    const data = linguagensData[id];
    const upgrade = lingUpgradesData[id];
    
    if (!data || !upgrade || !data.desbloqueada) return false;
    if (upgrade.nivel >= upgrade.nivelMax) return false;
    
    const proximoMarco = calcularProximoMarco(id);
    return data.compras >= proximoMarco;
}

function calcularRecompensaAtual(id) {
    const data = linguagensData[id];
    if (!data) return 0;
    
    let recompensaBaseComBonus = data.recompensaBase;
    if (data.compras > 1) {
        const bonusPorUnidade = data.multiplicadorRecompensa;
        const bonusTotal = bonusPorUnidade * (data.compras - 1);
        recompensaBaseComBonus = arredondar(data.recompensaBase * (1 + bonusTotal));
    }
    
    let recompensaAtual = recompensaBaseComBonus;
    
    const upgradeMultiplier = upgradesData.multiplier;
    if (upgradeMultiplier.nivel > 0) {
        recompensaAtual *= (1 + (upgradeMultiplier.efeito - 1) * upgradeMultiplier.nivel);
    }
    
    const upgradeIncome = upgradesData.income;
    if (upgradeIncome.nivel > 0) {
        recompensaAtual *= (1 + (upgradeIncome.efeito * upgradeIncome.nivel));
    }
    
    const lingUpgrade = lingUpgradesData[id];
    if (lingUpgrade && lingUpgrade.nivel > 0) {
        recompensaAtual *= Math.pow((1 + lingUpgrade.aumentoValor), lingUpgrade.nivel);
    }
    
    recompensaAtual = arredondar(recompensaAtual);
    
    return recompensaAtual;
}

function calcularTempoAtual(id) {
    const data = linguagensData[id];
    if (!data) return data.tempo;
    
    let tempoAtual = data.tempo;
    
    const upgradeSpeed = upgradesData.speed;
    if (upgradeSpeed.nivel > 0) {
        const reducaoPercentual = upgradeSpeed.efeito * upgradeSpeed.nivel;
        tempoAtual *= (1 - reducaoPercentual);
    }
    
    const lingUpgrade = lingUpgradesData[id];
    if (lingUpgrade && lingUpgrade.nivel > 0) {
        tempoAtual *= Math.pow((1 - lingUpgrade.reducaoTempo), lingUpgrade.nivel);
    }
    
    tempoAtual = Math.max(1, Math.floor(tempoAtual));
    
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
    
    const upgradeDiscount = upgradesData.discount;
    if (upgradeDiscount.nivel > 0) {
        const descontoPercentual = upgradeDiscount.efeito * upgradeDiscount.nivel;
        precoTotal *= (1 - descontoPercentual);
        precoTotal = arredondar(precoTotal);
    }
    
    return arredondar(precoTotal);
}

function calcularPrecoLingUpgrade(id) {
    const upgrade = lingUpgradesData[id];
    if (!upgrade) return 0;
    
    return arredondar(upgrade.precoBase * Math.pow(upgrade.multiplicadorPreco, upgrade.nivel));
}

// =======================
// SISTEMA DE AUTO-CLICK POR LINGUAGEM
// =======================
function verificarEAtivarAutoClickLinguagem(id) {
    const lingUpgrade = lingUpgradesData[id];
    const data = linguagensData[id];
    
    if (lingUpgrade && data) {
        if (lingUpgrade.nivel >= lingUpgrade.autoclickNivel && !data.autoclickAtivo) {
            data.autoclickAtivo = true;
            console.log(`✅ Auto-click ativado para ${id}!`);
            
            if (!intervalosAtivos[id]) {
                const img = document.querySelector(`.clickable[data-id="${id}"]`);
                if (img) {
                    img.click();
                }
            }
        }
    }
}

// =======================
// FUNÇÕES DE INTERFACE
// =======================
function criarPopUpDinheiro(valor, elementoPai) {
    const popUp = document.createElement('div');
    popUp.textContent = `+$${formatarDinheiro(valor)}`;
    popUp.classList.add('money-popup');
    
    popUp.style.position = 'absolute';
    popUp.style.color = '#27ae60';
    popUp.style.fontWeight = 'bold';
    popUp.style.fontSize = '16px';
    popUp.style.top = '50%';
    popUp.style.left = '50%';
    popUp.style.transform = 'translate(-50%, -50%)';
    popUp.style.zIndex = '10';
    popUp.style.pointerEvents = 'none';
    popUp.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
    popUp.style.animation = 'moneyParticle 1.5s ease-out forwards';
    popUp.style.background = 'rgba(39, 174, 96, 0.2)';
    popUp.style.padding = '5px 10px';
    popUp.style.borderRadius = '5px';
    popUp.style.border = '2px solid #27ae60';
    
    if (elementoPai) {
        elementoPai.appendChild(popUp);
        
        setTimeout(() => {
            if (popUp.parentNode) {
                popUp.remove();
            }
        }, 1500);
    }
    
    return popUp;
}

function ajustarTimerParaUpgrade(id) {
    if (!intervalosAtivos[id] || !timersInfo[id]) return;
    
    const barra = document.getElementById(`barra-${id}`);
    const fill = barra.querySelector(".progress-fill");
    const timer = barra.querySelector(".timer-text");
    
    const info = timersInfo[id];
    
    const tempoTotalAntigo = info.tempoTotal;
    const tempoTotalNovo = calcularTempoAtual(id);
    
    const tempoDecorrido = tempoTotalAntigo - info.tempoRestante;
    const progresso = tempoDecorrido / tempoTotalAntigo;
    
    let novoTempoRestante = tempoTotalNovo * (1 - progresso);
    novoTempoRestante = Math.max(0, Math.ceil(novoTempoRestante));
    
    clearInterval(intervalosAtivos[id]);
    
    timersInfo[id].tempoTotal = tempoTotalNovo;
    timersInfo[id].tempoRestante = novoTempoRestante;
    
    const pct = ((tempoTotalNovo - novoTempoRestante) / tempoTotalNovo) * 100;
    if (fill) {
        fill.style.transition = 'width 0.5s ease';
        fill.style.width = pct + "%";
    }
    
    if (timer) {
        timer.textContent = formatarTempo(novoTempoRestante);
    }
    
    if (novoTempoRestante <= 0) {
        completarProducao(id);
        return;
    }
    
    intervalosAtivos[id] = setInterval(() => {
        novoTempoRestante--;
        if (novoTempoRestante < 0) novoTempoRestante = 0;
        
        const pct = ((tempoTotalNovo - novoTempoRestante) / tempoTotalNovo) * 100;
        if (fill) {
            fill.style.width = pct + "%";
        }
        
        if (timer) {
            timer.textContent = formatarTempo(novoTempoRestante);
        }
        
        timersInfo[id].tempoRestante = novoTempoRestante;
        
        if (novoTempoRestante <= 0) {
            clearInterval(intervalosAtivos[id]);
            delete intervalosAtivos[id];
            delete timersInfo[id];
            
            completarProducao(id);
        }
    }, 1000);
}

function completarProducao(id) {
    const recompensaTotal = calcularRecompensaAtual(id);
    
    money = arredondar(money + recompensaTotal);
    totalMoneyEarned = arredondar(totalMoneyEarned + recompensaTotal);
    
    if (moneyEl) {
        moneyEl.textContent = "$" + formatarDinheiro(money);
    }
    
    atualizarEstatisticas();
    atualizarTodosUpgrades();
    
    const barra = document.getElementById(`barra-${id}`);
    criarPopUpDinheiro(recompensaTotal, barra);
    
    setTimeout(() => {
        const fill = barra.querySelector(".progress-fill");
        const timer = barra.querySelector(".timer-text");
        
        if (fill) {
            fill.style.transition = 'none';
            fill.style.width = "0%";
            fill.offsetHeight;
            fill.style.transition = 'width 0.45s cubic-bezier(.22,.9,.36,1)';
        }
        
        if (timer) {
            timer.textContent = "00:00";
        }
        
        if (barra) {
            barra.classList.remove("shake");
            barra.offsetWidth;
            barra.classList.add("shake");
        }
        
        progressoAtivo[id] = false;
        
        const data = linguagensData[id];
        if (data && data.autoclickAtivo) {
            setTimeout(() => {
                const img = document.querySelector(`.clickable[data-id="${id}"]`);
                if (img && !intervalosAtivos[id]) {
                    img.click();
                    console.log(`🔄 Auto-click de ${id} iniciou nova produção`);
                }
            }, 500);
        }
    }, 250);
}

// =======================
// SISTEMA DE UPGRADES COM APARECIMENTO PROGRESSIVO
// =======================
function verificarSeUpgradeGlobalDeveAparecer(upgradeId, upgradeData) {
    // Se já foi comprado totalmente, não mostrar
    if (upgradeData.nivel >= upgradeData.nivelMax) {
        return false;
    }
    
    // Se já está na lista, continuar mostrando
    if (elementosUpgrades.has(`global_${upgradeId}`)) {
        return true;
    }
    
    // Verificar se o jogador atingiu o limite de aparecimento (50% do preço atual)
    const limiteAparecimento = upgradeData.limiteAparecimento || (upgradeData.precoAtual * 0.5);
    
    // Se o jogador já tem dinheiro suficiente para comprar OU atingiu o limite de aparecimento
    if (money >= upgradeData.precoAtual || money >= limiteAparecimento) {
        return true;
    }
    
    return false;
}

function atualizarTodosUpgrades() {
    const lista = document.getElementById('all-upgrades');
    const noUpgradesMessage = document.getElementById('no-upgrades-message');
    const upgradesTitle = document.querySelector('.upgrades-title');
    
    if (!lista) return;
    
    const upgradesDisponiveis = new Map();
    
    // Adicionar upgrades globais que devem aparecer
    for (const [id, upgrade] of Object.entries(upgradesData)) {
        if (upgrade.nivel < upgrade.nivelMax) {
            const deveAparecer = verificarSeUpgradeGlobalDeveAparecer(id, upgrade);
            
            if (deveAparecer) {
                const upgradeId = `global_${id}`;
                
                upgradesDisponiveis.set(upgradeId, {
                    id,
                    tipo: 'global',
                    data: upgrade,
                    preco: upgrade.precoAtual,
                    disponivel: money >= upgrade.precoAtual,
                    nivel: upgrade.nivel,
                    nivelMax: upgrade.nivelMax,
                    upgradeId: upgradeId
                });
            }
        }
    }
    
    // Adicionar upgrades de linguagem (só aparecem quando há quantidade suficiente)
    for (const [id, upgrade] of Object.entries(lingUpgradesData)) {
        const dataLinguagem = linguagensData[upgrade.linguagemId];
        
        if (dataLinguagem && dataLinguagem.desbloqueada) {
            const temUpgradeDisponivel = verificarUpgradeDisponivel(upgrade.linguagemId);
            
            if (temUpgradeDisponivel) {
                const upgradeId = `linguagem_${upgrade.linguagemId}`;
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
                    upgradeId: upgradeId
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
        return;
    } else {
        if (noUpgradesMessage) noUpgradesMessage.style.display = 'none';
    }
    
    const fragment = document.createDocumentFragment();
    let upgradesExibidos = 0;
    let novosUpgrades = 0;
    
    for (const upgradeId of upgradesOrdemFixa) {
        if (upgradesDisponiveis.has(upgradeId)) {
            const upgradeInfo = upgradesDisponiveis.get(upgradeId);
            
            let elemento = elementosUpgrades.get(upgradeId);
            const isNovo = !elemento;
            
            if (elemento) {
                atualizarElementoUpgrade(elemento, upgradeInfo);
            } else {
                elemento = criarElementoUpgrade(upgradeInfo);
                elementosUpgrades.set(upgradeId, elemento);
            }
            
            if (isNovo && upgradeInfo.tipo === 'global') {
                elemento.classList.add('novo-upgrade');
                novosUpgrades++;
            }
            
            fragment.appendChild(elemento);
            upgradesExibidos++;
        }
    }
    
    // Remover upgrades que não estão mais disponíveis
    for (const [upgradeId, elemento] of elementosUpgrades) {
        if (!upgradesDisponiveis.has(upgradeId) && elemento.parentNode === lista) {
            elemento.remove();
            elementosUpgrades.delete(upgradeId);
        }
    }
    
    lista.innerHTML = '';
    lista.appendChild(fragment);
    
    if (novosUpgrades > 0 && upgradesTitle) {
        upgradesTitle.classList.add('com-novos-upgrades');
        setTimeout(() => {
            document.querySelectorAll('.upgrade-row.novo-upgrade').forEach(row => {
                row.classList.remove('novo-upgrade');
            });
        }, 1000);
        
        setTimeout(() => {
            if (upgradesTitle) upgradesTitle.classList.remove('com-novos-upgrades');
        }, 3000);
    }
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
    let botaoTexto = '';
    
    if (tipo === 'global') {
        tooltipText = data.descricao;
        
        if (nivel === 0) {
            botaoTexto = `Comprar ($${formatarDinheiro(preco)})`;
        } else if (nivel < nivelMax) {
            botaoTexto = `Melhorar ($${formatarDinheiro(preco)})`;
        } else {
            botaoTexto = 'Máx';
        }
        
        row.innerHTML = `
            <div class="upgrade-icon-row">${data.icone}</div>
            <div class="upgrade-info-row">
                <div class="upgrade-name-row">${data.nome} ${nivel > 0 ? `(Nível ${nivel})` : ''}</div>
                <div class="upgrade-details-row">
                    <span class="upgrade-level-row">${nivel}/${nivelMax}</span>
                    <span class="upgrade-status-row ${disponivel ? 'available' : 'locked'}">
                        ${disponivel ? '!' : '$'}
                    </span>
                </div>
            </div>
            <button class="upgrade-btn-row ${disponivel ? 'available' : ''} ${nivel > 0 ? 'purchased' : ''}" 
                    data-id="${id}"
                    data-tipo="global"
                    ${!disponivel ? 'disabled' : ''}>
                ${botaoTexto}
            </button>
            <div class="upgrade-tooltip">${tooltipText}</div>
        `;
    } else {
        const linguagemData = linguagensData[linguagemId];
        const proximoMarco = calcularProximoMarco(linguagemId);
        const recompensaAtual = calcularRecompensaAtual(linguagemId);
        const tempoAtual = calcularTempoAtual(linguagemId);
        const autoclickInfo = data.autoclickNivel && nivel >= data.autoclickNivel ? '\n🔄 Auto-click ativado!' : '';
        
        tooltipText = `${data.descricaoBase}\n💰 Valor: $${formatarDinheiro(recompensaAtual)}\n⏱️ Tempo: ${formatarTempo(tempoAtual)}s${autoclickInfo}`;
        
        if (nivel === 0) {
            botaoTexto = `Comprar ($${formatarDinheiro(preco)})`;
        } else if (nivel < nivelMax) {
            botaoTexto = `Melhorar ($${formatarDinheiro(preco)})`;
        } else {
            botaoTexto = 'Máx';
        }
        
        row.innerHTML = `
            <div class="upgrade-icon-row ${linguagemId}">${data.icone}</div>
            <div class="upgrade-info-row">
                <div class="upgrade-name-row">${data.nome} ${nivel > 0 ? `(${nivel})` : ''}</div>
                <div class="upgrade-details-row">
                    <span class="upgrade-level-row">${linguagemData.compras}/${proximoMarco}</span>
                    <span class="upgrade-status-row ${disponivel ? 'available' : 'locked'}">
                        ${disponivel ? '!' : '#'}
                    </span>
                </div>
            </div>
            <button class="upgrade-btn-row ${disponivel ? 'available' : ''} ${nivel > 0 ? 'purchased' : ''}" 
                    data-id="${id}"
                    data-tipo="linguagem"
                    ${!disponivel ? 'disabled' : ''}>
                ${botaoTexto}
            </button>
            <div class="upgrade-tooltip">${tooltipText}</div>
        `;
    }
    
    return row;
}

function atualizarElementoUpgrade(elemento, upgradeInfo) {
    const { id, tipo, data, preco, disponivel, nivel, nivelMax, linguagemId, upgradeId } = upgradeInfo;
    
    elemento.className = `upgrade-row ${tipo}`;
    
    if (disponivel) elemento.classList.add('available');
    else elemento.classList.remove('available');
    
    if (nivel > 0) elemento.classList.add('purchased');
    else elemento.classList.remove('purchased');
    
    let botaoTexto = '';
    
    if (tipo === 'global') {
        if (nivel === 0) {
            botaoTexto = `Comprar ($${formatarDinheiro(preco)})`;
        } else if (nivel < nivelMax) {
            botaoTexto = `Melhorar ($${formatarDinheiro(preco)})`;
        } else {
            botaoTexto = 'Máx';
        }
        
        const icon = elemento.querySelector('.upgrade-icon-row');
        const name = elemento.querySelector('.upgrade-name-row');
        const level = elemento.querySelector('.upgrade-level-row');
        const status = elemento.querySelector('.upgrade-status-row');
        const btn = elemento.querySelector('.upgrade-btn-row');
        const tooltip = elemento.querySelector('.upgrade-tooltip');
        
        if (icon) icon.textContent = data.icone;
        if (name) name.textContent = `${data.nome} ${nivel > 0 ? `(Nível ${nivel})` : ''}`;
        if (level) level.textContent = `${nivel}/${nivelMax}`;
        
        if (status) {
            status.className = `upgrade-status-row ${disponivel ? 'available' : 'locked'}`;
            status.textContent = disponivel ? '!' : '$';
        }
        
        if (btn) {
            btn.className = `upgrade-btn-row ${disponivel ? 'available' : ''} ${nivel > 0 ? 'purchased' : ''}`;
            btn.disabled = !disponivel;
            btn.textContent = botaoTexto;
        }
        
        if (tooltip) {
            tooltip.textContent = data.descricao;
        }
    } else {
        const linguagemData = linguagensData[linguagemId];
        const proximoMarco = calcularProximoMarco(linguagemId);
        const recompensaAtual = calcularRecompensaAtual(linguagemId);
        const tempoAtual = calcularTempoAtual(linguagemId);
        const autoclickInfo = data.autoclickNivel && nivel >= data.autoclickNivel ? '\n🔄 Auto-click ativado!' : '';
        
        const tooltipText = `${data.descricaoBase}\n💰 Valor: $${formatarDinheiro(recompensaAtual)}\n⏱️ Tempo: ${formatarTempo(tempoAtual)}s${autoclickInfo}`;
        
        if (nivel === 0) {
            botaoTexto = `Comprar ($${formatarDinheiro(preco)})`;
        } else if (nivel < nivelMax) {
            botaoTexto = `Melhorar ($${formatarDinheiro(preco)})`;
        } else {
            botaoTexto = 'Máx';
        }
        
        const icon = elemento.querySelector('.upgrade-icon-row');
        const name = elemento.querySelector('.upgrade-name-row');
        const level = elemento.querySelector('.upgrade-level-row');
        const status = elemento.querySelector('.upgrade-status-row');
        const btn = elemento.querySelector('.upgrade-btn-row');
        const tooltip = elemento.querySelector('.upgrade-tooltip');
        
        if (icon) {
            icon.className = `upgrade-icon-row ${linguagemId}`;
            icon.textContent = data.icone;
        }
        
        if (name) name.textContent = `${data.nome} ${nivel > 0 ? `(${nivel})` : ''}`;
        if (level) level.textContent = `${linguagemData.compras}/${proximoMarco}`;
        
        if (status) {
            status.className = `upgrade-status-row ${disponivel ? 'available' : 'locked'}`;
            status.textContent = disponivel ? '!' : '#';
        }
        
        if (btn) {
            btn.className = `upgrade-btn-row ${disponivel ? 'available' : ''} ${nivel > 0 ? 'purchased' : ''}`;
            btn.disabled = !disponivel;
            btn.textContent = botaoTexto;
        }
        
        if (tooltip) {
            tooltip.textContent = tooltipText;
        }
    }
}

function comprarUpgrade(id) {
    const upgrade = upgradesData[id];
    
    if (!upgrade) return false;
    if (upgrade.nivel >= upgrade.nivelMax) return false;
    if (money < upgrade.precoAtual) return false;
    
    money = arredondar(money - upgrade.precoAtual);
    
    if (moneyEl) {
        moneyEl.textContent = "$" + formatarDinheiro(money);
    }
    
    upgrade.nivel++;
    
    if (upgrade.subtipo === 'tempo') {
        for (const linguagemId in intervalosAtivos) {
            if (intervalosAtivos[linguagemId]) {
                ajustarTimerParaUpgrade(linguagemId);
            }
        }
    }
    
    aplicarEfeitoUpgrade(id);
    
    if (upgrade.nivel < upgrade.nivelMax) {
        upgrade.precoAtual = arredondar(upgrade.precoAtual * upgrade.multiplicadorPreco);
    }
    
    atualizarTodosUpgrades();
    atualizarEstatisticas();
    atualizarInterfaceLinguagens();
    
    mostrarFeedback(`✅ ${upgrade.nome} comprado! Nível ${upgrade.nivel}`, 'success');
    return true;
}

function comprarLingUpgrade(id) {
    const upgrade = lingUpgradesData[id];
    const linguagemId = upgrade.linguagemId;
    const data = linguagensData[linguagemId];
    
    if (!upgrade || !data) return false;
    if (!verificarUpgradeDisponivel(linguagemId)) return false;
    
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
    
    if (moneyEl) {
        moneyEl.textContent = "$" + formatarDinheiro(money);
    }
    
    upgrade.nivel++;
    upgrade.proximoMarco = calcularProximoMarco(linguagemId);
    
    if (intervalosAtivos[linguagemId]) {
        ajustarTimerParaUpgrade(linguagemId);
    }
    
    verificarEAtivarAutoClickLinguagem(linguagemId);
    
    atualizarTodosUpgrades();
    atualizarInterfaceLinguagens();
    atualizarEstatisticas();
    
    mostrarFeedback(`✅ ${upgrade.nome} melhorado! Nível ${upgrade.nivel}`, 'success');
    return true;
}

function aplicarEfeitoUpgrade(id) {
    const upgrade = upgradesData[id];
    
    switch(upgrade.subtipo) {
        case 'autoclick':
            if (upgrade.nivel === 1) {
                iniciarAutoClicker();
            }
            break;
    }
}

function iniciarAutoClicker() {
    const upgrade = upgradesData.autoclick;
    
    if (upgrade.intervalo) {
        clearInterval(upgrade.intervalo);
    }
    
    const intervalo = upgrade.efeito / (upgrade.nivel || 1);
    
    upgrade.intervalo = setInterval(() => {
        const linguagensDisponiveis = Object.keys(linguagensData).filter(id => {
            const data = linguagensData[id];
            return data.desbloqueada && !intervalosAtivos[id];
        });
        
        if (linguagensDisponiveis.length > 0) {
            const randomId = linguagensDisponiveis[Math.floor(Math.random() * linguagensDisponiveis.length)];
            const img = document.querySelector(`.clickable[data-id="${randomId}"]`);
            if (img) {
                img.click();
                console.log(`🤖 Auto-clicker clicou em ${randomId}`);
            }
        }
    }, intervalo * 1000);
    
    console.log(`🤖 Auto-clicker iniciado (${intervalo}s entre clicks)`);
}

// =======================
// SISTEMA DE MULTIPLICADOR DE COMPRA - MODIFICADO
// =======================
function inicializarControlesMultiplicador() {
    const botoesMultiplicador = document.querySelectorAll('.multiplicador-btn');
    
    if (!botoesMultiplicador.length) return;
    
    botoesMultiplicador.forEach(botao => {
        botao.addEventListener('click', function() {
            const novoMultiplicador = parseInt(this.dataset.mult);
            multiplicadorCompra = novoMultiplicador;
            
            // Remover classe active de todos os botões
            botoesMultiplicador.forEach(b => b.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Atualizar interface das linguagens
            atualizarInterfaceLinguagens();
            
            // Feedback visual
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
        
        if (moneyEl) {
            moneyEl.textContent = "$" + formatarDinheiro(money);
        }
        
        for (let i = 0; i < quantidade; i++) {
            data.compras++;
            data.precoAtual = arredondar(data.precoAtual * data.multiplicadorPreco);
        }
        
        const countEl = ling.querySelector(".compra-count");
        if (countEl) {
            countEl.textContent = data.compras;
        }
        
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
        
        if (verificarUpgradeDisponivel(id)) {
            const countEl = ling.querySelector(".compra-count");
            if (countEl) {
                countEl.classList.add('upgrade-disponivel');
            }
            
            console.log(`🎉 Upgrade disponível para ${id}! ${data.compras} unidades alcançadas.`);
        }
        
        verificarEAtivarAutoClickLinguagem(id);
        
        atualizarEstatisticas();
        atualizarTodosUpgrades();
        atualizarInterfaceLinguagens();
        
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
            
            if (verificarUpgradeDisponivel(id)) {
                countEl.classList.add('upgrade-disponivel');
            } else {
                countEl.classList.remove('upgrade-disponivel');
            }
            
            if (data.autoclickAtivo) {
                countEl.classList.add('autoclick-ativo');
            } else {
                countEl.classList.remove('autoclick-ativo');
            }
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
                
                // Remover event listener antigo se existir
                btn.replaceWith(btn.cloneNode(true));
            }
            
            const countEl = ling.querySelector(".compra-count");
            if (countEl) {
                countEl.textContent = data.compras;
                
                if (verificarUpgradeDisponivel(id)) {
                    countEl.classList.add('upgrade-disponivel');
                } else {
                    countEl.classList.remove('upgrade-disponivel');
                }
                
                if (data.autoclickAtivo) {
                    countEl.classList.add('autoclick-ativo');
                } else {
                    countEl.classList.remove('autoclick-ativo');
                }
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
        
        // Adicionar event listeners aos botões de compra
        document.querySelectorAll(".buy-btn").forEach(btn => {
            btn.addEventListener("click", (event) => {
                event.stopPropagation();
                
                const id = btn.dataset.id;
                
                if (comprarLinguagemMultipla(id, multiplicadorCompra)) {
                    // Sucesso
                } else {
                    btn.classList.add("shake");
                    setTimeout(() => btn.classList.remove("shake"), 300);
                }
            });
        });
        
        atualizarTodosUpgrades();
        
        console.log('✅ Interface do jogo inicializada com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar interface:', error);
    }
}

// =======================
// FUNÇÕES AUXILIARES
// =======================
function formatarTempo(segundos) {
    segundos = Math.max(0, Math.floor(segundos));
    if (segundos >= 3600) {
        const h = Math.floor(segundos / 3600);
        const m = Math.floor((segundos % 3600) / 60);
        const s = segundos % 60;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    } else if (segundos >= 60) {
        const m = Math.floor(segundos / 60);
        const s = segundos % 60;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    } else {
        return `00:${String(segundos).padStart(2,'0')}`;
    }
}

function contarLinguagensDesbloqueadas() {
    return Object.values(linguagensData).filter(data => data.desbloqueada).length;
}

function contarTotalUnidades() {
    return Object.values(linguagensData).reduce((total, data) => total + data.compras, 0);
}

function contarUpgradesComprados() {
    const globaisComprados = Object.values(upgradesData).reduce((total, upgrade) => total + upgrade.nivel, 0);
    const linguagensComprados = Object.values(lingUpgradesData).reduce((total, upgrade) => total + upgrade.nivel, 0);
    
    return globaisComprados + linguagensComprados;
}

function contarUpgradesAtivos() {
    const globaisAtivos = Object.values(upgradesData).filter(upgrade => upgrade.nivel > 0).length;
    const linguagensAtivos = Object.values(lingUpgradesData).filter(upgrade => upgrade.nivel > 0).length;
    
    return globaisAtivos + linguagensAtivos;
}

// =======================
// ESTATÍSTICAS
// =======================
function atualizarEstatisticas() {
    try {
        const statTotalEarned = document.getElementById('stat-total-earned');
        const statUnlocked = document.getElementById('stat-unlocked');
        const statTotalUnits = document.getElementById('stat-total-units');
        const statPlaytime = document.getElementById('stat-playtime');
        const statUpgrades = document.getElementById('stat-upgrades');
        const statActiveUpgrades = document.getElementById('stat-active-upgrades');
        
        if (statTotalEarned) statTotalEarned.textContent = `$${formatarDinheiro(totalMoneyEarned)}`;
        if (statUnlocked) statUnlocked.textContent = `${contarLinguagensDesbloqueadas()}/10`;
        if (statTotalUnits) statTotalUnits.textContent = contarTotalUnidades();
        if (statPlaytime) statPlaytime.textContent = formatarTempoJogo();
        if (statUpgrades) statUpgrades.textContent = contarUpgradesComprados();
        if (statActiveUpgrades) statActiveUpgrades.textContent = contarUpgradesAtivos();
        
        const lista = document.getElementById('linguagens-stats-list');
        if (lista) {
            lista.innerHTML = '';
            
            const linguagensOrdenadas = Object.entries(linguagensData)
                .sort(([idA], [idB]) => idA.localeCompare(idB));
            
            for (const [id, data] of linguagensOrdenadas) {
                const item = document.createElement('div');
                item.className = 'lang-stat-item';
                
                const recompensaAtual = calcularRecompensaAtual(id);
                const tempoAtual = calcularTempoAtual(id);
                const lingUpgrade = lingUpgradesData[id];
                
                const statusIcon = data.desbloqueada ? '✅' : '🔒';
                const statusClass = data.desbloqueada ? 'unlocked' : 'locked';
                const upgradeIcon = lingUpgrade && lingUpgrade.nivel > 0 ? ` ⭐${lingUpgrade.nivel}` : '';
                const upgradeDisponivel = verificarUpgradeDisponivel(id) ? ' 🔥' : '';
                const autoclickIcon = data.autoclickAtivo ? ' 🔄' : '';
                
                item.innerHTML = `
                    <span class="lang-stat-name ${statusClass}">
                        ${statusIcon} ${id.toUpperCase()}${upgradeIcon}${upgradeDisponivel}${autoclickIcon}
                    </span>
                    <span class="lang-stat-value">
                        ${data.compras} un.<br>
                        $${formatarDinheiro(recompensaAtual)}<br>
                        ${formatarTempo(tempoAtual)}s
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
        const ling = document.querySelector(`.ling[data-id="${id}"]`);
        const data = linguagensData[id];
        
        if (!ling || !data) return;
        if (!data.desbloqueada) return;
        if (intervalosAtivos[id]) return;
        
        const barra = document.getElementById(`barra-${id}`);
        const fill = barra.querySelector(".progress-fill");
        const timer = barra.querySelector(".timer-text");
        
        if (fill) {
            fill.style.transition = 'none';
            fill.style.width = "0%";
            fill.offsetHeight;
            fill.style.transition = 'width 0.45s cubic-bezier(.22,.9,.36,1)';
        }
        
        const tempoAtual = calcularTempoAtual(id);
        let restante = tempoAtual;
        
        if (timer) {
            timer.textContent = formatarTempo(restante);
        }
        
        timersInfo[id] = {
            tempoTotal: tempoAtual,
            tempoRestante: restante,
            inicio: Date.now()
        };
        
        intervalosAtivos[id] = setInterval(() => {
            restante--;
            if (restante < 0) restante = 0;
            
            const pct = ((tempoAtual - restante) / tempoAtual) * 100;
            if (fill) {
                fill.style.width = pct + "%";
            }
            
            if (timer) {
                timer.textContent = formatarTempo(restante);
            }
            
            timersInfo[id].tempoRestante = restante;
            
            if (restante <= 0) {
                clearInterval(intervalosAtivos[id]);
                delete intervalosAtivos[id];
                delete timersInfo[id];
                
                completarProducao(id);
            }
        }, 1000);
    });
});

// =======================
// COMPRA DE UPGRADES (EVENT LISTENER)
// =======================
document.addEventListener('click', (event) => {
    const btn = event.target.closest('.upgrade-btn-row');
    
    if (!btn) return;
    
    event.stopPropagation();
    
    const id = btn.dataset.id;
    const tipo = btn.dataset.tipo;
    
    if (tipo === 'linguagem') {
        comprarLingUpgrade(id);
    } else if (tipo === 'global') {
        comprarUpgrade(id);
    }
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
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 3000);
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
            if (statsTab) {
                statsTab.click();
            }
        }
    } catch (error) {
        console.error('Erro ao abrir menu:', error);
    }
}

function fecharMenu() {
    const modal = document.getElementById('menu-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function inicializarMenu() {
    try {
        const openMenuBtn = document.getElementById('open-menu');
        if (openMenuBtn) {
            openMenuBtn.addEventListener('click', abrirMenu);
        }
        
        const closeMenuBtn = document.querySelector('.close-menu');
        if (closeMenuBtn) {
            closeMenuBtn.addEventListener('click', fecharMenu);
        }
        
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('menu-modal');
            if (event.target === modal) {
                fecharMenu();
            }
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const tabContent = document.getElementById(`${tabId}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
                
                if (tabId === 'stats') {
                    atualizarEstatisticas();
                }
            });
        });
        
        const addMoneyBtn = document.getElementById('add-100k-btn');
        if (addMoneyBtn) {
            addMoneyBtn.addEventListener('click', mostrarConfirmacaoDinheiro);
        }
        
        const resetGameBtn = document.getElementById('reset-game-btn');
        if (resetGameBtn) {
            resetGameBtn.addEventListener('click', mostrarConfirmacaoReset);
        }
        
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
            
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }
            
            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    modal.style.display = 'none';
                    resetarJogo();
                    fecharMenu();
                };
            }
            
            modal.onclick = (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            };
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
            
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }
            
            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    adicionarDinheiro(100000);
                    modal.style.display = 'none';
                    atualizarEstatisticas();
                    atualizarTodosUpgrades();
                };
            }
            
            modal.onclick = (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            };
        }
    } catch (error) {
        console.error('Erro ao mostrar confirmação de dinheiro:', error);
    }
}

function adicionarDinheiro(quantia) {
    try {
        money = arredondar(money + quantia);
        totalMoneyEarned = arredondar(totalMoneyEarned + quantia);
        
        if (moneyEl) {
            moneyEl.textContent = "$" + formatarDinheiro(money);
        }
        
        const menuModal = document.getElementById('menu-modal');
        if (menuModal && menuModal.style.display === 'block') {
            atualizarEstatisticas();
        }
        
        atualizarTodosUpgrades();
        
        mostrarFeedback(`+$${formatarDinheiro(quantia)} adicionado!`, 'success');
    } catch (error) {
        console.error('Erro ao adicionar dinheiro:', error);
    }
}

function resetarJogo() {
    try {
        console.log('🔄 Iniciando reset completo do jogo...');
        
        for (const id in intervalosAtivos) {
            if (intervalosAtivos[id]) {
                clearInterval(intervalosAtivos[id]);
            }
        }
        intervalosAtivos = {};
        timersInfo = {};
        
        const upgradeAutoClick = upgradesData.autoclick;
        if (upgradeAutoClick.intervalo) {
            clearInterval(upgradeAutoClick.intervalo);
            upgradeAutoClick.intervalo = null;
        }
        
        money = 0.00;
        totalMoneyEarned = 0.00;
        
        if (moneyEl) {
            moneyEl.textContent = "$" + formatarDinheiro(money);
        }
        
        linguagensData = JSON.parse(JSON.stringify(linguagensDataTemplate));
        upgradesData = JSON.parse(JSON.stringify(upgradesDataTemplate));
        lingUpgradesData = JSON.parse(JSON.stringify(lingUpgradesDataTemplate));
        
        elementosUpgrades.clear();
        multiplicadorCompra = 1;
        
        iniciarTemporizador();
        
        inicializarInterface();
        
        for (const key in progressoAtivo) {
            progressoAtivo[key] = false;
        }
        
        document.querySelectorAll('.barra').forEach(barra => {
            const fill = barra.querySelector('.progress-fill');
            const timer = barra.querySelector('.timer-text');
            if (fill) {
                fill.style.transition = 'none';
                fill.style.width = '0%';
                fill.offsetHeight;
                fill.style.transition = 'width 0.45s cubic-bezier(.22,.9,.36,1)';
            }
            if (timer) {
                timer.textContent = '00:00';
            }
        });
        
        atualizarTodosUpgrades();
        atualizarEstatisticas();
        
        mostrarFeedback('✅ Jogo resetado com sucesso!', 'reset');
        
    } catch (error) {
        console.error('❌ Erro ao resetar jogo:', error);
        mostrarFeedback('❌ Erro ao resetar o jogo!', 'error');
    }
}

// =======================
// EVENTOS DE TECLADO
// =======================
document.addEventListener('keydown', function(event) {
    if (event.key === 'm' || event.key === 'M') {
        abrirMenu();
    }
    
    if (event.key === 'r' || event.key === 'R') {
        if (confirm('Tem certeza que deseja resetar TODO o progresso do jogo?\nIsso inclui dinheiro, linguagens, upgrades e o tempo de jogo!')) {
            resetarJogo();
        }
    }
    
    if (event.key === 'u' || event.key === 'U') {
        atualizarTodosUpgrades();
        console.log('⚡ Display dos upgrades atualizado via tecla U');
    }
    
    if (event.key === 'g' || event.key === 'G') {
        adicionarDinheiro(1000);
    }
});

// =======================
// INICIALIZAÇÃO DO JOGO
// =======================
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🎮 Iniciando I.T Adventure...');
        
        iniciarTemporizador();
        console.log('⏱️ Temporizador iniciado');
        
        inicializarInterface();
        console.log('🎨 Interface inicializada');
        
        inicializarMenu();
        console.log('📋 Menu inicializado');
        
        atualizarEstatisticas();
        console.log('📊 Estatísticas inicializadas');
        
        console.log('✅ I.T Adventure iniciado com sucesso!');
        console.log('📋 Teclas de atalho:');
        console.log('   M - Abrir Menu');
        console.log('   R - Resetar Jogo (com confirmação)');
        console.log('   U - Atualizar display dos upgrades');
        console.log('   G - Adicionar $1000 (debug)');
        console.log('🎯 NOVAS FUNCIONALIDADES:');
        console.log('   - Upgrades globais aparecem progressivamente (50% do valor)');
        console.log('   - Dinheiro necessário dentro do botão de upgrade');
        console.log('   - Multiplicador de compra desbloqueado desde o início');
        console.log('   - Interface compacta e otimizada');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar o jogo:', error);
        mostrarFeedback('❌ Erro ao carregar o jogo!', 'error');
    }
});