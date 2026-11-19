const SIZE = 8;
const FLEET = [3, 2, 2, 1, 1];

export function seededRandom(seed) {
  let state = Number(seed) >>> 0;
  return function random() {
    let value = state += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function canPlace(board, row, col, length, vertical) {
  for (let i = 0; i < length; i++) {
    const r = row + (vertical ? i : 0), c = col + (vertical ? 0 : i);
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE || board[r][c] !== null) return false;
  }
  return true;
}

function createFleet(random) {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  const ships = [];
  FLEET.forEach((length, index) => {
    let placed = false;
    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const vertical = random() >= 0.5;
      const row = Math.floor(random() * SIZE), col = Math.floor(random() * SIZE);
      if (!canPlace(board, row, col, length, vertical)) continue;
      for (let i = 0; i < length; i++) board[row + (vertical ? i : 0)][col + (vertical ? 0 : i)] = index;
      ships.push({ length, hits: 0 });
      placed = true;
    }
    if (!placed) throw new Error("fleet_generation_failed");
  });
  return { board, ships };
}

function createStars(random, board) {
  const candidates = Array.from({ length: SIZE * SIZE }, (_, key) => key)
    .filter(key => board[Math.floor(key / SIZE)][key % SIZE] === null);
  const stars = new Set();
  for (let i = 0; i < Math.min(5, candidates.length); i++) {
    const offset = Math.min(candidates.length - i - 1, Math.floor(random() * (candidates.length - i)));
    const selected = i + Math.max(0, offset);
    [candidates[i], candidates[selected]] = [candidates[selected], candidates[i]];
    stars.add(candidates[i]);
  }
  return stars;
}

export function verifyReplay(seed, shots) {
  if (!Array.isArray(shots) || shots.length < 9 || shots.length > 64) throw new Error("invalid_shot_count");
  const random = seededRandom(seed);
  const { board, ships } = createFleet(random);
  const stars = createStars(random, board);
  const seen = new Set();
  let score = 0, hits = 0, starsFound = 0;
  for (let shotIndex = 0; shotIndex < shots.length; shotIndex++) {
    const shot = shots[shotIndex];
    const { row, col } = shot || {};
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= SIZE || col >= SIZE) {
      throw new Error("invalid_shot_coordinate");
    }
    const key = row * SIZE + col;
    if (seen.has(key)) throw new Error("duplicate_shot");
    seen.add(key);
    const shipId = board[row][col];
    if (shipId !== null) {
      const ship = ships[shipId];
      ship.hits++;
      hits++;
      score += 100;
      if (ship.hits === ship.length) score += 50;
    } else if (stars.has(key)) {
      starsFound++;
      score += 25;
    }
  }
  if (!ships.every(ship => ship.hits === ship.length)) throw new Error("fleet_not_destroyed");
  score += 500;
  return { score, shots: shots.length, hits, stars: starsFound };
}
