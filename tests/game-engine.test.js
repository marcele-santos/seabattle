import test from "node:test";import assert from "node:assert/strict";
import {createBoard,canPlaceShip,placeShip,createFleetBoard,hasWon,resolveAttack} from "../src/game-engine.js";
import {createGame,placePlayerShip,startGame,playerAttack,computerAttack,getRemainingShips} from "../src/game-state.js";
test("tabuleiro vazio aceita posicionamento válido",()=>{const b=createBoard();assert.equal(canPlaceShip(b,0,0,3,"horizontal"),true);assert.equal(placeShip(b,0,0,3,"horizontal","a"),true);assert.equal(b[0][2],"a");});
test("impede navio fora do tabuleiro e sobreposição",()=>{const b=createBoard();assert.equal(canPlaceShip(b,7,7,2,"horizontal"),false);placeShip(b,1,1,2,"vertical","a");assert.equal(canPlaceShip(b,2,1,1,"horizontal"),false);});
test("gera frota completa sem colisões",()=>{const {board,ships}=createFleetBoard();assert.equal(ships.length,5);assert.equal(ships.reduce((s,x)=>s+x.length,0),9);assert.equal(board.flat().filter(Boolean).length,9);});
test("vitória exige destruir todos os navios",()=>{assert.equal(hasWon([{length:1,hits:1}]),true);assert.equal(hasWon([{length:2,hits:1}]),false);});
test("ataque repetido é bloqueado",()=>{const g={enemyBoard:createBoard(),playerBoard:createBoard(),enemyShots:new Set(),playerShots:new Set(),enemyShips:[{id:"s",length:1,hits:0}],playerShips:[],starCells:new Set(),stars:0};g.enemyBoard[0][0]="s";assert.equal(resolveAttack(g,0,0).hit,true);assert.equal(resolveAttack(g,0,0).reason,"repeat");});
test("estrelas ficam em casas de água",()=>{const g=createGame();assert.equal(g.starCells.size,5);for(const k of g.starCells)assert.equal(g.enemyBoard[Math.floor(k/8)][k%8],null);});
test("posicionamento completo é necessário para iniciar",()=>{const g=createGame();assert.equal(startGame(g),false);[[0,0],[2,0],[4,0],[6,0],[7,2]].forEach(([r,c])=>assert.equal(placePlayerShip(g,r,c,"horizontal").ok,true));assert.equal(startGame(g),true);});
test("computador ataca uma única casa disponível",()=>{const g=createGame();[[0,0],[2,0],[4,0],[6,0],[7,2]].forEach(([r,c])=>placePlayerShip(g,r,c,"horizontal"));startGame(g);assert.equal(computerAttack(g).ok,true);assert.equal(g.playerShots.size,1);});
test("ataque do jogador só ocorre durante batalha",()=>{assert.equal(playerAttack(createGame(),0,0).ok,false);});
test("dificuldade inválida usa normal e frota restante é calculada",()=>{assert.equal(createGame(Math.random,"x").difficulty,"normal");assert.equal(getRemainingShips([{length:2,hits:1},{length:1,hits:1}]),1);});
test("ataque registra histórico, pontos e vitória",()=>{const g=createGame();g.phase="playing";g.enemyBoard[0][0]="s";g.enemyShips=[{id:"s",length:1,hits:0}];assert.equal(playerAttack(g,0,0).hit,true);assert.equal(g.score,650);assert.equal(g.history[0].side,"player");assert.equal(g.phase,"won");});
test("computador registra ataque e não repete casas",()=>{const g=createGame(Math.random,"hard");[[0,0],[2,0],[4,0],[6,0],[7,2]].forEach(([r,c])=>placePlayerShip(g,r,c,"horizontal"));startGame(g);assert.equal(computerAttack(g).ok,true);assert.equal(g.history[0].side,"computer");assert.equal(g.playerShots.size,1);});


function prepareAiGame(difficulty, random = () => 0) {
 const game = createGame(() => 0.37, difficulty);
 game.playerBoard = createBoard();
 game.playerShips = [];
 game.enemyShots = new Set();
 game.playerShots = new Set();
 game.history = [];
 game.phase = "playing";
 game.random = random;
 return game;
}

test("fácil escolhe qualquer casa disponível sem perseguir acertos", () => {
 const g = prepareAiGame("easy");
 g.playerShots.add(0);
 g.history.unshift({side:"computer",row:0,col:0,hit:true,shipDestroyed:false});
 const result = computerAttack(g);
 assert.deepEqual([result.row,result.col],[0,1]);
});

test("normal prioriza casas adjacentes ao último navio atingido", () => {
 const g = prepareAiGame("normal");
 g.playerBoard[3][3] = "s";
 g.playerShips = [{id:"s",length:2,hits:1}];
 g.playerShots.add(27);
 g.history.unshift({side:"computer",row:3,col:3,hit:true,shipDestroyed:false});
 const result = computerAttack(g);
 assert.deepEqual([result.row,result.col],[2,3]);
});

test("difícil usa busca em xadrez quando ainda não encontrou navio", () => {
 const g = prepareAiGame("hard");
 g.playerShots.add(0);
 const result = computerAttack(g);
 assert.deepEqual([result.row,result.col],[0,2]);
 assert.equal((result.row + result.col) % 2,0);
});

test("difícil alinha o ataque pelas extremidades após dois acertos no mesmo navio", () => {
 const g = prepareAiGame("hard");
 g.playerBoard[3][2] = "s"; g.playerBoard[3][3] = "s"; g.playerBoard[3][4] = "s";
 g.playerShips = [{id:"s",length:3,hits:2}];
 g.playerShots.add(26); g.playerShots.add(27);
 g.history.unshift(
  {side:"computer",row:3,col:3,hit:true,shipDestroyed:false},
  {side:"computer",row:3,col:2,hit:true,shipDestroyed:false}
 );
 const result = computerAttack(g);
 assert.deepEqual([result.row,result.col],[3,4]);
});

test("normal abandona a perseguição quando o navio anterior foi destruído", () => {
 const g = prepareAiGame("normal");
 g.playerBoard[3][3] = "s";
 g.playerShips = [{id:"s",length:1,hits:1}];
 g.playerShots.add(27);
 g.history.unshift({side:"computer",row:3,col:3,hit:true,shipDestroyed:true});
 const result = computerAttack(g);
 assert.deepEqual([result.row,result.col],[0,0]);
});
