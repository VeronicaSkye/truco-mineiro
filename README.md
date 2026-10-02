# 🃏 Truco Mineiro — Web Edition

> Autêntico jogo de **Truco Mineiro** com manilhas fixas, IA com personalidade, efeitos sonoros sintetizados via Web Audio API e interface visual imersiva estilo mesa de feltro. Construído com tecnologias web puras (**HTML5, CSS3 e JavaScript Vanilla**).

🎮 **[Jogar Online Agora (GitHub Pages)](https://veronicaskye.github.io/truco-mineiro/)**

---

## 🌟 Demonstração & Destaques Visuais

- **Mesa de Feltro de Luxo**: Efeito de tecido verde com iluminação radial, relevo em madeira nobre e marcadores tradicionais de tentos (feijões).
- **As 4 Manilhas Fixas do Truco Mineiro**:
  - ⚡ **Zap / Gato** (`4 de Paus`) — *A mais forte do baralho!*
  - 👑 **Copeta** (`7 de Copas`) — *Segunda maior*
  - 🗡️ **Espadilha** (`Ás de Espadas`) — *Terceira maior*
  - 🍂 **Pica-fumo / Moleque** (`7 de Ouros`) — *Quarta maior*
- **Adversário Inteligente ("Tião")**: IA com lógica heurística que sabe blefar, esconder cartas, aceitar desafios arriscados e soltar frases típicas da cultura mineira.
- **Efeitos de Impacto**:
  - Grito de **TRUUUCO!** com tela trêmula (*screen shake*), banner animado e corneta dramática.
  - Carta encoberta (jogar virada na 2ª e 3ª rodada).
  - Áudio 100% nativo sintetizado pelo navegador (sem carregar nenhum arquivo MP3 externo).

---

## 📐 Regras do Truco Mineiro Implementadas

1. **Partida até 12 Tentos**: O primeiro a somar 12 pontos vence o jogo.
2. **Escala de Pontuação Tradicional**:
   - Mão Simples: **2 tentos**
   - Truco: **4 tentos**
   - Seis / Retruco: **8 tentos**
   - Doze: **12 tentos** (define a partida)
3. **Ordem de Força das Cartas**:
   $$\text{Zap (4♣)} > \text{Copeta (7♥)} > \text{Espadilha (A♠)} > \text{Pica-fumo (7♦)}$$
   $$\text{3} > \text{2} > \text{Áses (Copas, Paus, Ouros)} > \text{K (Reis)} > \text{J (Valetes)} > \text{Q (Damas)} > \text{7 (Paus, Espadas)} > \text{6} > \text{5} > \text{4}$$
4. **Regras de Canga (Empate)**:
   - Empate na 1ª rodada: quem vencer a 2ª leva a mão.
   - Empate na 2ª rodada: quem venceu a 1ª leva a mão.
   - Empate em todas as 3: ninguém pontua, mão descartada.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico**: Estrutura acessível com metatags para SEO e OpenGraph.
- **CSS3 Moderno**:
  - Flexbox e CSS Grid para layout responsivo.
  - Variáveis CSS (Custom Properties) para Design System e temas de cores.
  - Animações fluidas de cartas e efeitos de *Screen Shake*.
- **JavaScript ES6+ (Vanilla)**:
  - Programação Orientada a Objetos com classes (`TrucoGame`, `SoundEffects`).
  - Web Audio API para síntese sonora pura em tempo real.
  - Gerenciamento de estado de jogo determinístico (máquina de estados).
  - Persistência com `localStorage` (preferência de áudio).

---

## 🚀 Como Executar Localmente

Não necessita de nenhuma instalação pesada ou `npm install`!

1. Clone o repositório:
   ```bash
   git clone https://github.com/VeronicaSkye/truco-mineiro.git
   cd truco-mineiro
   ```

2. Abra o arquivo `index.html` em qualquer navegador:
   - Clique duas vezes no `index.html`, ou
   - Use uma extensão como o *Live Server* do VS Code / Antigravity IDE.

---

## 🎯 Por que este projeto é relevante para um Estudante de Engenharia de Software?

1. **Arquitetura de Estado Limpa**: Implementação de uma máquina de estados finitos que controla turnos, rodadas, valores de aposta e regras de desempate sem bibliotecas externas.
2. **Algoritmo de Tomada de Decisão (IA Heurística)**: O bot avalia probabilidade de vitória, blefe e valor das cartas na mão para decidir se aceita, corre ou trucá.
3. **Engenharia de Som Nativa**: Uso avançado da Web Audio API (`OscillatorNode` e `GainNode`) dispensando ativos externos e otimizando performance de carregamento a zero latência.
4. **Design Orientado a Experiência do Usuário (UX/UI)**: Micro-animações e feedback visual instantâneo para engajamento do jogador.

---

## 💡 Próximos Passos (Roadmap de Evolução)

- [ ] **Multiplayer Online**: Adicionar backend em Node.js com WebSockets (Socket.io) para jogar com amigos em tempo real.
- [ ] **Testes Unitários**: Testar a lógica de comparação de manilhas e regras de canga com Vitest ou Jest.
- [ ] **PWA (Progressive Web App)**: Permitir instalar no celular Android e iOS como um app nativo offline.
- [ ] **Modo 2x2 (Duplas)**: Suporte a 4 jogadores na mesa.

---

Desenvolvido com 💚 e paixão por engenharia de software e jogos brasileiros.
