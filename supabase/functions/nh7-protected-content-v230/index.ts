import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function reply(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function cleanId(value: unknown): string {
  return String(value ?? "").trim();
}

function storagePathFromUrl(rawUrl: unknown, bucket: string): string {
  const value = String(rawUrl ?? "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    const markers = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
    ];
    for (const marker of markers) {
      const index = url.pathname.indexOf(marker);
      if (index >= 0) return decodeURIComponent(url.pathname.slice(index + marker.length));
    }
  } catch (_) {
    // A plain storage path is also accepted.
  }
  if (!/^https?:\/\//i.test(value)) {
    return value.replace(new RegExp(`^${bucket}/`), "").replace(/^\/+/, "");
  }
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ allowed: false, code: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authorization = req.headers.get("Authorization") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return reply({ allowed: false, code: "server_configuration_missing" }, 500);
  }
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return reply({ allowed: false, code: "login_required" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return reply({ allowed: false, code: "login_required" }, 401);
  }

  const { data: accessData, error: accessError } = await userClient.rpc("nh7_my_protected_access_v230");
  if (accessError) {
    return reply({ allowed: false, code: "access_check_failed", message: accessError.message }, 403);
  }
  const access = Array.isArray(accessData) ? accessData[0] : accessData;
  if (!access?.allowed) {
    return reply({ allowed: false, code: access?.status || "school_approval_required" }, 403);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch (_) {
    return reply({ allowed: false, code: "invalid_json" }, 400);
  }

  const kind = cleanId(body.kind).toLowerCase();
  const mediaId = cleanId(body.media_id || body.id);
  const deviceId = cleanId(body.device_id || req.headers.get("x-device-id")).slice(0, 160);
  let bucket = "";
  let path = "";
  let fileName = "";
  let mimeType = "";
  let title = "";
  let expiresIn = 600;

  if (kind === "library") {
    if (!mediaId) return reply({ allowed: false, code: "item_id_required" }, 400);
    const { data, error } = await userClient.rpc("nh7_library_authorize_v230", {
      p_item_id: mediaId,
      p_code: cleanId(body.code),
    });
    if (error) return reply({ allowed: false, code: "library_authorization_failed", message: error.message }, 403);
    const authz = Array.isArray(data) ? data[0] : data;
    if (!authz?.allowed) return reply({ allowed: false, code: authz?.code || "library_denied" }, 403);
    bucket = "nh7-library";
    path = cleanId(authz.storage_path);
    fileName = cleanId(authz.file_name);
    mimeType = cleanId(authz.mime_type) || "application/pdf";
    title = cleanId(authz.title_fa || authz.title_en || authz.title_hr || fileName);
    expiresIn = 600;
  } else if (kind === "sermon") {
    if (!mediaId) return reply({ allowed: false, code: "media_id_required" }, 400);
    const { data, error } = await adminClient
      .from("sermons")
      .select("id,title_fa,title_en,title_hr,audio_url,is_published")
      .eq("id", mediaId)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !data) return reply({ allowed: false, code: "media_not_found" }, 404);
    bucket = "church-audio";
    path = storagePathFromUrl(data.audio_url, bucket);
    title = cleanId(data.title_fa || data.title_en || data.title_hr);
    mimeType = "audio/mpeg";
    expiresIn = 14400;
  } else if (kind === "audio_bible") {
    if (!mediaId) return reply({ allowed: false, code: "media_id_required" }, 400);
    const { data, error } = await adminClient
      .from("audio_bible_chapters_v220")
      .select("id,title_fa,title_en,title_hr,audio_url,storage_path,file_name,is_published")
      .eq("id", mediaId)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !data) return reply({ allowed: false, code: "media_not_found" }, 404);
    bucket = "church-audio";
    path = cleanId(data.storage_path) || storagePathFromUrl(data.audio_url, bucket);
    fileName = cleanId(data.file_name);
    title = cleanId(data.title_fa || data.title_en || data.title_hr || fileName);
    mimeType = "audio/mpeg";
    expiresIn = 14400;
  } else {
    return reply({ allowed: false, code: "unsupported_content_type" }, 400);
  }

  if (!bucket || !path) {
    return reply({ allowed: false, code: "protected_storage_path_missing" }, 404);
  }

  const { data: signed, error: signedError } = await adminClient.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn, { download: false });

  if (signedError || !signed?.signedUrl) {
    return reply({ allowed: false, code: "signed_url_failed", message: signedError?.message || "No signed URL" }, 500);
  }

  // Lightweight access logging for audio. Library access is logged inside its RPC.
  if (kind !== "library") {
    await adminClient.from("nh7_content_access_log_v230").insert({
      user_id: userData.user.id,
      user_email: String(userData.user.email || "").toLowerCase(),
      content_type: kind,
      content_id: mediaId,
      device_id: deviceId,
      accessed_at: new Date().toISOString(),
    }).then(() => undefined).catch(() => undefined);
  }

  return reply({
    allowed: true,
    signed_url: signed.signedUrl,
    expires_in: expiresIn,
    expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    title,
    file_name: fileName,
    mime_type: mimeType,
    content_type: kind,
  });
});
