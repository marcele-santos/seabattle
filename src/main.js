import {createGame,placePlayerShip,startGame,playerAttack,computerAttack} from "./game-state.js";
import {initTelegramWebApp} from "./telegram-webapp.js";
import {render} from "./ui.js";
import {loadStats,saveResult} from "./stats.js";
initTelegramWebApp();
let stats=loadStats(),game=createGame(Math.random,document.getElementById("difficulty").value),resultSaved=false,resolving=false;
const $=id=>document.getElementById(id);
function message(value){$("feedback").textContent=value;}
function refresh(){render(game,{place,attack,isBusy:resolving},stats);}
function finish(){if((game.phase==="won"||game.phase==="lost")&&!resultSaved){stats=saveResult(stats,game);resultSaved=true;}}
function place(row,col){const result=placePlayerShip(game,row,col,$("orientation").value);if(!result.ok)return message("Posição inválida. Escolha outra casa ou orientação.");message(result.complete?"Frota posicionada. Inicie a batalha.":"Navio posicionado.");refresh();}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function attack(row,col){
 if(resolving)return;
 const result=playerAttack(game,row,col);if(!result.ok)return;
 const attackedGame=game;
 resolving=true;
 message(result.hit?(result.shipDestroyed?"Navio inimigo destruído! +150 pontos.":"Acertou um navio! +100 pontos."):result.star?"Água, mas encontrou uma estrela bônus! +25 pontos.":"Água. O computador vai responder.");
 refresh();
 if(result.finished){resolving=false;message("Vitória! Frota inimiga destruída. Bônus de 500 pontos.");finish();refresh();return;}
 await wait(result.shipDestroyed?900:520);
 if(game!==attackedGame)return;
 const reply=computerAttack(game);
 if(reply.ok)message(reply.hit?(reply.shipDestroyed?"O computador destruiu um dos seus navios.":"O computador acertou um dos seus navios."):"O computador errou o ataque.");
 if(game.phase==="lost")message("Derrota. O computador destruiu sua frota.");
 resolving=false;finish();refresh();
}
$("action-button").addEventListener("click",()=>{if(game.phase==="setup"){if(!startGame(game))return;message("Batalha iniciada. Escolha uma casa no campo inimigo.");}else if(game.phase==="won"||game.phase==="lost"){game=createGame(Math.random,$("difficulty").value);resultSaved=false;message("Nova partida. Posicione sua frota.");}else return;refresh();});
$("reset-button").addEventListener("click",()=>{game=createGame(Math.random,$("difficulty").value);resultSaved=false;resolving=false;message("Partida reiniciada. Posicione sua frota.");refresh();});
$("orientation").addEventListener("change",()=>message(`Orientação: ${$("orientation").value==="horizontal"?"horizontal":"vertical"}.`));
$("difficulty").addEventListener("change",()=>{game.difficulty=$("difficulty").value;message("Dificuldade definida para a próxima batalha.");refresh();});
refresh();
