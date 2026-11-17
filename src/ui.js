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
   const first=vertical?Math.min(...rows):Math.min(...cols),fixed=vertical?cols[0]:rows[0];
   const centerX=vertical?fixed*105+52.5:(first+ship.length/2)*105;
   const centerY=vertical?(first+ship.length/2)*105:fixed*105+52.5;
   const halfLength=(ship.length*105-18)/2,halfBeam=27;
   const x0=centerX-halfLength,x1=centerX+halfLength,cy=centerY;
   const group=document.createElementNS(svg.namespaceURI,"g");
   if(vertical)group.setAttribute("transform",`rotate(90 ${centerX} ${centerY})`);
   group.setAttribute("class",`fleet-vessel ${sunkIds.has(ship.id)?"sunk":""} ${ship.id===sunkId?"sink-event":""}`);
   const hull=document.createElementNS(svg.namespaceURI,"path");
   hull.setAttribute("class","fleet-hull");
   hull.setAttribute("d",`M ${x0+13} ${cy-halfBeam} Q ${x0} ${cy-halfBeam} ${x0} ${cy-12} L ${x0} ${cy+12} Q ${x0} ${cy+halfBeam} ${x0+13} ${cy+halfBeam} L ${x1-27} ${cy+halfBeam} Q ${x1+2} ${cy+halfBeam} ${x1} ${cy} Q ${x1+2} ${cy-halfBeam} ${x1-27} ${cy-halfBeam} Z`);
   group.append(hull);
   const deck=document.createElementNS(svg.namespaceURI,"path");
   deck.setAttribute("class","fleet-deck");
   deck.setAttribute("d",`M ${x0+15} ${cy} L ${x1-30} ${cy}`);
   group.append(deck);
   const cabinCenter=x0+(x1-x0)*.57;
   const cabin=document.createElementNS(svg.namespaceURI,"rect");
   cabin.setAttribute("x",cabinCenter-12);cabin.setAttribute("y",cy-18);
   cabin.setAttribute("width","25");cabin.setAttribute("height","36");cabin.setAttribute("rx","5");
   cabin.setAttribute("class","fleet-cabin");group.append(cabin);
   const bridge=document.createElementNS(svg.namespaceURI,"rect");
   bridge.setAttribute("x",cabinCenter-6);bridge.setAttribute("y",cy-11);
   bridge.setAttribute("width","13");bridge.setAttribute("height","22");bridge.setAttribute("rx","2");
   bridge.setAttribute("class","fleet-bridge");group.append(bridge);
   const stern=document.createElementNS(svg.namespaceURI,"path");
   stern.setAttribute("class","fleet-detail");
   stern.setAttribute("d",`M ${x0+14} ${cy-15} L ${x0+14} ${cy+15} M ${x0+23} ${cy-20} L ${x0+23} ${cy+20}`);
   group.append(stern);
   if(sunkIds.has(ship.id)){
    const damage=document.createElementNS(svg.namespaceURI,"path");
    damage.setAttribute("class","fleet-damage");
    damage.setAttribute("d",`M ${cabinCenter-10} ${cy-8} l 20 16 m -20 0 l 20 -16`);
    group.append(damage);
   }
   svg.append(group);
  }
  root.append(svg);
 }
}
