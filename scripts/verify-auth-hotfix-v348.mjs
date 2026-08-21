import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const index=read('index.html');
const app=read('js/app.js');
const recovery=read('js/nh7-auth-recovery-v342.js');
const registration=read('js/nh7-school-registration-v342.js');
const reset=read('reset-password.html');
const admin=read('admin.html');
const adminRequests=read('js/admin-v2.3.9-registration-requests-v331.js');
const worker=read('sw-offline-v329.js');
const workflow=read('.github/workflows/deploy-pages.yml');
const compatibilityMigration=read('supabase/migrations/20260821163811_auth_registration_compatibility_v349.sql');
const version=JSON.parse(read('version.json'));

assert(version.app==='2.3.9.39'&&version.admin==='2.3.9.39','production version must be 2.3.9.39');
assert(index.indexOf('js/nh7-auth-recovery-v342.js')<index.indexOf('js/app.js'),'recovery capture must load before app bootstrap');
assert(index.includes('js/nh7-school-registration-v342.js?v=2.3.9.39'),'hardened registration module is not loaded');
assert(!recovery.includes("request('/auth/v1/recover',{body:"),'recovery must not use the endpoint without redirect_to query');
assert(recovery.includes("redirectPath('/auth/v1/recover')"),'recovery redirect query helper is missing');
assert(recovery.includes("if(type&&type!=='recovery')return null"),'non-recovery auth callbacks must not open the password reset dialog');
assert(recovery.includes('if(permanentRecoveryError(error)){payload.accessToken=\'\';payload.tokenHash=\'\';showFreshLink(modal)}'),'retryable password errors must preserve the recovery session');
assert(recovery.includes('history.replaceState')&&recovery.indexOf('history.replaceState')<recovery.indexOf('openInlineRecovery'),'sensitive recovery URL must be scrubbed before UI startup');
assert(recovery.includes("verify',{body:{token_hash:payload.tokenHash,type:'recovery'}}"),'token_hash recovery verification is missing');
assert(recovery.lastIndexOf('recoveryAccessToken(payload)')>recovery.indexOf('savePassword(modal,payload)'),'token_hash must be consumed only on save');
assert(recovery.includes("localStorage.removeItem(SESSION)")&&recovery.includes("localStorage.setItem(LOGOUT,'1')"),'stale local session is not cleared after recovery');

assert(reset.includes('<meta name="referrer" content="no-referrer">'),'standalone recovery must disable referrer leakage');
assert(reset.indexOf('window.__NH7_RESET_PAYLOAD__')<reset.indexOf('src="assets/logo.png"'),'standalone recovery must capture/scrub tokens before subresource loading');
assert(reset.includes("/auth/v1/recover?redirect_to="),'standalone recovery redirect must be a query parameter');
assert(!reset.includes("body:{email,redirect_to:RESET_URL}"),'legacy reset redirect body must not remain');
assert(reset.includes("if(!['recovery','signup','email_change'].includes(type))"),'standalone page must reject explicit non-recovery auth callbacks');
assert(reset.includes("if(permanentRecoveryError(error)){accessToken='';tokenHash='';showResend()}"),'standalone retryable password errors must preserve the recovery session');

assert(registration.includes('passwordResetRequired:true'),'existing account recovery state is missing');
assert(registration.includes('sendPasswordRecovery(email)'),'existing account must receive a recovery email');
assert(registration.includes('created?.user?.identities')&&registration.includes('identities.length===0'),'obfuscated existing Supabase accounts are not detected');
assert(registration.indexOf('account=await ensureAccount')<registration.indexOf('result=await submitRpc'),'account check must precede the registration RPC');
assert(registration.includes('درخواست ثبت‌نام شما با موفقیت ذخیره شد'),'Persian saved-request recovery guidance is missing');
assert(registration.includes('Your registration request was saved'),'English saved-request recovery guidance is missing');
assert(registration.includes('Vaš zahtjev za registraciju je spremljen'),'Croatian saved-request recovery guidance is missing');

assert(app.includes("recover?redirect_to='+encodeURIComponent(NH7_PASSWORD_RESET_URL)"),'app recovery redirect query is missing');
assert(!app.includes("body:JSON.stringify({email,redirect_to:NH7_PASSWORD_RESET_URL})"),'app still sends redirect_to in the body');
assert(!app.includes('Registration RPC unavailable; using compatible fallback'),'unsafe direct registration fallback remains');
assert(app.includes('created?.user?.identities')&&app.includes('identities.length===0'),'generic registration does not detect obfuscated existing accounts');
assert(admin.includes("/auth/v1/recover?redirect_to='+encodeURIComponent(NH7_PASSWORD_RESET_URL)"),'admin recovery redirect query is missing');
assert(adminRequests.includes('فقط پروندهٔ ثبت‌نام حذف می‌شود'),'admin delete action is not described as record-only');

assert(worker.includes("'./reset-password.html'"),'standalone recovery page is not cached');
for(const file of ['nh7-auth-signup-guard-v343.js','nh7-school-registration-v342.js','nh7-auth-recovery-v342.js'])assert(worker.includes(file),`${file} is not cached`);
assert(workflow.includes('verify-auth-hotfix-v348.mjs'),'Pages workflow does not run the auth verification');
assert(compatibilityMigration.includes('drop trigger if exists trg_nh7_guard_approved_registration_update_v348'),'v3.4.9 compatibility migration must remove the over-broad approved-record guard');

console.log('Auth hotfix v3.4.8 verification passed.');
