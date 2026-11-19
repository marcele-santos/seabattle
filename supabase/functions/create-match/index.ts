import { createClient } from "npm:@supabase/supabase-js@2";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async request => {
 if(request.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(request.method!=="POST") return Response.json({error:"method_not_allowed"},{status:405,headers:cors});
 const url=Deno.env.get("SUPABASE_URL"), anonKey=Deno.env.get("SUPABASE_ANON_KEY"), serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anonKey||!serviceKey) return Response.json({error:"server_configuration_error"},{status:500,headers:cors});
 const authorization=request.headers.get("Authorization")||"", token=authorization.replace(/^Bearer\s+/i,"");
 if(!token||token===authorization) return Response.json({error:"authentication_required"},{status:401,headers:cors});
 const authClient=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authData,error:authError}=await authClient.auth.getUser(token);
 if(authError||!authData.user) return Response.json({error:"invalid_session"},{status:401,headers:cors});
 const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const bytes=new Uint32Array(1); crypto.getRandomValues(bytes);
 const {data,error}=await admin.rpc("create_verified_match_session",{requested_user_id:authData.user.id,requested_seed:bytes[0]});
 if(error||!data?.length) return Response.json({error:"match_creation_failed"},{status:500,headers:cors});
 return Response.json(data[0],{headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
});