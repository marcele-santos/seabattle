import { FLEET, BOARD_SIZE } from "./game-engine.js";
import { getRemainingShips } from "./game-state.js";
const $=id=>document.getElementById(id),names=["Navio grande","Navio médio 1","Navio médio 2","Navio pequeno 1","Navio pequeno 2"],difficulty={easy:"Fácil",normal:"Normal",hard:"Difícil"};
let previousPhase=null,lastAnimated={player:null,computer:null};
export function render(game,handlers,stats){
 const setup=game.phase==="setup",finished=game.phase==="won"||game.phase==="lost";
 const phaseChanged=previousPhase!==null&&previousPhase!==game.phase;
 document.body.dataset.phase=game.phase;
 if(phaseChanged){document.body.classList.remove("phase-enter");void document.body.offsetWidth;document.body.classList.add("phase-enter");}
 previousPhase=game.phase;
 const animate={player:null,computer:null};
 for(const side of ["player","computer"]){const event=game.history.find(x=>x.side===side);if(event){const signature=`${event.turn}:${event.row}:${event.col}:${event.hit}:${event.shipDestroyed}`;if(lastAnimated[side]!==signature)animate[side]=event;lastAnimated[side]=signature;}}
 $("phase-label").textContent=setup?"Preparação":game.phase==="playing"?"Batalha em andamento":game.phase==="won"?"Vitória":"Derrota";
 $("screen-title").textContent=setup?"Posicione sua frota":game.phase==="playing"?"Sua vez de atacar":game.phase==="won"?"Vitória!":"Fim de jogo";
 $("screen-description").textContent=setup?"Escolha a orientação e selecione as casas do seu navio.":game.phase==="playing"?"Ataque uma casa do campo inimigo. O computador responderá em seguida.":"Partida encerrada. Confira o resultado e inicie outra batalha.";
 $("player-board-title").textContent=setup?"Sua frota":"Seu campo";$("enemy-board-title").textContent="Campo inimigo";
 $("player-caption").textContent=setup?"Posicionamento":`${getRemainingShips(game.playerShips)} navio(s) ativo(s)`;
 $("enemy-caption").textContent=setup?"Bloqueado":`${getRemainingShips(game.enemyShips)} navio(s) ativo(s)`;
 $("fleet-status").innerHTML=FLEET.map((n,i)=>`<span class="fleet-item ${i<game.nextShip?"done":i===game.nextShip&&setup?"active":""}">${names[i]} · ${n}</span>`).join("");
 draw("player-board",game.playerBoard,game,setup,false,handlers,animate.computer);draw("enemy-board",game.enemyBoard,game,false,true,handlers,animate.player);
 $("orientation").disabled=!setup;$("difficulty").disabled=!setup;$("action-button").disabled=(setup&&game.nextShip!==FLEET.length)||game.phase==="playing";
 $("action-button").textContent=setup?"Começar batalha":finished?"Jogar novamente":"Ataque pelo tabuleiro";
 $("control-title").textContent=setup?`Posicione: ${names[game.nextShip]||"frota completa"}`:"Comandos de batalha";
 $("control-help").textContent=setup?`Navio de ${FLEET[game.nextShip]??"—"} casa(s). Clique em uma casa vazia.`:`Dificuldade: ${difficulty[game.difficulty]}. Pontuação: ${game.score}. Estrelas encontradas: ${game.stars}.`;
 $("score-value").textContent=game.score;$("history-list").replaceChildren();
 if(!game.history.length){const li=document.createElement("li");li.textContent="Os ataques aparecerão aqui.";$("history-list").append(li);}
 game.history.slice(0,12).forEach(x=>{const li=document.createElement("li"),who=x.side==="player"?"Você":"Computador",out=x.hit?(x.shipDestroyed?"destruiu um navio":"acertou"):x.star?"encontrou uma estrela":"atingiu água";li.textContent=`${who}: linha ${x.row+1}, coluna ${x.col+1} — ${out}`;$("history-list").append(li);});
 $("stats-games").textContent=stats.games;$("stats-wins").textContent=stats.wins;$("stats-best").textContent=stats.bestScore;$("stats-accuracy").textContent=stats.shots?`${Math.round(stats.hits/stats.shots*100)}%`:"—";
}
function draw(id,board,game,setup,enemy,handlers,animation){
 const root=$(id);root.replaceChildren();
 const ships=enemy?game.enemyShips:game.playerShips;
 const sunkIds=new Set(ships.filter(ship=>ship.hits>=ship.length).map(ship=>ship.id));
 const event=animation, sunkId=event?.shipDestroyed?board[event.row]?.[event.col]:null;
 const isVisible=(shipId,shot)=>!enemy||sunkIds.has(shipId)||shot;
 for(let r=0;r<BOARD_SIZE;r++)for(let c=0;c<BOARD_SIZE;c++){
  const key=r*BOARD_SIZE+c,shot=enemy?game.enemyShots.has(key):game.playerShots.has(key),shipId=board[r][c],cell=document.createElement("button");cell.type="button";cell.className="cell";cell.setAttribute("aria-label",`Linha ${r+1}, coluna ${c+1}`);
  if(shipId&&isVisible(shipId,shot)){
   cell.classList.add("ship");
   const horizontal=Boolean(board[r][c-1]===shipId||board[r][c+1]===shipId),vertical=Boolean(board[r-1]?.[c]===shipId||board[r+1]?.[c]===shipId);
   const axis=horizontal?"horizontal":vertical?"vertical":"single";
   const before=horizontal?board[r][c-1]===shipId:vertical?board[r-1]?.[c]===shipId:false;
   const after=horizontal?board[r][c+1]===shipId:vertical?board[r+1]?.[c]===shipId:false;
   cell.dataset.axis=axis;cell.dataset.segment=before?(after?"middle":"end"):(after?"start":"single");
   cell.innerHTML='<svg class="ship-art" viewBox="0 0 100 100" aria-hidden="true"><path class="ship-hull" d="M 4 38 L 96 38 L 96 66 Q 50 88 4 66 Z"/><path class="ship-deck" d="M 18 45 L 82 45 M 30 56 L 70 56"/><path class="ship-cabin" d="M 39 25 L 61 25 L 68 43 L 32 43 Z"/></svg>';
   cell.setAttribute("aria-label",`${sunkIds.has(shipId)?"Navio afundado":shot?"Navio atingido":"Navio"} — linha ${r+1}, coluna ${c+1}`);
  }
  if(shot)cell.classList.add(shipId?"hit":"miss");
  if(event&&event.row===r&&event.col===c)cell.classList.add(event.hit?"impact-hit":"impact-miss");
  if(shipId&&sunkIds.has(shipId))cell.classList.add("ship-sunk");
  if(sunkId&&shipId===sunkId)cell.classList.add("ship-sunk","sink-event");
  cell.disabled=enemy?(game.phase!=="playing"||shot||handlers.isBusy):!setup;
  if(setup&&!enemy)cell.addEventListener("click",()=>handlers.place(r,c));
  if(enemy&&game.phase==="playing")cell.addEventListener("click",()=>handlers.attack(r,c));
  root.append(cell);
 }
}
