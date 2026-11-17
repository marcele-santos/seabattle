import test from "node:test";
import assert from "node:assert/strict";
import { createBoard, canPlaceShip, placeShip, createFleetBoard, hasWon, resolveAttack } from "../src/game-engine.js";
import { createGame, placePlayerShip, startGame, playerAttack, computerAttack } from "../src/game-state.js";

test("tabuleiro começa vazio e aceita posicionamento válido", () => {
  const board = createBoard();
  assert.equal(canPlaceShip(board, 0, 0, 3, "horizontal"), true);
  assert.equal(placeShip(board, 0, 0, 3, "horizontal", "a"), true);
  assert.equal(board[0][2], "a");
});

test("impede navio fora do tabuleiro e sobreposição", () => {
  const board = createBoard();
  assert.equal(canPlaceShip(board, 7, 7, 2, "horizontal"), false);
  placeShip(board, 1, 1, 2, "vertical", "a");
  assert.equal(canPlaceShip(board, 2, 1, 1, "horizontal"), false);
});

test("gera frota completa sem colisões", () => {
  const { board, ships } = createFleetBoard();
  assert.equal(ships.length, 5);
  assert.equal(ships.reduce((sum, ship) => sum + ship.length, 0), 9);
  assert.equal(board.flat().filter(Boolean).length, 9);
});

test("vitória só ocorre quando todos os navios são destruídos", () => {
  assert.equal(hasWon([{ length: 1, hits: 1 }]), true);
  assert.equal(hasWon([{ length: 2, hits: 1 }]), false);
});

test("ataque não pode ser repetido e registra acerto", () => {
  const game = { enemyBoard: createBoard(), playerBoard: createBoard(), enemyShots: new Set(), playerShots: new Set(), enemyShips: [{ id: "s", length: 1, hits: 0 }], playerShips: [], starCells: new Set(), stars: 0 };
  game.enemyBoard[0][0] = "s";
  assert.equal(resolveAttack(game, 0, 0).hit, true);
  assert.equal(resolveAttack(game, 0, 0).reason, "repeat");
});

test("fluxo da partida exige posicionar a frota antes de iniciar", () => {
  const game = createGame();
  assert.equal(startGame(game), false);
  const placements = [[0,0],[2,0],[4,0],[6,0],[7,2]];
  placements.forEach(([r,c], i) => assert.equal(placePlayerShip(game, r, c, "horizontal").ok, true, `ship ${i}`));
  assert.equal(startGame(game), true);
  assert.equal(game.phase, "playing");
});

test("computador ataca uma casa ainda não atingida", () => {
  const game = createGame();
  [[0,0],[2,0],[4,0],[6,0],[7,2]].forEach(([r,c]) => placePlayerShip(game, r, c, "horizontal"));
  startGame(game);
  const result = computerAttack(game);
  assert.equal(result.ok, true);
  assert.equal(game.enemyShots.size, 1);
});

test("ataque do jogador é aceito somente durante a batalha", () => {
  const game = createGame();
  assert.equal(playerAttack(game, 0, 0).ok, false);
});
