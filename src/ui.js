import { FLEET, BOARD_SIZE } from "./game-engine.js";

const $ = id => document.getElementById(id);
const fleetNames = ["Navio grande", "Navio médio 1", "Navio médio 2", "Navio pequeno 1", "Navio pequeno 2"];

export function render(game, handlers) {
  const setup = game.phase === "setup";
  $("phase-label").textContent = setup ? "Preparação" : game.phase === "playing" ? "Batalha em andamento" : game.phase === "won" ? "Vitória" : "Derrota";
  $("screen-title").textContent = setup ? "Posicione sua frota" : game.phase === "playing" ? "Sua vez de atacar" : game.phase === "won" ? "Vitória!" : "Fim de jogo";
  $("screen-description").textContent = setup ? "Escolha a orientação e selecione as casas do seu navio." : game.phase === "playing" ? "Ataque uma casa do campo inimigo. Depois, o computador responderá." : "A partida terminou. Reinicie para jogar novamente.";
  $("player-board-title").textContent = setup ? "Sua frota" : "Seu campo";
  $("enemy-board-title").textContent = "Campo inimigo";
  $("player-caption").textContent = setup ? "Posicionamento" : "Seu tabuleiro";
  $("enemy-caption").textContent = setup ? "Bloqueado" : "Ataque aqui";
  $("fleet-status").innerHTML = FLEET.map((length, i) => {
    const cls = i < game.nextShip ? "done" : i === game.nextShip && setup ? "active" : "";
    return `<span class="fleet-item ${cls}">${fleetNames[i]} · ${length}</span>`;
  }).join("");
  drawBoard("player-board", game.playerBoard, game, setup, false, handlers);
  drawBoard("enemy-board", game.enemyBoard, game, false, true, handlers);
  $("orientation").disabled = !setup;
  $("action-button").disabled = (setup && game.nextShip !== FLEET.length) || game.phase === "playing";
  $("action-button").textContent = setup ? "Começar batalha" : game.phase === "playing" ? "Ataque pelo tabuleiro" : "Jogar novamente";
  $("reset-button").textContent = "Reiniciar";
  $("control-title").textContent = setup ? `Posicione: ${fleetNames[game.nextShip] || "frota completa"}` : "Comandos de batalha";
  $("control-help").textContent = setup ? `Navio de ${FLEET[game.nextShip] ?? "—"} casa(s). Clique em uma casa vazia para posicionar.` : `Estrelas bônus: ${game.stars}. Cada estrela aparece em uma casa de água do campo inimigo.`;
}

function drawBoard(id, board, game, setup, enemy, handlers) {
  const root = $(id);
  root.replaceChildren();
  for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
    const key = r * BOARD_SIZE + c;
    const shot = enemy ? game.playerShots.has(key) : game.enemyShots.has(key);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.setAttribute("aria-label", `Linha ${r + 1}, coluna ${c + 1}`);
    if (board[r][c] && !enemy) cell.classList.add("ship");
    if (shot) cell.classList.add(board[r][c] ? "hit" : "miss");
    if (enemy && game.starCells.has(key) && !shot && game.phase !== "setup") cell.classList.add("star");
    if (enemy && game.phase === "setup") cell.disabled = true;
    else if (enemy) cell.disabled = game.phase !== "playing" || shot;
    else cell.disabled = !setup;
    if (setup && !enemy) cell.addEventListener("click", () => handlers.place(r, c));
    if (enemy && game.phase === "playing") cell.addEventListener("click", () => handlers.attack(r, c));
    root.append(cell);
  }
}
