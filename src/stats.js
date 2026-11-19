const KEY="seabattle.stats.v1";
export function emptyStats(){return {games:0,wins:0,losses:0,bestScore:0,totalScore:0,shots:0,hits:0};}
function getStorage(storage){try{return storage??globalThis.localStorage;}catch{return null;}}
export function loadStats(storage){
 try{
  const target=getStorage(storage),value=JSON.parse(target?.getItem(KEY)||"null");
  if(!value||typeof value!=="object"||Array.isArray(value))return emptyStats();
  const stats=emptyStats();
  for(const key of Object.keys(stats))if(Number.isSafeInteger(value[key])&&value[key]>=0)stats[key]=value[key];
  if(stats.wins+stats.losses>stats.games){stats.wins=Math.min(stats.wins,stats.games);stats.losses=Math.min(stats.losses,stats.games-stats.wins);}
  stats.hits=Math.min(stats.hits,stats.shots);
  stats.bestScore=Math.min(stats.bestScore,stats.totalScore||stats.bestScore);
  return stats;
 }catch{return emptyStats();}
}
export function saveResult(stats,game,storage){
 if(!game||!["won","lost"].includes(game.phase))return stats;
 const next={...emptyStats(),...stats};
 next.games++;if(game.phase==="won")next.wins++;else next.losses++;
 const score=Number.isSafeInteger(game.score)&&game.score>=0?game.score:0;
 next.totalScore+=score;next.bestScore=Math.max(next.bestScore,score);
 next.shots+=game.playerShots instanceof Set?game.playerShots.size:0;
 next.hits+=Array.isArray(game.history)?game.history.filter(x=>x.side==="player"&&x.hit).length:0;
 try{getStorage(storage)?.setItem(KEY,JSON.stringify(next));}catch{}
 return next;
}
