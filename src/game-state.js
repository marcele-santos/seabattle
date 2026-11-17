import { createBoard, createFleetBoard, createStarCells, FLEET, placeShip, resolveAttack, hasWon } from "./game-engine.js";

export function createGame(random = Math.random) {
  const enemy = createFleetBoard(random);
  return {
    phase: "setup",
    playerBoard: createBoard(),
    playerShips: [],
    enemyBoard: enemy.board,
    enemyShips: enemy.ships,
    enemyShots: new Set(),
    playerShots: new Set(),
    starCells: createStarCells(random, 5, enemy.board),
    stars: 0,
    nextShip: 0,
    random
  };
}

export function placePlayerShip(game, row, col, orientation) {
  if (game.phase !== "setup") return { ok: false, reason: "phase" };
  const length = FLEET[game.nextShip];
  if (length === undefined) return { ok: false, reason: "complete" };
  const id = `player-ship-${game.nextShip}`;
  if (!placeShip(game.playerBoard, row, col, length, orientation, id)) return { ok: false, reason: "invalid" };
  game.playerShips.push({ id, length, hits: 0 });
  game.nextShip += 1;
  return { ok: true, complete: game.nextShip === FLEET.length };
}

export function startGame(game) {
  if (game.phase !== "setup" || game.nextShip !== FLEET.length) return false;
  game.phase = "playing";
  return true;
}

export function playerAttack(game, row, col) {
  if (game.phase !== "playing") return { ok: false, reason: "phase" };
  const result = resolveAttack(game, row, col, "enemy");
  if (!result.ok) return result;
  if (hasWon(game.enemyShips)) {
    game.phase = "won";
    return { ...result, finished: true };
  }
  return { ...result, finished: false };
}

export function computerAttack(game) {
  if (game.phase !== "playing") return { ok: false, reason: "phase" };
  const available = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (!game.playerShots.has(r * 8 + c)) available.push([r, c]);
  if (!available.length) return { ok: false, reason: "exhausted" };
  const [row, col] = available[Math.floor(game.random() * available.length)];
  const result = resolveAttack(game, row, col, "player");
  if (hasWon(game.playerShips)) game.phase = "lost";
  return { ...result, row, col, finished: game.phase === "lost" };
}
