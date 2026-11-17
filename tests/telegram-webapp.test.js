import test from "node:test";
import assert from "node:assert/strict";
import { initTelegramWebApp } from "../src/telegram-webapp.js";

test("mantém o modo navegador quando o Telegram WebApp não está disponível", () => {
  const documentRef = { documentElement: { dataset: {} } };
  const context = initTelegramWebApp({ telegram: undefined, documentRef });

  assert.equal(context.available, false);
  assert.equal(context.platform, "browser");
  assert.equal(documentRef.documentElement.dataset.host, "browser");
});

test("inicializa o Telegram WebApp e expande a área do jogo", () => {
  const calls = [];
  const documentRef = { documentElement: { dataset: {} } };
  const telegram = {
    platform: "android",
    ready: () => calls.push("ready"),
    expand: () => calls.push("expand")
  };

  const context = initTelegramWebApp({ telegram, documentRef });

  assert.deepEqual(calls, ["ready", "expand"]);
  assert.equal(context.available, true);
  assert.equal(context.platform, "android");
  assert.equal(documentRef.documentElement.dataset.host, "telegram");
  assert.equal("initData" in context, false);
});

test("não interrompe o jogo se uma função do host falhar", () => {
  const documentRef = { documentElement: { dataset: {} } };
  const context = initTelegramWebApp({
    telegram: { ready() { throw new Error("host indisponível"); } },
    documentRef
  });

  assert.equal(context.available, true);
  assert.equal(documentRef.documentElement.dataset.host, "telegram");
});
