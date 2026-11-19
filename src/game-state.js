import { createBoard, createFleetBoard, createStarCells, FLEET, placeShip, resolveAttack, hasWon, BOARD_SIZE } from "./game-engine.js";

export const DIFFICULTIES = Object.freeze(["easy", "normal", "hard"]);

export function createGame(random = Math.random, difficulty = "normal") {
 const enemy = createFleetBoard(random);
 return { phase: "setup", difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : "normal", playerBoard: createBoard(), playerShips: [], enemyBoard: enemy.board, enemyShips: enemy.ships, enemyShots: new Set(), playerShots: new Set(), starCells: createStarCells(random, 5, enemy.board), stars: 0, score: 0, history: [], nextShip: 0, random };
}

export function placePlayerShip(game, row, col, orientation) {
 if (game.phase !== "setup") return { ok: false, reason: "phase" };
 const length = FLEET[game.nextShip];
 if (length === undefined) return { ok: false, reason: "complete" };
 const id = `player-ship-${game.nextShip}`;
 if (!placeShip(game.playerBoard, row, col, length, orientation, id)) return { ok: false, reason: "invalid" };
 game.playerShips.push({ id, length, hits: 0 });
 game.nextShip++;
 return { ok: true, complete: game.nextShip === FLEET.length };
}

export function autoPlacePlayerFleet(game, random = Math.random) {
 if (game.phase !== "setup") return false;
 game.playerBoard = createBoard();
 game.playerShips = [];
 game.nextShip = 0;
 for (const length of FLEET) {
  let placed = false;
  for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
   const orientation = random() < 0.5 ? "horizontal" : "vertical";
   const row = Math.floor(random() * BOARD_SIZE), col = Math.floor(random() * BOARD_SIZE);
   placed = placePlayerShip(game, row, col, orientation).ok;
  }
  if (!placed) throw new Error("Não foi possível posicionar a frota automaticamente.");
 }
 return true;
}

export function startGame(game) {
 if (game.phase !== "setup" || game.nextShip !== FLEET.length) return false;
 game.phase = "playing";
 return true;
}

function record(game, side, row, col, result) {
 game.history.unshift({ side, row, col, hit: result.hit, star: Boolean(result.star), shipDestroyed: Boolean(result.shipDestroyed), turn: game.history.length + 1 });
}

export function playerAttack(game, row, col) {
 if (game.phase !== "playing") return { ok: false, reason: "phase" };
 const result = resolveAttack(game, row, col, "enemy");
 if (!result.ok) return result;
 record(game, "player", row, col, result);
 if (result.hit) game.score += 100 + (result.shipDestroyed ? 50 : 0);
 if (result.star) game.score += 25;
 if (hasWon(game.enemyShips)) {
  game.phase = "won";
  game.score += 500;
  return { ...result, finished: true };
 }
 return { ...result, finished: false };
}

function pick(cells, random) {
 return cells[Math.min(cells.length - 1, Math.floor(random() * cells.length))];
}

function availableNeighbors(game, cells) {
 const available = [];
 for (const [row, col] of cells) {
  for (const [r, c] of [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]) {
   if (r >= 0 && c >= 0 && r < BOARD_SIZE && c < BOARD_SIZE && !game.playerShots.has(r * BOARD_SIZE + c)) available.push([r, c]);
  }
 }
 return available;
}

function targetAfterHit(game) {
 // Ignore hits from ships already destroyed; focus on the most recently damaged surviving ship.
 for (const shot of game.history) {
  if (shot.side !== "computer" || !shot.hit || shot.shipDestroyed) continue;
  const shipId = game.playerBoard[shot.row][shot.col];
  const ship = game.playerShips.find(item => item.id === shipId && item.hits < item.length);
  if (!ship) continue;

  const hits = [];
  for (const prior of game.history) {
   if (prior.side === "computer" && prior.hit && game.playerBoard[prior.row][prior.col] === shipId) hits.push([prior.row, prior.col]);
  }
  if (game.difficulty === "hard" && hits.length >= 2) {
   const rows = new Set(hits.map(([r]) => r)), cols = new Set(hits.map(([, c]) => c));
   if (rows.size === 1) {
    const row = hits[0][0], min = Math.min(...hits.map(([, c]) => c)), max = Math.max(...hits.map(([, c]) => c));
    const ends = [[row, min - 1], [row, max + 1]].filter(([r, c]) => c >= 0 && c < BOARD_SIZE && !game.playerShots.has(r * BOARD_SIZE + c));
    if (ends.length) return ends;
   }
   if (cols.size === 1) {
    const col = hits[0][1], min = Math.min(...hits.map(([r]) => r)), max = Math.max(...hits.map(([r]) => r));
    const ends = [[min - 1, col], [max + 1, col]].filter(([r, c]) => r >= 0 && r < BOARD_SIZE && !game.playerShots.has(r * BOARD_SIZE + c));
    if (ends.length) return ends;
   }
  }
  const neighbors = availableNeighbors(game, [shot.row === undefined ? [] : [shot.row, shot.col]]);
  if (neighbors.length) return neighbors;
 }
 return [];
}

function chooseTarget(game) {
 const available = [];
 for (let row = 0; row < BOARD_SIZE; row++) {
  for (let col = 0; col < BOARD_SIZE; col++) {
   if (!game.playerShots.has(row * BOARD_SIZE + col)) available.push([row, col]);
  }
 }
 if (!available.length) return null;

 if (game.difficulty !== "easy") {
  const targets = targetAfterHit(game);
  if (targets.length) return pick(targets, game.random);
 }
 if (game.difficulty === "hard") {
  // Checkerboard search guarantees at least one candidate on every straight ship of length >= 2.
  const parity = available.filter(([row, col]) => (row + col) % 2 === 0);
  if (parity.length) return pick(parity, game.random);
 }
 return pick(available, game.random);
}

export function computerAttack(game) {
 if (game.phase !== "playing") return { ok: false, reason: "phase" };
 const target = chooseTarget(game);
 if (!target) return { ok: false, reason: "exhausted" };
 const [row, col] = target, result = resolveAttack(game, row, col, "player");
 record(game, "computer", row, col, result);
 if (hasWon(game.playerShips)) game.phase = "lost";
 return { ...result, row, col, finished: game.phase === "lost" };
}

export function getRemainingShips(ships) {
 return ships.filter(ship => ship.hits < ship.length).length;
}
