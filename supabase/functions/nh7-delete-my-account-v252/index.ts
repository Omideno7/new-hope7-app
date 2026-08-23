import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:CORS});

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:CORS});
  if(req.method!=="POST") return json({ok:false,error:"method_not_allowed"},405);
  const auth=req.headers.get("Authorization")||"";
  if(!auth.toLowerCase().startsWith("bearer ")) return json({ok:false,error:"login_required"},401);
  const url=Deno.env.get("SUPABASE_URL")||"";
  const anon=Deno.env.get("SUPABASE_ANON_KEY")||"";
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  if(!url||!anon||!service) return json({ok:false,error:"server_configuration"},500);
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const {data:userData,error:userError}=await userClient.auth.getUser();
  const user=userData?.user;
  if(userError||!user) return json({ok:false,error:"invalid_session"},401);
  const email=String(user.email||"").trim().toLowerCase();
  if(!email) return json({ok:false,error:"email_required"},400);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});

  const byUser:[string,string][]=[
    ["nh7_account_content_grants_v251","user_id"],
    ["nh7_account_verse_marks_v230","user_id"],
    ["nh7_library_user_grants_v230","user_id"],
    ["nh7_school_video_grants_v260","user_id"],
    ["fasting_journeys","user_id"],
    ["spiritual_plan_progress","user_id"]
  ];
  const byEmail:[string,string][]=[
    ["nh7_account_notes","user_email"],
    ["nh7_account_progress","user_email"],
    ["nh7_account_saved_verses","user_email"],
    ["nh7_account_verse_marks_v230","user_email"],
    ["nh7_app_activity_daily","user_email"],
    ["nh7_audio_sessions","user_email"],
    ["nh7_content_activity_daily","user_email"],
    ["nh7_library_access_log","user_email"],
    ["nh7_library_user_grants_v230","user_email"],
    ["nh7_school_video_grants_v260","user_email"],
    ["notification_inbox","user_email"],
    ["notification_inbox_receipts","user_email"],
    ["school_assignments","user_email"],
    ["school_certificates","user_email"],
    ["school_exam_attempts","user_email"],
    ["school_progress","user_email"],
    ["qa_questions","author_email"],
    ["nh7_school_video_codes_v260","target_email"]
  ];
  const cleanupErrors:string[]=[];
  for(const [table,column] of byUser){const {error}=await admin.from(table).delete().eq(column,user.id);if(error) cleanupErrors.push(`${table}:${error.code||error.message}`)}
  for(const [table,column] of byEmail){const {error}=await admin.from(table).delete().eq(column,email);if(error) cleanupErrors.push(`${table}:${error.code||error.message}`)}

  const {error:deleteError}=await admin.auth.admin.deleteUser(user.id);
  if(deleteError) return json({ok:false,error:"auth_delete_failed",detail:deleteError.message,cleanup_errors:cleanupErrors},500);
  return json({ok:true,deleted:true,cleanup_warnings:cleanupErrors.length});
});
