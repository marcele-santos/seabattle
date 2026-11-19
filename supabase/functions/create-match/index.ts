import { createClient } from "npm:@supabase/supabase-js@2";

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
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "authentication_required" }, { status: 401, headers: cors });

  const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return Response.json({ error: "invalid_session" }, { status: 401, headers: cors });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const seed = bytes[0];
  const { data, error } = await admin.from("match_sessions")
    .insert({ user_id: authData.user.id, seed })
    .select("id, seed").single();
  if (error) return Response.json({ error: "match_creation_failed" }, { status: 500, headers: cors });
  return Response.json(data, { headers: { ...cors, "Content-Type": "application/json" } });
});
