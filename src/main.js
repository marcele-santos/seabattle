import { createGame, placePlayerShip, startGame, playerAttack, computerAttack } from "./game-state.js";
import { render } from "./ui.js";

let game = createGame();
const $ = id => document.getElementById(id);

function message(text) { $("feedback").textContent = text; }

function refresh() {
  render(game, { place, attack });
}

function place(row, col) {
  const result = placePlayerShip(game, row, col, $("orientation").value);
  if (!result.ok) return message("Posição inválida. Escolha outra casa ou orientação.");
  message(result.complete ? "Frota posicionada. Inicie a batalha." : "Navio posicionado.");
  refresh();
}

function attack(row, col) {
  const result = playerAttack(game, row, col);
  if (!result.ok) return;
  if (result.hit) message(result.shipDestroyed ? "Navio inimigo destruído!" : "Acertou um navio!");
  else message(result.star ? "Água, mas você encontrou uma estrela bônus!" : "Água. O computador vai responder.");
  if (result.finished) {
    message("Vitória! Você destruiu toda a frota inimiga.");
    refresh();
    return;
  }
  const reply = computerAttack(game);
  if (reply.ok && reply.hit) message("O computador acertou um dos seus navios.");
  else if (reply.ok) message("O computador errou o ataque.");
  if (game.phase === "lost") message("Derrota. O computador destruiu sua frota.");
  refresh();
}

$("action-button").addEventListener("click", () => {
  if (game.phase === "setup") {
    if (!startGame(game)) return;
    message("Batalha iniciada. Escolha uma casa no campo inimigo.");
  } else if (game.phase === "won" || game.phase === "lost") {
    game = createGame();
  } else {
    return;
    message("Nova partida iniciada. Posicione sua frota.");
  }
  refresh();
});
$("reset-button").addEventListener("click", () => {
  game = createGame();
  message("Partida reiniciada. Posicione sua frota.");
  refresh();
});
$("orientation").addEventListener("change", () => message(`Orientação: ${$("orientation").value === "horizontal" ? "horizontal" : "vertical"}.`));
refresh();
