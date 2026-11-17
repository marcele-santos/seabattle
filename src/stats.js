const KEY="seabattle.stats.v1";
export function emptyStats(){return {games:0,wins:0,losses:0,bestScore:0,totalScore:0,shots:0,hits:0};}
export function loadStats(storage=globalThis.localStorage){
 try{const value=JSON.parse(storage?.getItem(KEY)||"null");if(!value||typeof value!=="object")return emptyStats();const stats=emptyStats();for(const key of Object.keys(stats))if(Number.isFinite(value[key])&&value[key]>=0)stats[key]=value[key];return stats;}catch{return emptyStats();}
}
export function saveResult(stats,game,storage=globalThis.localStorage){
 const next={...stats};next.games++;if(game.phase==="won")next.wins++;else if(game.phase==="lost")next.losses++;next.totalScore+=game.score;next.bestScore=Math.max(next.bestScore,game.score);next.shots+=game.playerShots.size;next.hits+=game.history.filter(x=>x.side==="player"&&x.hit).length;
 try{storage?.setItem(KEY,JSON.stringify(next));}catch{}return next;
}
