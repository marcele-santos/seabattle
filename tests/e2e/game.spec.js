import {test,expect} from "@playwright/test";
test("posiciona frota, inicia batalha e registra ataques",async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto("/");
 await expect(page).toHaveTitle("Batalha Naval");
 await expect(page.locator("#enemy-panel")).toBeHidden();
 await page.locator("#player-board .cell").nth(0).click();
 await page.locator("#orientation").selectOption("vertical");
 await page.locator("#player-board .cell").nth(16).click();
 await page.locator("#orientation").selectOption("horizontal");
 for(const i of [32,48,58])await page.locator("#player-board .cell").nth(i).click();
 await expect(page.locator("#fleet-status .fleet-item.done")).toHaveCount(5);
 await expect(page.locator("#player-board .cell.ship-cell")).toHaveCount(9);
 await page.screenshot({path:"test-results/desktop-setup.png",fullPage:true});
 const vesselTransforms=await page.locator("#player-board .fleet-vessel").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("transform")));
 console.log("Ship transforms:",vesselTransforms);
 expect(vesselTransforms.filter(value=>value?.includes("rotate(90")).length).toBe(1);
 await page.locator("#action-button").click();
 await expect(page.locator("#phase-label")).toHaveText("Batalha em andamento");
 await expect(page.locator("#enemy-panel")).toBeVisible();
 await expect(page.locator("#enemy-panel")).toHaveCSS("order","-1");
 await expect(page.locator("#enemy-board .cell.star")).toHaveCount(0);
 await expect(page.locator("#player-board .fleet-art .fleet-hull")).toHaveCount(5);
 await page.screenshot({path:"test-results/desktop-battle.png",fullPage:true});
 await page.locator("#enemy-board .cell").first().click();
 await expect(page.locator("#enemy-board .cell").first()).toHaveClass(/hit|miss/);
 await expect(page.locator("#history-list li").first()).toContainText(/Você|Computador/);
});
test("reiniciar retorna à preparação",async({page})=>{await page.goto("/");await page.locator("#player-board .cell").first().click();await page.locator("#reset-button").click();await expect(page.locator("#phase-label")).toHaveText("Preparação");await expect(page.locator("#player-board .cell.ship-cell")).toHaveCount(0);});
test("layout funciona em tela estreita",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/");const cols=await page.locator(".game-layout").evaluate(e=>getComputedStyle(e).gridTemplateColumns);expect(cols.trim().split(" ").filter(Boolean)).toHaveLength(1);expect(await page.locator("body").evaluate(e=>e.scrollWidth)).toBeLessThanOrEqual(390);expect(await page.locator(".board").first().evaluate(e=>getComputedStyle(e).gap)).toBe("0px");expect(await page.locator(".topbar h1").evaluate(e=>getComputedStyle(e).whiteSpace)).toBe("nowrap");for(const i of [0,16,32,48,58])await page.locator("#player-board .cell").nth(i).click();await expect(page.locator("#control-help")).toHaveText("Frota completa. Inicie a batalha.");await page.screenshot({path:"test-results/mobile-setup.png",fullPage:true});});
test("dificuldade fica bloqueada após início",async({page})=>{await page.goto("/");await page.locator("#difficulty").selectOption("hard");for(const i of [0,16,32,48,58])await page.locator("#player-board .cell").nth(i).click();await page.locator("#action-button").click();await expect(page.locator("#difficulty")).toBeDisabled();});
test("estatísticas locais são recuperadas ao recarregar",async({page})=>{await page.goto("/");await page.evaluate(()=>localStorage.setItem("seabattle.stats.v1",JSON.stringify({games:3,wins:2,losses:1,bestScore:900,totalScore:1800,shots:20,hits:10})));await page.reload();await expect(page.locator("#stats-games")).toHaveText("3");await expect(page.locator("#stats-wins")).toHaveText("2");await expect(page.locator("#stats-accuracy")).toHaveText("50%");});

test("água e estrela têm feedback visual distinto e som pode ser desligado",async({page})=>{
 await page.goto("/");
 const result=await page.evaluate(async()=>{
  const state=await import("/src/game-state.js");
  const ui=await import("/src/ui.js");
  const game=state.createGame(Math.random);
  for(const [row,col,orientation] of [[0,0,"horizontal"],[2,0,"horizontal"],[4,0,"horizontal"],[6,0,"horizontal"],[7,4,"horizontal"]])state.placePlayerShip(game,row,col,orientation);
  state.startGame(game);
  const stats={games:0,wins:0,bestScore:0,shots:0,hits:0};
  const handlers={place(){},attack(){},isBusy:false};
  let water=-1;
  for(let key=0;key<64;key++)if(game.enemyBoard[Math.floor(key/8)][key%8]===null&&!game.starCells.has(key)){water=key;break;}
  state.playerAttack(game,Math.floor(water/8),water%8);
  ui.render(game,handlers,stats);
  const waterClass=document.querySelectorAll("#enemy-board .cell")[water].className;
  const star=[...game.starCells][0];
  state.playerAttack(game,Math.floor(star/8),star%8);
  ui.render(game,handlers,stats);
  const starClass=document.querySelectorAll("#enemy-board .cell")[star].className;
  return {waterClass,starClass};
 });
 expect(result.waterClass).toContain("impact-miss");
 expect(result.waterClass).not.toContain("impact-star");
 expect(result.starClass).toContain("impact-star");
 expect(await page.locator("#sound-toggle").getAttribute("aria-pressed")).toBe("true");
 await page.locator("#sound-toggle").click();
 await expect(page.locator("#sound-toggle")).toHaveAttribute("aria-pressed","false");
 await expect(page.locator("#sound-toggle")).toContainText("desligado");
});

test("posicionamento automático cria frota válida e inicia a batalha",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto("/");
 await page.locator("#auto-place-button").click();
 await expect(page.locator("#fleet-status .fleet-item.done")).toHaveCount(5);
 await expect(page.locator("#player-board .cell.ship-cell")).toHaveCount(9);
 await expect(page.locator("#action-button")).toBeEnabled();
 await page.locator("#action-button").click();
 await expect(page.locator("#phase-label")).toHaveText("Batalha em andamento");
 await expect(page.locator("#auto-place-button")).toBeHidden();
 await expect(page.locator("#action-button")).toBeHidden();
 await expect(page.locator("#enemy-board .cell")).toHaveCount(64);
 await page.screenshot({path:"test-results/mobile-battle.png",fullPage:true});
 await expect(page.locator("#enemy-board .cell").first()).toBeEnabled();
});


