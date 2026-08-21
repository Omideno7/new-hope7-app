import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const reset=read('reset-password.html');
const adminReset=read('admin-reset-password.html');
const admin=read('admin.html');
const stable=read('admin-v239-stable.html');
const rbac=read('js/nh7-admin-rbac-v350.js');
const worker=read('sw-offline-v329.js');
const migration=read('supabase/migrations/20260821174931_admin_rbac_recovery_v350.sql');
const version=JSON.parse(read('version.json'));

assert(version.app==='2.3.9.40'&&version.admin==='2.3.9.40','release version must be 2.3.9.40');

assert(!reset.includes('id="openAdmin"'),'public recovery still exposes an admin button');
assert(!reset.includes("const ADMIN_URL="),'public recovery still contains the admin URL');
assert(!reset.includes("admin:'Admin login'"),'public recovery still contains an admin-login label');
assert(reset.includes('ownerTokenBlocked()'),'public user recovery does not block the panel owner account');
assert(reset.includes("location.replace(ADMIN_RESET_URL+'#'+fragment.toString())"),'owner recovery token is not forwarded to the isolated owner page');
assert(reset.indexOf("verifyTokenHash(tokenHash,'recovery')")<reset.indexOf('if(accessToken&&ownerTokenBlocked())'),'token-hash owner recovery is not routed before the user password form');
assert(reset.includes("if(email===OWNER_EMAIL)return show(t('adminBlocked')"),'public recovery can still request an owner-password email');
assert(reset.includes("/auth/v1/recover?redirect_to='+encodeURIComponent(RESET_URL)"),'user recovery callback is not sent as a query parameter');

assert(adminReset.includes('<meta name="referrer" content="no-referrer">'),'admin recovery can leak its token through referrers');
assert(adminReset.indexOf('window.__NH7_ADMIN_RESET_PAYLOAD__')<adminReset.indexOf('src="assets/admin-icon-192.png"'),'admin recovery must capture and scrub tokens before loading assets');
assert(adminReset.includes("payload.type!=='recovery'"),'admin recovery must reject non-recovery callbacks');
assert(adminReset.includes("body:{token_hash:tokenHash,type:'recovery'}"),'admin token_hash verification is missing');
assert(adminReset.includes("/rest/v1/rpc/nh7_admin_my_access_v350"),'admin recovery does not verify server-side role');
assert(adminReset.includes('access.is_owner!==true'),'admin recovery must require strict owner access');
assert(adminReset.indexOf('nh7_admin_my_access_v350')<adminReset.indexOf("'/auth/v1/user'"),'owner check must occur before the password update endpoint');
assert(!adminReset.includes('/auth/v1/recover'),'admin recovery page must not offer public resend');
assert(adminReset.includes("localStorage.removeItem('nh7_admin_token')")&&adminReset.includes("localStorage.removeItem('nh7_admin_refresh_token')"),'admin recovery does not clear prior admin sessions');

assert(admin.includes("const NH7_ADMIN_PASSWORD_RESET_URL=NH7_PUBLIC_ROOT+'reset-password.html'"),'admin recovery does not use the established allowlisted callback bridge');
assert(admin.includes("body:JSON.stringify({email:NH7_OWNER_EMAIL})"),'admin recovery request is not fixed to the owner email');
assert(!admin.includes('id="adminResetEmail"'),'owner recovery email is still editable');
assert(!admin.includes('if(token)loadAll(true)'),'base admin loads broad data before RBAC preflight');
assert(!admin.includes("refreshTimer=setInterval(()=>{if(token"),'base admin still starts its broad refresh timer');
assert(admin.includes("let nh7PendingAdminToken=localStorage.getItem('nh7_admin_token')||''")&&admin.includes("let token='';"),'base admin does not synchronously quarantine restored credentials');
assert(admin.includes('id="nh7AdminRbacRuntime" defer'),'direct admin page does not load the RBAC runtime last');

assert(stable.includes('html.replace(/\\s*<script id="nh7AdminRbacRuntime"'),'stable wrapper does not remove the early direct RBAC script');
assert(stable.includes('js/nh7-admin-rbac-v350.js?v=${BUILD}'),'stable wrapper does not insert RBAC after legacy patches');
assert(stable.includes('&&window.NH7_ADMIN_RBAC_VERSION'),'stable module check omits RBAC');

for(const expected of ['nh7_admin_my_access_v350','nh7_owner_set_admin_permissions_v350','nh7_admin_registration_feed_v350','nh7_admin_registration_review_v350','nh7_admin_registration_delete_v350','nh7_admin_registration_cleanup_v350'])assert(rbac.includes(expected),`RBAC runtime is missing ${expected}`);
assert(rbac.includes("token='';\nrefreshToken='';"),'persisted tokens are not synchronously quarantined');
assert(rbac.includes("accessToken:typeof nh7PendingAdminToken==='string'?nh7PendingAdminToken"),'RBAC runtime does not safely claim the quarantined token');
assert(rbac.includes("if(mode==='owner'&&legacy.authFetch)"),'legacy data API is not owner-only');
assert(rbac.includes("if(!['requests','approved'].includes(tab))tab='requests'"),'delegated tabs are not restricted');
assert(!rbac.includes("nh7-send-email"),'delegated RBAC runtime must not call the official email function');
assert(!rbac.includes('encodeURIComponent(rowEmail(row))'),'delegate cleanup still embeds an email inside inline JavaScript');

assert(migration.includes('create schema if not exists private'),'private RBAC schema is missing');
assert(migration.includes('enable row level security'),'RBAC tables do not enable RLS');
assert(migration.includes('revoke all on schema private from public, anon, authenticated'),'private schema grants are not revoked');
assert(migration.includes('grant execute on function public.nh7_admin_registration_feed_v350(integer,integer,text,text) to authenticated'),'scoped feed RPC is not granted to authenticated sessions');
assert(!migration.includes('create or replace function public.nh7_is_admin'),'legacy owner-only helper must not be broadened');
assert(migration.includes('public.nh7_is_admin()')&&migration.includes("nullif(current_setting('app.settings.nh7_admin_email',true),''"),'recreated owner accounts do not have a safe legacy-owner fallback');
assert(migration.includes("coalesce(r.payload,'{}'::jsonb) - array["),'delegated feed does not remove internal registration metadata');
assert(!migration.includes('return to_jsonb(v_row)'),'review RPC still returns the unredacted registration row');
assert(migration.includes('u.email_confirmed_at is not null'),'unconfirmed accounts can receive delegated admin access');
for(const indexName of ['nh7_admin_members_v350_created_by_idx','nh7_admin_permission_grants_v350_permission_idx','nh7_admin_permission_grants_v350_granted_by_idx','nh7_admin_audit_log_v350_actor_idx','nh7_admin_audit_log_v350_target_idx'])assert(migration.includes(indexName),`missing foreign-key index ${indexName}`);

assert(worker.includes("function recoveryRequest(url)"),'recovery pages do not have an explicit network-first route');
assert(worker.indexOf('if(recoveryRequest(url))')<worker.indexOf('if(adminRequest(url))'),'recovery navigation is not handled before generic admin/navigation caching');
assert(worker.includes("rel==='admin-reset-password.html'"),'admin recovery page is not network-first');
assert(worker.includes("rel.startsWith('js/nh7-admin-')"),'RBAC runtime is not network-first');

console.log('Admin recovery and RBAC v3.5.0 verification passed.');
