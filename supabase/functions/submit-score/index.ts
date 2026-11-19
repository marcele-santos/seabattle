import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyReplay } from "../_shared/game-verifier.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405, headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "authentication_required" }, { status: 401, headers: cors });

  const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return Response.json({ error: "invalid_session" }, { status: 401, headers: cors });

  try {
    const body = await request.json();
    if (typeof body.match_id !== "string") throw new Error("invalid_match_id");
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: match, error: matchError } = await admin.from("match_sessions")
      .select("id, user_id, seed, expires_at, submitted_at")
      .eq("id", body.match_id).maybeSingle();
    if (matchError || !match) throw new Error("match_not_found");
    if (match.user_id !== authData.user.id) throw new Error("match_owner_mismatch");
    if (match.submitted_at) throw new Error("match_already_submitted");
    if (Date.parse(match.expires_at) < Date.now()) throw new Error("match_expired");

    const verified = verifyReplay(match.seed, body.shots);
    const { error: finalizeError } = await admin.rpc("finalize_verified_match", {
      requested_match_id: match.id,
      verified_score: verified.score,
      verified_shots: verified.shots,
      verified_hits: verified.hits
    });
    if (finalizeError) throw new Error(finalizeError.message);
    return Response.json({ accepted: true, ...verified }, { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "invalid_submission" }, { status: 400, headers: cors });
  }
});
