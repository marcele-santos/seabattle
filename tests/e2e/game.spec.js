import { test, expect } from "@playwright/test";

test("jogador posiciona a frota, inicia a batalha e troca ataques", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Batalha Naval");

  for (const cell of [0, 16, 32, 48, 58]) {
    await page.locator("#player-board .cell").nth(cell).click();
  }

  await expect(page.locator("#fleet-status .fleet-item.done")).toHaveCount(5);
  await page.locator("#action-button").click();
  await expect(page.locator("#phase-label")).toHaveText("Batalha em andamento");

  await page.locator("#enemy-board .cell").first().click();
  await expect(page.locator("#enemy-board .cell").first()).toHaveClass(/hit|miss/);
  await expect(page.locator("#player-board .cell.hit, #player-board .cell.miss").first()).toBeVisible();
});

test("reiniciar limpa o tabuleiro e retorna à preparação", async ({ page }) => {
  await page.goto("/");
  await page.locator("#player-board .cell").first().click();
  await page.locator("#reset-button").click();

  await expect(page.locator("#phase-label")).toHaveText("Preparação");
  await expect(page.locator("#player-board .cell.ship")).toHaveCount(0);
  await expect(page.locator("#fleet-status .fleet-item.done")).toHaveCount(0);
});

test("interface adapta os tabuleiros a telas estreitas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const layout = await page.locator(".game-layout").evaluate(el => getComputedStyle(el).gridTemplateColumns);
  expect(layout.trim().split(" ").filter(Boolean)).toHaveLength(1);
  const documentWidth = await page.locator("body").evaluate(el => el.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(390);
});
