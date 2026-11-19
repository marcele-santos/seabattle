import { FLEET, BOARD_SIZE } from "./game-engine.js";
import { getRemainingShips } from "./game-state.js";
const $=id=>document.getElementById(id),names=["Navio grande","Navio médio 1","Navio médio 2","Navio pequeno 1","Navio pequeno 2"],difficulty={easy:"Fácil",normal:"Normal",hard:"Difícil"};
let previousPhase=null,lastAnimated={player:null,computer:null},previousPlayerShips=new Set(),previousScore=null;
export function render(game,handlers,stats){
 const setup=game.phase==="setup",finished=game.phase==="won"||game.phase==="lost";
 const phaseChanged=previousPhase!==null&&previousPhase!==game.phase;
 if(setup&&previousPhase!=="setup")lastAnimated={player:null,computer:null};
 document.body.dataset.phase=game.phase;
 if(phaseChanged){document.body.classList.remove("phase-enter");void document.body.offsetWidth;document.body.classList.add("phase-enter");}
 previousPhase=game.phase;
 if(setup&&game.nextShip===0)previousPlayerShips=new Set();
 const animate={player:null,computer:null};
 for(const side of ["player","computer"]){const event=game.history.find(x=>x.side===side);if(event){const signature=`${event.turn}:${event.row}:${event.col}:${event.hit}:${event.star}:${event.shipDestroyed}`;if(lastAnimated[side]!==signature)animate[side]=event;lastAnimated[side]=signature;}}
 $("phase-label").textContent=setup?"Preparação":game.phase==="playing"?"Batalha em andamento":game.phase==="won"?"Vitória":"Derrota";
 $("screen-title").textContent=setup?"Posicione sua frota":game.phase==="playing"?"Sua vez de atacar":game.phase==="won"?"Vitória!":"Fim de jogo";
 $("screen-description").textContent=setup?"Escolha a orientação e selecione as casas do seu navio.":game.phase==="playing"?"Ataque uma casa do campo inimigo. O computador responderá em seguida.":"Partida encerrada. Confira o resultado e inicie outra batalha.";
 $("player-board-title").textContent=setup?"Sua frota":"Seu campo";$("enemy-board-title").textContent="Campo inimigo";
 $("player-caption").textContent=setup?"Posicionamento":`${getRemainingShips(game.playerShips)} navio(s) ativo(s)`;
 $("enemy-caption").textContent=setup?"Bloqueado":`${getRemainingShips(game.enemyShips)} navio(s) ativo(s)`;
 $("fleet-status").innerHTML=FLEET.map((n,i)=>`<span class="fleet-item ${i<game.nextShip?"done":i===game.nextShip&&setup?"active":""}">${names[i]} · ${n}</span>`).join("");
 draw("player-board",game.playerBoard,game,setup,false,handlers,animate.computer);draw("enemy-board",game.enemyBoard,game,false,true,handlers,animate.player);
 $("orientation").disabled=!setup;$("difficulty").disabled=!setup;$("auto-place-button").hidden=!setup;$("action-button").hidden=game.phase==="playing";$("difficulty").hidden=!setup;$("orientation").hidden=!setup;$("action-button").disabled=(setup&&game.nextShip!==FLEET.length)||game.phase==="playing";
 $("action-button").textContent=setup?"Começar batalha":"Jogar novamente";
 $("control-title").textContent=setup?`Posicione: ${names[game.nextShip]||"frota completa"}`:"Comandos de batalha";
 $("control-help").textContent=setup?(game.nextShip===FLEET.length?"Frota completa. Inicie a batalha.":`Navio de ${FLEET[game.nextShip]} casa(s). Toque no tabuleiro ou use posicionamento automático.`):`Dificuldade: ${difficulty[game.difficulty]}. Pontuação: ${game.score}. Estrelas encontradas: ${game.stars}.`;
 $("score-value").textContent=game.score;
 if(previousScore!==null&&previousScore!==game.score){const score=$("score-value");score.classList.remove("score-pop");void score.offsetWidth;score.classList.add("score-pop");}
 previousScore=game.score;
 $("history-list").replaceChildren();
 if(!game.history.length){const li=document.createElement("li");li.textContent="Os ataques aparecerão aqui.";$("history-list").append(li);}
 game.history.slice(0,12).forEach(x=>{const li=document.createElement("li"),who=x.side==="player"?"Você":"Computador",out=x.hit?(x.shipDestroyed?"destruiu um navio":"acertou"):x.star?"encontrou uma estrela":"atingiu água";li.textContent=`${who}: linha ${x.row+1}, coluna ${x.col+1} — ${out}`;$("history-list").append(li);});
 $("stats-games").textContent=stats.games;$("stats-wins").textContent=stats.wins;$("stats-losses").textContent=stats.losses;$("stats-best").textContent=stats.bestScore;$("stats-accuracy").textContent=stats.shots?`${Math.round(stats.hits/stats.shots*100)}%`:"—";
}
function draw(id,board,game,setup,enemy,handlers,animation){
 const root=$(id);root.replaceChildren();
 const ships=enemy?game.enemyShips:game.playerShips;
 const sunkIds=new Set(ships.filter(ship=>ship.hits>=ship.length).map(ship=>ship.id));
 const currentShipIds=new Set(ships.map(ship=>ship.id));
 const enteringIds=new Set(!enemy?ships.filter(ship=>!previousPlayerShips.has(ship.id)).map(ship=>ship.id):[]);
 if(!enemy)previousPlayerShips=currentShipIds;
 const event=animation, sunkId=event?.shipDestroyed?board[event.row]?.[event.col]:null;
 const visibleShips=ships.filter(ship=>!enemy||sunkIds.has(ship.id)).map(ship=>{
  const cells=[];for(let r=0;r<BOARD_SIZE;r++)for(let c=0;c<BOARD_SIZE;c++)if(board[r][c]===ship.id)cells.push({r,c});
  return {...ship,cells};
 });
 for(let r=0;r<BOARD_SIZE;r++)for(let c=0;c<BOARD_SIZE;c++){
  const key=r*BOARD_SIZE+c,shot=enemy?game.enemyShots.has(key):game.playerShots.has(key),shipId=board[r][c],cell=document.createElement("button");cell.type="button";cell.className="cell";cell.setAttribute("aria-label",`Linha ${r+1}, coluna ${c+1}`);
  if(shipId&&(!enemy||sunkIds.has(shipId)))cell.classList.add("ship-cell");
  if(shot)cell.classList.add(shipId?"hit":"miss");
  if(enemy&&shot&&game.starCells.has(key))cell.classList.add("star");
  if(event&&event.row===r&&event.col===c)cell.classList.add(event.hit?"impact-hit":event.star?"impact-star":"impact-miss");
  if(enemy&&game.phase==="playing"&&!shot)cell.classList.add("target-ready");
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
   const halfLength=(ship.length*105-18)/2,halfBeam=25;
   const x0=centerX-halfLength,x1=centerX+halfLength,cy=centerY;
   const group=document.createElementNS(svg.namespaceURI,"g");
   if(vertical)group.setAttribute("transform",`rotate(90 ${centerX} ${centerY})`);
   group.setAttribute("class",`fleet-vessel ${enteringIds.has(ship.id)?"placement-enter":""} ${sunkIds.has(ship.id)?"sunk":""} ${ship.id===sunkId?"sink-event":""}`);
   const hull=document.createElementNS(svg.namespaceURI,"path");
   hull.setAttribute("class","fleet-hull");
   hull.setAttribute("d",`M ${x0+10} ${cy-halfBeam} Q ${x0+2} ${cy-halfBeam} ${x0+2} ${cy-13} L ${x0+2} ${cy+13} Q ${x0+2} ${cy+halfBeam} ${x0+10} ${cy+halfBeam} L ${x1-29} ${cy+halfBeam} Q ${x1-7} ${cy+halfBeam} ${x1+9} ${cy+2} Q ${x1+13} ${cy} ${x1+9} ${cy-2} Q ${x1-7} ${cy-halfBeam} ${x1-29} ${cy-halfBeam} Z`);
   group.append(hull);
   const deck=document.createElementNS(svg.namespaceURI,"path");
   deck.setAttribute("class","fleet-deck");
   deck.setAttribute("d",`M ${x0+17} ${cy-15} L ${x1-31} ${cy-15} Q ${x1-18} ${cy-15} ${x1-10} ${cy} Q ${x1-18} ${cy+15} ${x1-31} ${cy+15} L ${x0+17} ${cy+15} Z`);
   group.append(deck);
   const cabinCenter=x0+(x1-x0)*.55;
   const cabin=document.createElementNS(svg.namespaceURI,"rect");
   cabin.setAttribute("x",cabinCenter-18);cabin.setAttribute("y",cy-12);
   cabin.setAttribute("width","36");cabin.setAttribute("height","24");cabin.setAttribute("rx","4");
   cabin.setAttribute("class","fleet-cabin");group.append(cabin);
   const bridge=document.createElementNS(svg.namespaceURI,"rect");
   bridge.setAttribute("x",cabinCenter-8);bridge.setAttribute("y",cy-8);
   bridge.setAttribute("width","16");bridge.setAttribute("height","16");bridge.setAttribute("rx","2");
   bridge.setAttribute("class","fleet-bridge");group.append(bridge);
   const addTurret=(x)=>{
    const turret=document.createElementNS(svg.namespaceURI,"g");
    turret.setAttribute("class","fleet-turret");
    const barrel=document.createElementNS(svg.namespaceURI,"path");
    barrel.setAttribute("d",`M ${x} ${cy} L ${x+13} ${cy}`);
    barrel.setAttribute("class","fleet-turret-barrel");
    const base=document.createElementNS(svg.namespaceURI,"circle");
    base.setAttribute("cx",x);base.setAttribute("cy",cy);base.setAttribute("r","7");
    base.setAttribute("class","fleet-turret-base");
    turret.append(barrel,base);group.append(turret);
   };
   if(ship.length>=2)addTurret(x0+39);
   if(ship.length>=3)addTurret(x1-57);
   const stern=document.createElementNS(svg.namespaceURI,"path");
   stern.setAttribute("class","fleet-detail");
   stern.setAttribute("d",`M ${x0+14} ${cy-15} L ${x0+14} ${cy+15} M ${x0+23} ${cy-19} L ${x0+23} ${cy+19}`);
   group.append(stern);
   const bow=document.createElementNS(svg.namespaceURI,"path");
   bow.setAttribute("class","fleet-detail");
   bow.setAttribute("d",`M ${x1-22} ${cy-7} L ${x1-8} ${cy} L ${x1-22} ${cy+7}`);
   group.append(bow);
   if(sunkIds.has(ship.id)){
    const wreck=document.createElementNS(svg.namespaceURI,"g");
    wreck.setAttribute("class","fleet-wreck");
    const breakLine=document.createElementNS(svg.namespaceURI,"path");
    breakLine.setAttribute("class","fleet-break");
    breakLine.setAttribute("d",`M ${cabinCenter-5} ${cy-24} l -9 12 12 7 -10 12 13 17`);
    const scorch=document.createElementNS(svg.namespaceURI,"path");
    scorch.setAttribute("class","fleet-scorch");
    scorch.setAttribute("d",`M ${x0+28} ${cy-10} q 10 -13 20 0 t 20 0 M ${cabinCenter+13} ${cy+10} q 12 -12 23 0 t 19 0`);
    const damage=document.createElementNS(svg.namespaceURI,"path");
    damage.setAttribute("class","fleet-damage");
    damage.setAttribute("d",`M ${cabinCenter-13} ${cy-17} l 8 12 -12 9 14 9 M ${x1-48} ${cy-15} l -8 11 10 8 -7 12`);
    const splinters=document.createElementNS(svg.namespaceURI,"path");
    splinters.setAttribute("class","fleet-splinters");
    splinters.setAttribute("d",`M ${cabinCenter-22} ${cy-25} l -15 -13 5 18 M ${cabinCenter+17} ${cy+23} l 18 13 -7 -19 M ${x1-20} ${cy-5} l 17 -11 -8 17`);
    const blast=document.createElementNS(svg.namespaceURI,"path");
    blast.setAttribute("class","fleet-blast");
    blast.setAttribute("d",`M ${centerX-15} ${cy-10} l 8 -7 5 8 10 -5 -3 11 9 5 -12 4 -3 10 -7 -9 -11 2 5 -11 -8 -7 Z`);
    const fracture=document.createElementNS(svg.namespaceURI,"path");
    fracture.setAttribute("class","fleet-fracture");
    fracture.setAttribute("d",`M ${centerX-28} ${cy-23} l 11 12 -8 8 13 7 -7 18 M ${centerX+28} ${cy-23} l -10 11 8 8 -13 7 7 18`);
    wreck.append(breakLine,scorch,damage,splinters,blast,fracture);group.append(wreck);
   }
   svg.append(group);
  }
  root.append(svg);
 }
}