test("navio múltiplo só aparece destruído depois do último acerto",async({page})=>{
 await page.goto("/");
 const result=await page.evaluate(async()=>{
  const state=await import("/src/game-state.js");
  const ui=await import("/src/ui.js");
  const game=state.createGame(Math.random);
  for(const [row,col] of [[0,0],[2,0],[4,0],[6,0],[7,4]])state.placePlayerShip(game,row,col,"horizontal");
  state.startGame(game);
  const stats={games:0,wins:0,bestScore:0,shots:0,hits:0};
  const handlers={place(){},attack(){},isBusy:false};
  const ship=game.enemyShips.find(item=>item.length===3);
  const cells=[];
  for(let row=0;row<8;row++)for(let col=0;col<8;col++)if(game.enemyBoard[row][col]===ship.id)cells.push([row,col]);
  state.playerAttack(game,cells[0][0],cells[0][1]);
  ui.render(game,handlers,stats);
  const partial={sunk:document.querySelectorAll("#enemy-board .fleet-vessel.sunk").length,hitCells:document.querySelectorAll("#enemy-board .cell.ship-sunk").length};
  for(const [row,col] of cells.slice(1))state.playerAttack(game,row,col);
  ui.render(game,handlers,stats);
  return {partial,sunk:document.querySelectorAll("#enemy-board .fleet-vessel.sunk").length,blast:document.querySelectorAll("#enemy-board .fleet-blast").length,fracture:document.querySelectorAll("#enemy-board .fleet-fracture").length};
 });
 expect(result.partial.sunk).toBe(0);
 expect(result.partial.hitCells).toBe(0);
 expect(result.sunk).toBe(1);
 expect(result.blast).toBe(1);
 expect(result.fracture).toBe(1);
});
