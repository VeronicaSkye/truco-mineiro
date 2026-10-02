/**
 * Truco Mineiro — Motor do Jogo
 * Regras: Manilhas Fixas (Zap 4♣, Copeta 7♥, Espadilha A♠, Pica-fumo 7♦)
 * Pontuações: 2 -> 4 -> 8 -> 12 tentos
 * IA: Tião "Gato de Botas"
 */

// ============================================================================
// 1. Áudio Sintetizado (Web Audio API - Sem dependências externas)
// ============================================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('truco_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playCardSlide() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playCardSlam() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playTrucoHorn() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [220, 277, 330, 440];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.4);
    });
  }

  playPointBell() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [261, 329, 392, 523];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + idx * 0.12 + 0.45);
    });
  }

  playDefeat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [392, 369, 349, 329];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.15);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.15 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.15);
      osc.stop(this.ctx.currentTime + idx * 0.15 + 0.4);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('truco_muted', this.muted);
    return this.muted;
  }
}

const sounds = new SoundEffects();

// ============================================================================
// 2. Baralho do Truco Mineiro & Manilhas Fixas
// ============================================================================
const SUITS = [
  { name: 'paus', symbol: '♣', color: 'paus' },
  { name: 'copas', symbol: '♥', color: 'copas' },
  { name: 'espadas', symbol: '♠', color: 'espadas' },
  { name: 'ouros', symbol: '♦', color: 'ouros' }
];

const RANKS = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

/**
 * Retorna o valor de força (peso) no Truco Mineiro
 * Manilhas Fixas:
 * 4♣ (Zap) = 100
 * 7♥ (Copeta) = 90
 * A♠ (Espadilha) = 80
 * 7♦ (Pica-fumo) = 70
 */
function getCardPower(rank, suit) {
  // Manilhas Fixas
  if (rank === '4' && suit === 'paus') return { power: 100, isManilha: true, nickname: 'Zap (Gato)' };
  if (rank === '7' && suit === 'copas') return { power: 90, isManilha: true, nickname: 'Copeta' };
  if (rank === 'A' && suit === 'espadas') return { power: 80, isManilha: true, nickname: 'Espadilha' };
  if (rank === '7' && suit === 'ouros') return { power: 70, isManilha: true, nickname: 'Pica-fumo' };

  // Demais cartas
  switch (rank) {
    case '3': return { power: 60, isManilha: false };
    case '2': return { power: 50, isManilha: false };
    case 'A': return { power: 40, isManilha: false }; // A de Paus, Copas, Ouros
    case 'K': return { power: 30, isManilha: false };
    case 'J': return { power: 20, isManilha: false };
    case 'Q': return { power: 10, isManilha: false };
    case '7': return { power: 7, isManilha: false }; // 7 de Paus e Espadas
    case '6': return { power: 6, isManilha: false };
    case '5': return { power: 5, isManilha: false };
    case '4': return { power: 4, isManilha: false }; // 4 de Copas, Espadas, Ouros
    default: return { power: 0, isManilha: false };
  }
}

