import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./online-config.js";

const SESSION_KEY = "seabattle.supabase.session.v1";
let pendingSession = null;
const configured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const endpoint = path => `${SUPABASE_URL.replace(/\/$/, "")}/${path}`;
const readSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
};
const saveSession = session => {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
  return session;
};

async function request(path, options = {}, session = null) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...options.headers
  };
  const response = await fetch(endpoint(path), { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.msg || body.message || body.error_description || body.error || `Supabase HTTP ${response.status}`);
  return body;
}

export function onlineConfigured() { return configured(); }

let pendingSession = null;

export async function ensureOnlineSession() {
  if (!configured()) return null;
  if (pendingSession) return pendingSession;
  pendingSession = (async () => {
    let session = readSession();
    if (session?.access_token && session.expires_at > Date.now() / 1000 + 60) return session;
    if (session?.refresh_token) {
      try {
        const refreshed = await request("auth/v1/token?grant_type=refresh_token", {
          method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token })
        });
        return saveSession({ ...refreshed, expires_at: Date.now() / 1000 + (refreshed.expires_in || 3600) });
      } catch { session = null; }
    }
    const created = await request("auth/v1/signup", { method: "POST", body: JSON.stringify({ data: {} }) });
    if (!created.access_token) throw new Error("Autenticação anônima indisponível. Ative-a no Supabase Auth.");
    return saveSession({ ...created, expires_at: Date.now() / 1000 + (created.expires_in || 3600) });
  })();
  try { return await pendingSession; } finally { pendingSession = null; }
}
export function createSeededRandom(seed) {
  let state = Number(seed) >>> 0;
  return function random() {
    let value = state += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export async function createOnlineMatch() {
  if (!configured()) return null;
  const session = await ensureOnlineSession();
  return request("functions/v1/create-match", { method: "POST", body: "{}" }, session);
}

export async function submitOnlineResult(matchId, shots) {
  if (!configured() || !matchId) return null;
  const session = await ensureOnlineSession();
  return request("functions/v1/submit-score", {
    method: "POST", body: JSON.stringify({ match_id: matchId, shots })
  }, session);
}

export async function fetchLeaderboard() {
  if (!configured()) return null;
  const session = await ensureOnlineSession();
  return request("rest/v1/rpc/get_leaderboard", { method: "POST", body: "{}" }, session);
}

export async function updateOnlineDisplayName(displayName) {
  if (!configured()) return null;
  const session = await ensureOnlineSession();
  return request("rest/v1/rpc/set_display_name", {
    method: "POST", body: JSON.stringify({ requested_name: displayName })
  }, session);
}
