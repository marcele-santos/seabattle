import test from "node:test";
import assert from "node:assert/strict";
import { verifyReplay, seededRandom } from "../supabase/functions/_shared/game-verifier.js";

function generateWinningShots(seed) {
  const random = seededRandom(seed), board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const fleet = [3, 2, 2, 1, 1];
  fleet.forEach((length, index) => {
    let placed = false;
    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const vertical = random() >= 0.5, row = Math.floor(random() * 8), col = Math.floor(random() * 8);
      const cells = Array.from({ length }, (_, i) => [row + (vertical ? i : 0), col + (vertical ? 0 : i)]);
      if (cells.some(([r,c]) => r < 0 || c < 0 || r >= 8 || c >= 8 || board[r][c] !== null)) continue;
      cells.forEach(([r,c]) => board[r][c] = index);
      placed = true;
    }
    assert.equal(placed, true);
  });
  return board.flatMap((line, row) => line.flatMap((ship, col) => ship === null ? [] : [{ row, col }]));
}

test("valida uma sequência vencedora e calcula a pontuação no servidor", () => {
  const shots = generateWinningShots(123456789);
  const result = verifyReplay(123456789, shots);
  assert.equal(result.hits, 9);
  assert.equal(result.shots, 9);
  assert.ok(result.score >= 1400);
});

test("rejeita uma partida incompleta", () => {
  assert.throws(() => verifyReplay(123, [{ row: 0, col: 0 }]), /invalid_shot_count/);
});

test("rejeita coordenadas fora do tabuleiro", () => {
  const shots = Array.from({ length: 5 }, (_, i) => ({ row: i === 0 ? 8 : 0, col: i }));
  assert.throws(() => verifyReplay(123, shots), /invalid_shot_coordinate/);
});

test("rejeita tiros duplicados", () => {
  const shots = Array.from({ length: 5 }, () => ({ row: 0, col: 0 }));
  assert.throws(() => verifyReplay(123, shots), /duplicate_shot/);
});