function createDeck() {
  const deck = [];
  for (const suitObj of SUITS) {
    for (const rank of RANKS) {
      const details = getCardPower(rank, suitObj.name);
      deck.push({
        id: `${rank}-${suitObj.name}`,
        rank,
        suit: suitObj.name,
        suitSymbol: suitObj.symbol,
        colorClass: `suit-${suitObj.color}`,
        power: details.power,
        isManilha: details.isManilha,
        nickname: details.nickname || null
      });
    }
  }
  return deck;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================================================
// 3. Estado do Jogo
// ============================================================================
class TrucoGame {
  constructor() {
    this.maxScore = 12;
    this.playerScore = 0;
    this.botScore = 0;

    // Valores do Truco Mineiro clássico: 2 -> 4 -> 8 -> 12 tentos
    this.stakeLevels = [2, 4, 8, 12];
    this.currentStakeIndex = 0;

    this.playerHand = [];
    this.botHand = [];

    this.currentRound = 1; // 1, 2 ou 3
    this.roundWinners = []; // 'player', 'bot', 'draw'

    this.playerPlayedCard = null;
    this.botPlayedCard = null;

    this.turn = 'player'; // 'player' ou 'bot'
    this.handStarter = 'player'; // Alterna quem começa a cada mão

    this.trucoState = null; // null, 'player_called', 'bot_called'
    this.trucoChallenger = null;

    this.isEncobertaActive = false;
    this.isProcessing = false;

    this.tiaoPhrases = {
      start: [
        "Uai sô! Pode cortá o baralho que eu já tô com as manilha tudo na mão!",
        "Vamo vê se ocê sabe jogar truco mineiro mesmo ou se é só prosa!",
        "Mão nova, sorte nova! Embaralha direito esse trem aí!"
      ],
      playLow: [
        "Joguei só pra amansar...",
        "Essa aqui é só de enfeite!",
        "Deixo essa passar, o que vale é a surpresa!"
      ],
      playHigh: [
        "Segura essa aí se ocê der conta!",
        "Aqui tem café no bule!",
        "Toma lá, dá cá!"
      ],
      playManilha: [
        "BUM! Olha a manilha no peito!",
        "Tava guardadinha esperando ocê se assanhar!",
        "Chora não que o Zap é meu!"
      ],
      callTruco: [
        "TRUUUUCO, MARRECO! Cai que eu quero ver!",
        "Tô mandando é TRUCO! Aguenta a pressão aí!",
        "TRUCO! Acabou a moleza, compadre!"
      ],
      acceptTruco: [
        "CAIO DE CABEÇA! Vem com tudo!",
        "Aceito e ainda dou risada! Bota na mesa!",
        "Pode vim que eu não corro de cara feia não!"
      ],
      foldTruco: [
        "Num dou conta não... dessa vez ocê me pegou. Corri!",
        "Vou deixar ocê levar esses dois pontinho... o golpe vem depois!",
        "Corro mesmo, sou mineiro mas não sou bobo!"
      ],
      winRound: [
        "Falei que o ponto era meu!",
        "Quem tem manilha não passa fome!",
        "Menos conversa e mais jogo!"
      ],
      loseRound: [
        "Ocê deu sorte nessa, mas o jogo não acabou!",
        "Eta nós... o homi tá afiado hoje!",
        "Deixei ocê levar pra criar coragem!"
      ]
    };
  }

  startNewGame() {
    this.playerScore = 0;
    this.botScore = 0;
    this.handStarter = 'player';
    this.updateScoreboard();
    this.startNewHand();
    this.log("🎮 Nova partida iniciada! O primeiro a fazer 12 pontos é o campeão.", "system");
  }

  startNewHand() {
    this.currentStakeIndex = 0;
    this.currentRound = 1;
    this.roundWinners = [];
    this.playerPlayedCard = null;
    this.botPlayedCard = null;
    this.trucoState = null;
    this.trucoChallenger = null;
    this.isEncobertaActive = false;
    this.isProcessing = false;

    // Distribuir cartas
    const deck = shuffle(createDeck());
    this.playerHand = deck.slice(0, 3);
    this.botHand = deck.slice(3, 6);

    // Alternar quem começa
    this.turn = this.handStarter;
    this.handStarter = this.handStarter === 'player' ? 'bot' : 'player';

    this.renderHands();
    this.clearDuelSlots();
    this.updateStakeUI();
    this.updateRoundsTracker();
    this.updateTurnUI();

    // Habilitar / desabilitar checkbox encoberta (proibida na 1ª rodada)
    const chkEncoberta = document.getElementById('chk-encoberta');
    if (chkEncoberta) {
      chkEncoberta.checked = false;
      chkEncoberta.disabled = true;
    }

    this.tiaoSay(this.getRandomPhrase(this.tiaoPhrases.start));

    // Se o bot for quem começa
    if (this.turn === 'bot') {
      setTimeout(() => this.botTurn(), 1000);
    }
  }

  // ==========================================================================
  // Jogadas & Rodadas
  // ==========================================================================
  playCard(index, isEncoberta = false) {
    if (this.turn !== 'player' || this.isProcessing) return;

    if (isEncoberta && this.currentRound === 1) {
      alert("No Truco Mineiro, carta encoberta só é permitida na 2ª ou 3ª rodada!");
      return;
    }

    const card = this.playerHand.splice(index, 1)[0];
    card.isEncoberta = isEncoberta;
    this.playerPlayedCard = card;

    sounds.playCardSlam();
    this.renderHands();
    this.renderPlayedCard('player', card);

    const cardDesc = isEncoberta ? "🙈 Carta Encoberta (Virada)" : `${card.rank}${card.suitSymbol}${card.isManilha ? ` (${card.nickname})` : ''}`;
    this.log(`Você jogou: <strong>${cardDesc}</strong>`, "player");

    // Desmarcar toggle de encoberta
    const chkEncoberta = document.getElementById('chk-encoberta');
    if (chkEncoberta) chkEncoberta.checked = false;

    // Se o Bot já tiver jogado a carta dele nesta rodada, avalia
    if (this.botPlayedCard) {
      this.evaluateRound();
    } else {
      // Passa a vez para o bot
      this.turn = 'bot';
      this.updateTurnUI();
      setTimeout(() => this.botTurn(), 1000);
    }
  }

  botTurn() {
    if (this.isProcessing) return;

    // Verificar se o Bot quer pedir Truco antes de jogar!
    if (!this.trucoState && this.botDecideTruco()) {
      this.botCallTruco();
      return;
    }

    // Bot escolhe qual carta jogar
    const cardIndex = this.botChooseCardToPlay();
    const card = this.botHand.splice(cardIndex, 1)[0];

    // O bot pode esconder carta na 2ª ou 3ª rodada se for fraca e estiver blefando
    const botHides = (this.currentRound > 1 && card.power <= 7 && Math.random() < 0.25);
    card.isEncoberta = botHides;
    this.botPlayedCard = card;

    sounds.playCardSlam();
    this.renderHands();
    this.renderPlayedCard('bot', card);

    // Fala do Tião
    if (card.isManilha) {
      this.tiaoSay(this.getRandomPhrase(this.tiaoPhrases.playManilha));
    } else if (card.power >= 50) {
      this.tiaoSay(this.getRandomPhrase(this.tiaoPhrases.playHigh));
    } else {
      this.tiaoSay(this.getRandomPhrase(this.tiaoPhrases.playLow));
    }

    const cardDesc = botHides ? "🙈 Carta Encoberta" : `${card.rank}${card.suitSymbol}${card.isManilha ? ` (${card.nickname})` : ''}`;
    this.log(`Tião jogou: <strong>${cardDesc}</strong>`, "bot");

    // Se o jogador já jogou a carta dele, avalia a rodada
    if (this.playerPlayedCard) {
      this.evaluateRound();
    } else {
      // Vez do jogador
      this.turn = 'player';
      this.updateTurnUI();
    }
  }

  botChooseCardToPlay() {
    // Se o jogador já jogou
    if (this.playerPlayedCard) {
      const playerEffectivePower = this.playerPlayedCard.isEncoberta ? 0 : this.playerPlayedCard.power;

      // Cartas que vencem o jogador
      const winningCards = this.botHand
        .map((c, idx) => ({ ...c, originalIdx: idx }))
        .filter(c => c.power > playerEffectivePower)
        .sort((a, b) => a.power - b.power); // Pega a MENOR que ainda vence

      if (winningCards.length > 0) {
        return winningCards[0].originalIdx;
      }

      // Se não tem carta que vence, joga a carta mais fraca para queimar
      const sortedByWeakest = this.botHand
        .map((c, idx) => ({ ...c, originalIdx: idx }))
        .sort((a, b) => a.power - b.power);

      return sortedByWeakest[0].originalIdx;
    }

    // Se o bot joga primeiro:
    // Na 1ª rodada joga intermediária ou forte para garantir
    if (this.currentRound === 1) {
      const sorted = this.botHand
        .map((c, idx) => ({ ...c, originalIdx: idx }))
        .sort((a, b) => a.power - b.power);
      // Se tiver mais de 1 carta, joga a do meio ou menor
      return sorted.length >= 2 ? sorted[1].originalIdx : sorted[0].originalIdx;
    }

    // Na 2ª ou 3ª rodada, joga a mais forte
    const sortedDesc = this.botHand
      .map((c, idx) => ({ ...c, originalIdx: idx }))
      .sort((a, b) => b.power - a.power);
    return sortedDesc[0].originalIdx;
  }

  evaluateRound() {
    this.isProcessing = true;
    const playerPower = this.playerPlayedCard.isEncoberta ? 0 : this.playerPlayedCard.power;
    const botPower = this.botPlayedCard.isEncoberta ? 0 : this.botPlayedCard.power;

    let roundWinner = null;
    if (playerPower > botPower) {
      roundWinner = 'player';
    } else if (botPower > playerPower) {
      roundWinner = 'bot';
    } else {
      roundWinner = 'draw'; // Canga / empate
    }

    this.roundWinners.push(roundWinner);
    this.updateRoundsTracker();

    let feedbackMsg = "";
    if (roundWinner === 'player') {
      feedbackMsg = "🎉 Você fez a rodada!";
      sounds.playPointBell();
    } else if (roundWinner === 'bot') {
      feedbackMsg = "🤠 Tião fez a rodada!";
    } else {
      feedbackMsg = "🤝 CANGOU! Empate na rodada!";
    }

    const feedbackEl = document.getElementById('round-feedback');
    if (feedbackEl) feedbackEl.textContent = feedbackMsg;

    // Verificar se a mão terminou
    setTimeout(() => {
      const handWinner = this.checkHandWinner();
      if (handWinner) {
        this.finishHand(handWinner);
      } else {
        // Próxima rodada
        this.currentRound++;
        this.playerPlayedCard = null;
        this.botPlayedCard = null;
        this.clearDuelSlots();

        // O vencedor da rodada anterior começa a próxima. Se empatou, quem começou a mão continua.
        if (roundWinner === 'player') {
          this.turn = 'player';
        } else if (roundWinner === 'bot') {
          this.turn = 'bot';
        }

        // Habilitar carta encoberta a partir da 2ª rodada
        const chkEncoberta = document.getElementById('chk-encoberta');
        if (chkEncoberta) chkEncoberta.disabled = false;

        this.isProcessing = false;
        this.updateTurnUI();

        if (this.turn === 'bot') {
          setTimeout(() => this.botTurn(), 1000);
        }
      }
    }, 1600);
  }

  /**
   * Regras clássicas de desempate do Truco Mineiro:
   * Melhor de 3.
   * Empate na 1ª: quem levar a 2ª ganha a mão.
   * Empate na 2ª: quem levou a 1ª ganha a mão.
   * Empate na 1ª e na 2ª: quem levar a 3ª ganha.
   * Empate nas 3: ninguém pontua.
   */
  checkHandWinner() {
    const rw = this.roundWinners;
    const playerWins = rw.filter(w => w === 'player').length;
    const botWins = rw.filter(w => w === 'bot').length;

    // Se alguém ganhou 2 rodadas
    if (playerWins === 2) return 'player';
    if (botWins === 2) return 'bot';

    // Regras de Canga (Empates):
    // Se a 1ª rodada empatou
    if (rw[0] === 'draw') {
      if (rw.length >= 2 && rw[1] !== 'draw') {
        return rw[1]; // Vencedor da 2ª leva
      }
      if (rw.length === 3) {
        if (rw[2] !== 'draw') return rw[2];
        return 'no_points'; // Todas empataram
      }
    }

    // Se a 1ª teve vencedor e a 2ª empatou
    if (rw.length === 2 && rw[1] === 'draw' && rw[0] !== 'draw') {
      return rw[0]; // Vencedor da 1ª leva a mão!
    }

    // Se a 1ª foi de um, a 2ª do outro, e a 3ª empatou
    if (rw.length === 3 && rw[2] === 'draw') {
      return rw[0]; // Vence quem fez a primeira rodada
    }

    // Se completou 3 rodadas normais
    if (rw.length === 3) {
      if (playerWins > botWins) return 'player';
      if (botWins > playerWins) return 'bot';
      return 'no_points';
    }

    return null; // A mão continua
  }

  finishHand(winner) {
    const stakePoints = this.stakeLevels[this.currentStakeIndex];

    if (winner === 'player') {
      this.playerScore += stakePoints;
      this.tiaoSay(this.getRandomPhrase(this.tiaoPhrases.loseRound));
      this.log(`🏆 <strong>Você venceu a mão e ganhou ${stakePoints} tentos!</strong>`, "player");
      sounds.playVictory();
    } else if (winner === 'bot') {
      this.botScore += stakePoints;
      this.tiaoSay(this.getRandomPhrase(this.tiaoPhrases.winRound));
      this.log(`💀 <strong>Tião venceu a mão e faturou ${stakePoints} tentos!</strong>`, "bot");
      sounds.playDefeat();
    } else {
      this.log("🤝 Todas as rodadas cangaram! Ninguém pontuou nessa mão.", "system");
    }

    this.updateScoreboard();

    // Checar fim de jogo
    if (this.playerScore >= this.maxScore || this.botScore >= this.maxScore) {
      setTimeout(() => this.showEndGameModal(), 1200);
    } else {
      setTimeout(() => this.startNewHand(), 2000);
    }
  }

  // ==========================================================================
  // Sistema de Truco (Truco Mineiro: 2 -> 4 -> 8 -> 12)
  // ==========================================================================
  playerCallTruco() {
    if (this.trucoState || this.isProcessing) return;

    this.trucoState = 'player_called';
    this.trucoChallenger = 'player';
    const nextStake = this.stakeLevels[this.currentStakeIndex + 1] || 12;

    this.triggerScreenShake();
    sounds.playTrucoHorn();
    this.showTrucoBanner("TRUUUUCO!", `Você pediu ${nextStake} pontos!`);
    this.log(`💥 Você gritou <strong>TRUCO! (${nextStake} tentos)</strong>`, "truco");

    // Resposta da IA do Tião
    this.isProcessing = true;
    setTimeout(() => {
      this.botRespondToTruco();
    }, 1800);
  }

  botDecideTruco() {
    // Tião avalia sua mão
    const maxPower = Math.max(...this.botHand.map(c => c.power));
    const hasZapOrCopeta = this.botHand.some(c => c.power >= 90);
    const hasHighCard = maxPower >= 60; // 3 ou manilha

    // Se estiver perdendo ou no 2º round com carta forte
    if (hasZapOrCopeta && Math.random() < 0.75) return true;
    if (hasHighCard && this.currentRound === 2 && Math.random() < 0.5) return true;
    
    // Pequeno blefe inteligente (10% de chance)
    if (Math.random() < 0.1) return true;

    return false;
  }

  botCallTruco() {
    this.trucoState = 'bot_called';
    this.trucoChallenger = 'bot';
    const nextStake = this.stakeLevels[this.currentStakeIndex + 1] || 12;

    this.triggerScreenShake();
    sounds.playTrucoHorn();
    this.showTrucoBanner("TRUUUUCO!", `Tião tá pedindo ${nextStake} pontos!`);
    this.tiaoSay(this.getRandomPhrase(this.tiaoPhrases.callTruco));
    this.log(`💥 Tião gritou <strong>TRUCO! (${nextStake} tentos)</strong>`, "truco");

    // Exibir opções para o jogador responder (Cair, Correr, Aumentar)
    this.showPlayerChallengeUI(nextStake);
  }

  botRespondToTruco() {
    const nextStake = this.stakeLevels[this.currentStakeIndex + 1] || 12;
    const maxPower = Math.max(...this.botHand.map(c => c.power));
    const totalPower = this.botHand.reduce((acc, c) => acc + c.power, 0);

    // Tião aceita se tiver manilha ou se tiver carta boa
    const accepts = maxPower >= 60 || totalPower >= 90 || Math.random() < 0.2;

    if (accepts) {
      this.currentStakeIndex++;
      this.updateStakeUI();
      this.tiaoSay(this.getRandomPhrase(this.tiaoPhrases.acceptTruco));
      this.log(`✅ Tião aceitou o Truco! A mão agora vale <strong>${this.stakeLevels[this.currentStakeIndex]} tentos</strong>!`, "bot");
      sounds.playPointBell();
    } else {
      // Tião corre
      this.tiaoSay(this.getRandomPhrase(this.tiaoPhrases.foldTruco));
      const pointsWon = this.stakeLevels[this.currentStakeIndex];
      this.playerScore += pointsWon;
      this.updateScoreboard();
      this.log(`🏃 Tião amarelou e correu! Você ganhou <strong>${pointsWon} tentos</strong> sem precisar jogar tudo.`, "player");
      sounds.playVictory();

      if (this.playerScore >= this.maxScore) {
        setTimeout(() => this.showEndGameModal(), 1200);
      } else {
        setTimeout(() => this.startNewHand(), 1800);
      }
      return;
    }

    this.trucoState = null;
    this.isProcessing = false;
    this.updateTurnUI();
  }

  // Jogador responde ao desafio do Bot
  playerAcceptsChallenge() {
    this.hidePlayerChallengeUI();
    this.currentStakeIndex++;
    this.updateStakeUI();
    sounds.playPointBell();
    this.log(`✅ Você aceitou o Truco do Tião! Mão valendo <strong>${this.stakeLevels[this.currentStakeIndex]} tentos</strong>!`, "player");
    this.trucoState = null;
    this.isProcessing = false;
    this.updateTurnUI();
  }

  playerFoldsChallenge() {
    this.hidePlayerChallengeUI();
    const pointsWon = this.stakeLevels[this.currentStakeIndex];
    this.botScore += pointsWon;
    this.updateScoreboard();
    sounds.playDefeat();
    this.log(`🏃 Você correu do Truco! Tião faturou <strong>${pointsWon} tentos</strong>.`, "bot");

    if (this.botScore >= this.maxScore) {
      setTimeout(() => this.showEndGameModal(), 1200);
    } else {
      setTimeout(() => this.startNewHand(), 1800);
    }
  }

  playerRaisesChallenge() {
    this.hidePlayerChallengeUI();
    if (this.currentStakeIndex + 2 < this.stakeLevels.length) {
      this.currentStakeIndex++;
      const nextStake = this.stakeLevels[this.currentStakeIndex + 1];
      this.triggerScreenShake();
      sounds.playTrucoHorn();
      this.showTrucoBanner("SEIS!", `Você aumentou para ${nextStake} pontos!`);
      this.log(`🔥 Você retrucou e pediu <strong>${nextStake} TENTOS</strong>!`, "truco");

      this.isProcessing = true;
      setTimeout(() => this.botRespondToTruco(), 1600);
    } else {
      this.playerAcceptsChallenge();
    }
  }

  // ==========================================================================
  // Renderização e Atualização da Interface
  // ==========================================================================
  renderHands() {
    // Mão do Jogador
    const playerContainer = document.getElementById('player-hand');
    if (playerContainer) {
      playerContainer.innerHTML = '';
      this.playerHand.forEach((card, idx) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.isManilha ? 'is-manilha' : ''}`;
        cardEl.setAttribute('id', `player-card-${idx}`);
        cardEl.innerHTML = `
          <div class="card-top ${card.colorClass}">
            <span>${card.rank}</span>
            <span>${card.suitSymbol}</span>
          </div>
          <div class="card-center ${card.colorClass}">
            ${card.suitSymbol}
          </div>
          <div class="card-bottom ${card.colorClass}">
            <span>${card.rank}</span>
            <span>${card.suitSymbol}</span>
          </div>
        `;

        cardEl.addEventListener('click', () => {
          const chkEncoberta = document.getElementById('chk-encoberta');
          const isEncoberta = chkEncoberta ? chkEncoberta.checked : false;
          this.playCard(idx, isEncoberta);
        });

        playerContainer.appendChild(cardEl);
      });
    }

    // Mão do Bot (verso das cartas)
    const botContainer = document.getElementById('bot-hand');
    if (botContainer) {
      botContainer.innerHTML = '';
      this.botHand.forEach((_, idx) => {
        const cardBack = document.createElement('div');
        cardBack.className = 'card card-back';
        cardBack.setAttribute('id', `bot-card-${idx}`);
        botContainer.appendChild(cardBack);
      });
    }
  }

  renderPlayedCard(target, card) {
    const slotId = target === 'player' ? 'player-played-slot' : 'bot-played-slot';
    const slotEl = document.getElementById(slotId);
    if (!slotEl) return;

    slotEl.innerHTML = '';
    const cardEl = document.createElement('div');

    if (card.isEncoberta) {
      cardEl.className = 'card card-encoberta';
      cardEl.innerHTML = `
        <div class="card-center">🙈</div>
      `;
    } else {
      cardEl.className = `card ${card.isManilha ? 'is-manilha' : ''}`;
      cardEl.innerHTML = `
        <div class="card-top ${card.colorClass}">
          <span>${card.rank}</span>
          <span>${card.suitSymbol}</span>
        </div>
        <div class="card-center ${card.colorClass}">
          ${card.suitSymbol}
        </div>
        <div class="card-bottom ${card.colorClass}">
          <span>${card.rank}</span>
          <span>${card.suitSymbol}</span>
        </div>
      `;
    }

    slotEl.appendChild(cardEl);
  }

  clearDuelSlots() {
    const botSlot = document.getElementById('bot-played-slot');
    const playerSlot = document.getElementById('player-played-slot');
    if (botSlot) botSlot.innerHTML = '<span class="slot-placeholder">Carta do Tião</span>';
    if (playerSlot) playerSlot.innerHTML = '<span class="slot-placeholder">Sua Carta</span>';
    const feedbackEl = document.getElementById('round-feedback');
    if (feedbackEl) feedbackEl.textContent = `Rodada ${this.currentRound} de 3`;
  }

  updateScoreboard() {
    const pScoreEl = document.getElementById('player-score');
    const bScoreEl = document.getElementById('bot-score');
    if (pScoreEl) pScoreEl.textContent = this.playerScore;
    if (bScoreEl) bScoreEl.textContent = this.botScore;

    // Renderizar feijões decorativos
    this.renderFeijoes('player-feijoes', this.playerScore);
    this.renderFeijoes('bot-feijoes', this.botScore);
  }

  renderFeijoes(elementId, count) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    const total = Math.min(count, 12);
    for (let i = 0; i < total; i++) {
      const feijao = document.createElement('span');
      feijao.className = 'feijao';
      container.appendChild(feijao);
    }
  }

  updateStakeUI() {
    const currentPoints = this.stakeLevels[this.currentStakeIndex];
    const stakeEl = document.getElementById('stake-text');
    const badgeEl = document.getElementById('stake-badge');
    const trucoBtn = document.getElementById('btn-truco');

    if (stakeEl) {
      stakeEl.textContent = currentPoints === 2 ? 'Mão Normal: Vale 2 tentos' : `🔥 TRUCO! Vale ${currentPoints} tentos!`;
    }

    if (badgeEl) {
      if (currentPoints > 2) {
        badgeEl.classList.add('truco-active');
      } else {
        badgeEl.classList.remove('truco-active');
      }
    }

    if (trucoBtn) {
      const nextPoints = this.stakeLevels[this.currentStakeIndex + 1];
      if (nextPoints) {
        trucoBtn.textContent = `💥 TRUCO! (${nextPoints} pts)`;
        trucoBtn.disabled = this.trucoState !== null || this.isProcessing;
      } else {
        trucoBtn.textContent = 'Mão no Máximo (12 pts)';
        trucoBtn.disabled = true;
      }
    }
  }

  updateRoundsTracker() {
    for (let i = 1; i <= 3; i++) {
      const slot = document.getElementById(`round-slot-${i}`);
      if (!slot) continue;

      slot.className = 'round-slot';
      const icon = slot.querySelector('.round-result-icon');

      const result = this.roundWinners[i - 1];
      if (result === 'player') {
        slot.classList.add('won-player');
        if (icon) icon.textContent = '✓ Você';
      } else if (result === 'bot') {
        slot.classList.add('won-bot');
        if (icon) icon.textContent = '✗ Tião';
      } else if (result === 'draw') {
        slot.classList.add('draw');
        if (icon) icon.textContent = '🤝 Canga';
      } else {
        if (icon) icon.textContent = '-';
      }
    }
  }

  updateTurnUI() {
    const turnEl = document.getElementById('turn-indicator');
    const botDot = document.getElementById('bot-status-dot');

    if (turnEl) {
      if (this.turn === 'player') {
        turnEl.textContent = 'Sua vez de jogar';
        turnEl.style.color = '#81c784';
      } else {
        turnEl.textContent = 'Tião está pensando...';
        turnEl.style.color = '#ffd54f';
      }
    }

    if (botDot) {
      if (this.turn === 'bot') {
        botDot.classList.add('thinking');
      } else {
        botDot.classList.remove('thinking');
      }
    }
  }

  showPlayerChallengeUI(stake) {
    const normalPanel = document.getElementById('normal-actions');
    const challengePanel = document.getElementById('challenge-actions');
    const alertEl = document.getElementById('challenge-alert');
    const btnRaise = document.getElementById('btn-raise');

    if (normalPanel) normalPanel.style.display = 'none';
    if (challengePanel) challengePanel.style.display = 'flex';
    if (alertEl) alertEl.innerHTML = `🤠 Tião gritou <strong>TRUCO</strong> (${stake} tentos)! O que ocê faz?`;

    const nextStake = this.stakeLevels[this.currentStakeIndex + 2];
    if (btnRaise) {
      if (nextStake) {
        btnRaise.style.display = 'inline-block';
        btnRaise.textContent = `🔥 PEDIR ${nextStake}!`;
      } else {
        btnRaise.style.display = 'none';
      }
    }
  }

  hidePlayerChallengeUI() {
    const normalPanel = document.getElementById('normal-actions');
    const challengePanel = document.getElementById('challenge-actions');
    if (normalPanel) normalPanel.style.display = 'flex';
    if (challengePanel) challengePanel.style.display = 'none';
  }

  showTrucoBanner(title, subtitle) {
    const banner = document.getElementById('truco-banner');
    const titleEl = document.getElementById('truco-banner-title');
    const subEl = document.getElementById('truco-banner-subtitle');

    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;

    if (banner) {
      banner.classList.add('active');
      setTimeout(() => {
        banner.classList.remove('active');
      }, 1400);
    }
  }

  triggerScreenShake() {
    const wrapper = document.getElementById('screen-shake-wrapper');
    if (!wrapper) return;
    wrapper.classList.remove('shake');
    void wrapper.offsetWidth; // Forçar reflow
    wrapper.classList.add('shake');
  }

  tiaoSay(text) {
    const speechEl = document.getElementById('bot-speech');
    if (speechEl) {
      speechEl.style.opacity = '0';
      speechEl.style.transform = 'translateY(4px)';
      setTimeout(() => {
        speechEl.textContent = text;
        speechEl.style.opacity = '1';
        speechEl.style.transform = 'translateY(0)';
      }, 200);
    }
  }

  log(message, type = 'system') {
    const stream = document.getElementById('log-stream');
    if (!stream) return;
    const entry = document.createElement('p');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = message;
    stream.prepend(entry);
  }

  showEndGameModal() {
    const modal = document.getElementById('endgame-modal');
    const icon = document.getElementById('endgame-icon');
    const title = document.getElementById('endgame-title');
    const msg = document.getElementById('endgame-message');
    const finalPlayer = document.getElementById('final-player-score');
    const finalBot = document.getElementById('final-bot-score');

    if (finalPlayer) finalPlayer.textContent = this.playerScore;
    if (finalBot) finalBot.textContent = this.botScore;

    if (this.playerScore >= this.maxScore) {
      if (icon) icon.textContent = '🏆';
      if (title) title.textContent = 'Vitória Mineira!';
      if (msg) msg.textContent = 'Parabéns! Você mandou o Tião de volta pra roça com 12 tentos!';
      sounds.playVictory();
    } else {
      if (icon) icon.textContent = '🤠';
      if (title) title.textContent = 'Tião Ganhou o Jogo!';
      if (msg) msg.textContent = '"Uai sô, quem sabe um dia ocê aprende a trucar com quem entende!"';
      sounds.playDefeat();
    }

    if (modal) modal.style.display = 'flex';
  }

  getRandomPhrase(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// ============================================================================
// 4. Inicialização de Eventos do DOM
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const game = new TrucoGame();

  // Botões principais
  const btnTruco = document.getElementById('btn-truco');
  if (btnTruco) {
    btnTruco.addEventListener('click', () => game.playerCallTruco());
  }

  const btnAccept = document.getElementById('btn-accept');
  if (btnAccept) {
    btnAccept.addEventListener('click', () => game.playerAcceptsChallenge());
  }

  const btnFold = document.getElementById('btn-fold');
  if (btnFold) {
    btnFold.addEventListener('click', () => game.playerFoldsChallenge());
  }

  const btnRaise = document.getElementById('btn-raise');
  if (btnRaise) {
    btnRaise.addEventListener('click', () => game.playerRaisesChallenge());
  }

  const btnRestart = document.getElementById('btn-restart');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      if (confirm('Deseja reiniciar a partida do zero?')) {
        game.startNewGame();
      }
    });
  }

  const btnPlayAgain = document.getElementById('btn-play-again');
  if (btnPlayAgain) {
    btnPlayAgain.addEventListener('click', () => {
      const modal = document.getElementById('endgame-modal');
      if (modal) modal.style.display = 'none';
      game.startNewGame();
    });
  }

  // Modais de Regras
  const btnRules = document.getElementById('btn-rules');
  const rulesModal = document.getElementById('rules-modal');
  const btnCloseRules = document.getElementById('btn-close-rules');
  const btnUnderstood = document.getElementById('btn-understood-rules');

  if (btnRules && rulesModal) {
    btnRules.addEventListener('click', () => rulesModal.style.display = 'flex');
  }

  [btnCloseRules, btnUnderstood].forEach(btn => {
    if (btn && rulesModal) {
      btn.addEventListener('click', () => rulesModal.style.display = 'none');
    }
  });

  // Controle de Som
  const btnSound = document.getElementById('btn-sound');
  const soundIcon = document.getElementById('sound-icon');
  if (btnSound && soundIcon) {
    soundIcon.textContent = sounds.muted ? '🔇' : '🔊';
    btnSound.addEventListener('click', () => {
      const isMuted = sounds.toggleMute();
      soundIcon.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  // Iniciar partida
  game.startNewGame();
});
