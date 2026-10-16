// Isolated PostgreSQL (PGlite), never a remote/Production database.
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
const ADMIN = "00000000-0000-0000-0000-000000000001",
  A = "00000000-0000-0000-0000-000000000002",
  B = "00000000-0000-0000-0000-000000000003",
  DELEGATE = "00000000-0000-0000-0000-000000000004";
async function database({coreOnly=false,disabled=false}={}) {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create schema private;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function public.nh7_is_admin() returns boolean language sql as $$select auth.uid()='${ADMIN}'::uuid$$;create function private.nh7_admin_is_owner_v350() returns boolean language sql as $$select public.nh7_is_admin()$$;create function public.nh7_admin_my_access_v350() returns jsonb language sql as $$select jsonb_build_object('is_owner',public.nh7_is_admin(),'is_admin',(public.nh7_is_admin() or auth.uid()='${DELEGATE}'::uuid),'permissions',jsonb_build_array())$$;create table public.school_student_identities(user_id uuid,student_code text,status text);create table public.school_certificates(id uuid,user_name text,user_email text,recipient_user_id uuid,student_code text,public_token uuid,status text,issue_date date,certificate_number text,certificate_type text,language text,course_code text,revoked_at timestamptz);grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
  );
  for (const [uid, name, email] of [
    [ADMIN, "Admin", "admin@example.test"],
    [A, "Alex Example", "alex@example.test"],
    [B, "Blair Example", "blair@example.test"],
    [DELEGATE, "Delegate", "delegate@example.test"],
  ])
    await db.query("insert into auth.users values($1,$2,$3)", [
      uid,
      email,
      { full_name: name },
    ]);
  await db.query(
    "insert into school_student_identities values($1,'NH7-S-101','active')",
    [A],
  );
  await db.query(
    "insert into school_certificates values('11111111-1111-1111-1111-111111111111','Alex Example','alex@example.test',$1,'NH7-S-101','22222222-2222-2222-2222-222222222222','approved','2026-01-01','LEGACY-001','foundation_school','fa','foundation_school')",
    [A],
  );
  const baseline = await db.query("select * from school_certificates");
  const sql = fs.readFileSync("supabase/review/wave5-document-studio-v2/candidate.sql", "utf8");
  await db.exec(sql);
  await db.exec(sql); // Idempotent review SQL.
  if(!coreOnly){await db.exec("create schema storage;create table storage.objects(bucket_id text,name text,owner_id text)");
  await db.exec(fs.readFileSync("supabase/review/wave5-document-studio-v2/library-boundary.sql","utf8"));}
  // Current activation proposal in a fresh synthetic database only. Never a remote/live connection.
  await db.exec(fs.readFileSync("supabase/review/wave7_5-admin-documents/document-backend-proposal.sql","utf8"));
  await db.exec(fs.readFileSync("supabase/review/wave7_5-admin-documents/rls-acl-proposal.sql","utf8"));
  if(!disabled)await db.exec("update private.nh7_document_control_wave75 set enabled=true where singleton"); // Synthetic activation only.
  const signatures = {
    nh7_admin_my_access_v350: [],
    nh7_document_capabilities_v2: [],
    nh7_document_recipients_v2: [],
    nh7_document_recipient_search_v2: [["p_query","text"],["p_after","uuid"],["p_limit","integer"]],
    nh7_document_admin_list_v2: [],
    nh7_document_templates_v2: [],
    nh7_document_library_prepare_v2:[["p_plan","jsonb"]],
    nh7_my_documents_v2: [],
    nh7_document_save_draft_v2: [
      ["p_document", "jsonb"],
      ["p_revision", "integer"],
    ],
    nh7_document_prepare_v2: [
      ["p_id", "uuid"],
      ["p_revision", "integer"], ["p_request_id","uuid"],
    ],
    nh7_document_issue_v2: [
      ["p_id", "uuid"],
      ["p_revision", "integer"], ["p_request_id","uuid"],["p_prepare_token","uuid"],
    ],
    nh7_document_verify_v2: [["p_token", "uuid"]],
    nh7_document_expire_v2: [["p_id","uuid"],["p_expires_at","timestamptz"],["p_reason","text"]],
    nh7_document_deliver_v2: [["p_id", "uuid"]],
    nh7_document_revoke_v2: [
      ["p_id", "uuid"],
      ["p_reason", "text"],
    ],
    nh7_document_save_template_v2: [
      ["p_name", "text"],
      ["p_definition", "jsonb"],
    ],
  };
  let queue = Promise.resolve();
  function rpc(name, body = {}, uid = ADMIN) {
    const work = async () => {
      if (!signatures[name]) throw Error("Unknown test RPC");
      await db.exec("begin");
      try {
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
          uid || "",
        ]);
        await db.exec(
          uid ? "set local role authenticated" : "set local role anon",
        );
        const args = signatures[name];
        const result = await db.query(
          `select public.${name}(${args.map((a, i) => "$" + (i + 1) + "::" + a[1]).join(",")}) as result`,
          args.map(([key]) => body[key] ?? null),
        );
        await db.exec("commit");
        return result.rows[0].result;
      } catch (e) {
        await db.exec("rollback");
        throw e;
      }
    };
    const next = queue.then(work);
    queue = next.catch(() => {});
    return next;
  }
  return { db, rpc, baseline };
}
module.exports = { database, ADMIN, A, B, DELEGATE };
