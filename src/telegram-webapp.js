const browserContext = Object.freeze({ available: false, platform: "browser" });

export function initTelegramWebApp({
  telegram = globalThis.Telegram?.WebApp,
  documentRef = globalThis.document
} = {}) {
  if (!telegram) {
    if (documentRef?.documentElement) {
      documentRef.documentElement.dataset.host = "browser";
    }
    return browserContext;
  }

  if (documentRef?.documentElement) {
    documentRef.documentElement.dataset.host = "telegram";
  }

  // These methods are optional in older Telegram clients. A host API failure
  // must not prevent the standalone browser game from starting.
  try {
    telegram.ready?.();
    telegram.expand?.();
  } catch {
    // Keep the game usable even if the host bridge is partially unavailable.
  }

  return Object.freeze({
    available: true,
    platform: typeof telegram.platform === "string" ? telegram.platform : "unknown"
  });
}
