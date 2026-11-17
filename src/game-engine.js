export const BOARD_SIZE = 8;
export const FLEET = Object.freeze([3, 2, 2, 1, 1]);

export function createBoard(size = BOARD_SIZE) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function canPlaceShip(board, row, col, length, orientation) {
  const size = board.length;
  if (!Number.isInteger(row) || !Number.isInteger(col) || !Number.isInteger(length) || length < 1) return false;
  for (let i = 0; i < length; i++) {
    const r = row + (orientation === "vertical" ? i : 0);
    const c = col + (orientation === "horizontal" ? i : 0);
    if (r < 0 || c < 0 || r >= size || c >= size || board[r][c] !== null) return false;
  }
  return orientation === "horizontal" || orientation === "vertical";
}

export function placeShip(board, row, col, length, orientation, shipId) {
  if (!canPlaceShip(board, row, col, length, orientation)) return false;
  for (let i = 0; i < length; i++) {
    const r = row + (orientation === "vertical" ? i : 0);
    const c = col + (orientation === "horizontal" ? i : 0);
    board[r][c] = shipId;
  }
  return true;
}

export function createFleetBoard(random = Math.random) {
  const board = createBoard();
  const ships = [];
  FLEET.forEach((length, index) => {
    let placed = false;
    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const orientation = random() < 0.5 ? "horizontal" : "vertical";
      const row = Math.floor(random() * BOARD_SIZE);
      const col = Math.floor(random() * BOARD_SIZE);
      const id = `ship-${index}`;
      if (canPlaceShip(board, row, col, length, orientation)) {
        placeShip(board, row, col, length, orientation, id);
        ships.push({ id, length, hits: 0 });
        placed = true;
      }
    }
    if (!placed) throw new Error("Não foi possível posicionar a frota.");
  });
  return { board, ships };
}

export function createStarCells(random = Math.random, count = 5) {
  const cells = new Set();
  while (cells.size < count) {
    const row = Math.floor(random() * BOARD_SIZE);
    const col = Math.floor(random() * BOARD_SIZE);
    cells.add(row * BOARD_SIZE + col);
  }
  return cells;
}

export function resolveAttack(game, row, col, target = "enemy") {
  const board = target === "enemy" ? game.enemyBoard : game.playerBoard;
  const key = row * BOARD_SIZE + col;
  const shots = target === "enemy" ? game.enemyShots : game.playerShots;
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) {
    return { ok: false, reason: "invalid" };
  }
  if (shots.has(key)) return { ok: false, reason: "repeat" };
  shots.add(key);
  const shipId = board[row][col];
  if (!shipId) {
    const star = target === "enemy" && game.starCells.has(key);
    if (star) game.stars += 1;
    return { ok: true, hit: false, star, shipDestroyed: false };
  }
  const ships = target === "enemy" ? game.enemyShips : game.playerShips;
  const ship = ships.find(item => item.id === shipId);
  ship.hits += 1;
  return { ok: true, hit: true, star: false, shipDestroyed: ship.hits === ship.length };
}

export function hasWon(ships) {
  return ships.every(ship => ship.hits >= ship.length);
}
