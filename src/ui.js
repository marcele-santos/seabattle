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
 const visibleShips=ships.filter(ship=>!enemy||sunkIds.has(ship.id)).map(ship=>{
  const cells=[];for(let r=0;r<BOARD_SIZE;r++)for(let c=0;c<BOARD_SIZE;c++)if(board[r][c]===ship.id)cells.push({r,c});
  return {...ship,cells};
 });
 for(let r=0;r<BOARD_SIZE;r++)for(let c=0;c<BOARD_SIZE;c++){
  const key=r*BOARD_SIZE+c,shot=enemy?game.enemyShots.has(key):game.playerShots.has(key),shipId=board[r][c],cell=document.createElement("button");cell.type="button";cell.className="cell";cell.setAttribute("aria-label",`Linha ${r+1}, coluna ${c+1}`);
  if(shipId&&(!enemy||sunkIds.has(shipId)))cell.classList.add("ship-cell");
  if(shot)cell.classList.add(shipId?"hit":"miss");
  if(event&&event.row===r&&event.col===c)cell.classList.add(event.hit?"impact-hit":"impact-miss");
  if(shipId&&sunkIds.has(shipId))cell.classList.add("ship-sunk");
  if(sunkId&&shipId===sunkId)cell.classList.add("sink-event");
  if(shipId&&(!enemy||sunkIds.has(shipId)))cell.setAttribute("aria-label",`${sunkIds.has(shipId)?"Navio afundado":shot?"Navio atingido":"Navio"} — linha ${r+1}, coluna ${c+1}`);
  cell.disabled=enemy?(game.phase!=="playing"||shot||handlers.isBusy):!setup;
  if(setup&&!enemy)cell.addEventListener("click",()=>handlers.place(r,c));
  if(enemy&&game.phase==="playing")cell.addEventListener("click",()=>handlers.attack(r,c));
  root.append(cell);
 }
 if(visibleShips.length){
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("class","fleet-art");svg.setAttribute("viewBox","0 0 840 840");svg.setAttribute("preserveAspectRatio","none");svg.setAttribute("aria-hidden","true");
  for(const ship of visibleShips){
   const rows=ship.cells.map(x=>x.r),cols=ship.cells.map(x=>x.c),vertical=rows.length>1&&new Set(cols).size===1;
   const first=vertical?Math.min(...rows):Math.min(...cols),fixed=vertical?cols[0]:rows[0],last=first+ship.length-1;
   const x1=vertical?fixed*105+52.5:first*105+4,x2=vertical?fixed*105+96:(last+1)*105-4;
   const y1=vertical?first*105+4:fixed*105+4,y2=vertical?(last+1)*105-4:fixed*105+96;
   const d=vertical?`M ${x1-23} ${y1} L ${x1+23} ${y1} L ${x1+23} ${y2-25} Q ${x1} ${y2+2} ${x1-23} ${y2-25} Z`:`M ${x1} ${y1+23} L ${x1+25} ${y1} L ${x2-25} ${y1} Q ${x2+2} ${y1+48} ${x2-25} ${y1+96} L ${x1+25} ${y1+96} Q ${x1-2} ${y1+48} ${x1} ${y1+23} Z`;
   const path=document.createElementNS(svg.namespaceURI,"path");path.setAttribute("d",d);path.setAttribute("class",`fleet-hull ${sunkIds.has(ship.id)?"sunk":""}`);svg.append(path);
   const mid=vertical?{x:fixed*105+52.5,y:(y1+y2)/2}:{x:(x1+x2)/2,y:fixed*105+52.5};
   const cabin=document.createElementNS(svg.namespaceURI,"path");
   const cd=vertical?`M ${mid.x-15} ${mid.y-18} L ${mid.x+15} ${mid.y-18} L ${mid.x+19} ${mid.y+17} L ${mid.x-19} ${mid.y+17} Z`:`M ${mid.x-18} ${mid.y-19} L ${mid.x+18} ${mid.y-19} L ${mid.x+24} ${mid.y+17} L ${mid.x-24} ${mid.y+17} Z`;
   cabin.setAttribute("d",cd);cabin.setAttribute("class","fleet-cabin");svg.append(cabin);
   const deck=document.createElementNS(svg.namespaceURI,"path");deck.setAttribute("class","fleet-deck");deck.setAttribute("d",vertical?`M ${mid.x-9} ${mid.y+25} L ${mid.x+9} ${mid.y+25}`:`M ${mid.x-22} ${mid.y+27} L ${mid.x+22} ${mid.y+27}`);svg.append(deck);
   if(sunkIds.has(ship.id)){const damage=document.createElementNS(svg.namespaceURI,"path");damage.setAttribute("class","fleet-damage");damage.setAttribute("d",vertical?`M ${mid.x-17} ${mid.y-4} l 12 12 m -12 0 l 12 -12`:`M ${mid.x-17} ${mid.y-4} l 12 12 m -12 0 l 12 -12`);svg.append(damage);}
  }
  root.append(svg);
 }
}
