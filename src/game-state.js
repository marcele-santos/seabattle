import { createBoard, createFleetBoard, createStarCells, FLEET, placeShip, resolveAttack, hasWon, BOARD_SIZE } from "./game-engine.js";
export const DIFFICULTIES = Object.freeze(["easy", "normal", "hard"]);
export function createGame(random = Math.random, difficulty = "normal") {
 const enemy=createFleetBoard(random);
 return {phase:"setup",difficulty:DIFFICULTIES.includes(difficulty)?difficulty:"normal",playerBoard:createBoard(),playerShips:[],enemyBoard:enemy.board,enemyShips:enemy.ships,enemyShots:new Set(),playerShots:new Set(),starCells:createStarCells(random,5,enemy.board),stars:0,score:0,history:[],nextShip:0,random};
}
export function placePlayerShip(game,row,col,orientation) {
 if(game.phase!=="setup") return {ok:false,reason:"phase"};
 const length=FLEET[game.nextShip]; if(length===undefined)return {ok:false,reason:"complete"};
 const id=`player-ship-${game.nextShip}`; if(!placeShip(game.playerBoard,row,col,length,orientation,id))return {ok:false,reason:"invalid"};
 game.playerShips.push({id,length,hits:0});game.nextShip++;return {ok:true,complete:game.nextShip===FLEET.length};
}
export function autoPlacePlayerFleet(game,random=Math.random){
 if(game.phase!=="setup")return false;
 game.playerBoard=createBoard();game.playerShips=[];game.nextShip=0;
 for(const length of FLEET){
  let placed=false;
  for(let attempt=0;attempt<1000&&!placed;attempt++){
   const orientation=random()<.5?"horizontal":"vertical";
   const row=Math.floor(random()*BOARD_SIZE),col=Math.floor(random()*BOARD_SIZE);
   placed=placePlayerShip(game,row,col,orientation).ok;
  }
  if(!placed)throw new Error("Não foi possível posicionar a frota automaticamente.");
 }
 return true;
}
export function startGame(game){if(game.phase!=="setup"||game.nextShip!==FLEET.length)return false;game.phase="playing";return true;}
function record(game,side,row,col,result){game.history.unshift({side,row,col,hit:result.hit,star:Boolean(result.star),shipDestroyed:Boolean(result.shipDestroyed),turn:game.history.length+1});}
export function playerAttack(game,row,col){
 if(game.phase!=="playing")return {ok:false,reason:"phase"};
 const result=resolveAttack(game,row,col,"enemy");if(!result.ok)return result;record(game,"player",row,col,result);
 if(result.hit)game.score+=100+(result.shipDestroyed?50:0);if(result.star)game.score+=25;
 if(hasWon(game.enemyShips)){game.phase="won";game.score+=500;return {...result,finished:true};}
 return {...result,finished:false};
}
function chooseTarget(game){
 const available=[];for(let r=0;r<BOARD_SIZE;r++)for(let c=0;c<BOARD_SIZE;c++)if(!game.playerShots.has(r*BOARD_SIZE+c))available.push([r,c]);
 if(!available.length)return null;
 if(game.difficulty!=="easy"){
  const last=game.history.find(x=>x.side==="computer"&&x.hit&&!x.shipDestroyed);
  if(last){const adjacent=[[last.row-1,last.col],[last.row+1,last.col],[last.row,last.col-1],[last.row,last.col+1]].filter(([r,c])=>r>=0&&c>=0&&r<BOARD_SIZE&&c<BOARD_SIZE&&!game.playerShots.has(r*BOARD_SIZE+c));if(adjacent.length)return adjacent[Math.floor(game.random()*adjacent.length)];}
 }
 if(game.difficulty==="hard"){const parity=available.filter(([r,c])=>(r+c)%2===0);if(parity.length)return parity[Math.floor(game.random()*parity.length)];}
 return available[Math.floor(game.random()*available.length)];
}
export function computerAttack(game){
 if(game.phase!=="playing")return {ok:false,reason:"phase"};const target=chooseTarget(game);if(!target)return {ok:false,reason:"exhausted"};
 const [row,col]=target,result=resolveAttack(game,row,col,"player");record(game,"computer",row,col,result);
 if(hasWon(game.playerShips))game.phase="lost";return {...result,row,col,finished:game.phase==="lost"};
}
export function getRemainingShips(ships){return ships.filter(s=>s.hits<s.length).length;}
