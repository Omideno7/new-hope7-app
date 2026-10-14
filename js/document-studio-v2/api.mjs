const base = "https://gpzcwffxnddhaeaogdyo.supabase.co",
  key = "sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37";
export function session(admin = false) {
  try {
    return admin
      ? { access_token: localStorage.getItem("nh7_admin_token") || "" }
      : JSON.parse(localStorage.getItem("nh7_user_session_v170") || "null");
  } catch {
    return null;
  }
}
export function owner() {
  try {
    return (
      JSON.parse(
        atob(
          session(true)
            .access_token.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/"),
        ),
      ).sub || "preview"
    );
  } catch {
    return "preview";
  }
}
export async function rpc(name, payload = {}, mode = "admin") {
  const token =
    mode === "public" ? key : session(mode === "admin")?.access_token;
  if (!token) throw Error("Sign in to continue.");
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (mode !== "public") headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(`${base}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });
    const value = await r.json().catch(() => null);
    if (!r.ok) throw Error(value?.message || "Document service unavailable.");
    return value;
  } finally {
    clearTimeout(timer);
  }
}
export const calls = {
  capabilities: "nh7_document_capabilities_v2",
  list: "nh7_document_admin_list_v2",
  recipients: "nh7_document_recipients_v2",
  save: "nh7_document_save_draft_v2",
  reserve: "nh7_document_reserve_number_v2",
  issue: "nh7_document_issue_v2",
  revoke: "nh7_document_revoke_v2",
  deliver: "nh7_document_deliver_v2",
  remove: "nh7_document_delete_draft_v2",
  template: "nh7_document_save_template_v2",
  templates: "nh7_document_templates_v2",
  verify: "nh7_document_verify_v2",
  archive: "nh7_my_documents_v2",
};
export function localKey(documentId) {
  return "nh7_document_studio_v2:" + owner() + ":" + documentId;
}
export function localDrafts() {
  const prefix = "nh7_document_studio_v2:" + owner() + ":";
  const rows = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(prefix)) continue;
    try {
      const d = JSON.parse(localStorage.getItem(k));
      if (d.design_schema_version === 2 && d.status === "draft") rows.push(d);
    } catch {}
  }
  return rows;
}
export function saveLocal(d) {
  localStorage.setItem(localKey(d.id), JSON.stringify(d));
}
