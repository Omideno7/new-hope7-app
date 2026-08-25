import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const version=JSON.parse(read('version.json'));
const index=read('index.html');
const legacyRegistration=read('js/nh7-school-registration-v342.js');
const canonical=read('js/nh7-registration-canonical-v353.js');
const recovery=read('js/nh7-auth-recovery-v342.js');
const app=read('js/app.js');
const reset=read('reset-password.html');
const finalQa=fs.existsSync('qa/final-20260825/app.html')?read('qa/final-20260825/app.html'):'';
const beforeMigration=read('supabase/migrations/20260824190500_block_incomplete_auth_signup_v355.sql');
const afterMigration=read('supabase/migrations/20260824171500_atomic_complete_school_signup_v356.sql');

assert(index.includes(`window.NH7_VERSION = '${version.app}'`),'production shell version must match version.json');
assert(index.indexOf('js/nh7-auth-recovery-v342.js')<index.indexOf('js/app.js'),'recovery capture must load before app bootstrap');
assert(index.includes('js/nh7-school-registration-v342.js'),'registration compatibility loader is missing');
assert(legacyRegistration.includes('3.5.3-legacy-disabled'),'legacy registration route must remain disabled');
assert(legacyRegistration.includes('nh7-registration-canonical-v353.js'),'legacy route must delegate to canonical registration');

assert(canonical.includes("const CANONICAL='3.5.3'"),'canonical registration version is missing');
assert(canonical.includes("const REQUIRED=['firstName','lastName','birthDate','city','country','spiritualAge','churchMember','waterBaptism','salvationPrayer','eventsInterest','testimony','howFound','phone','email']"),'complete School registration field list is missing');
assert(canonical.includes("String(url).startsWith(SUPABASE+'/auth/v1/signup')"),'absolute client signup guard is missing');
assert(canonical.includes('canonical_registration_required'),'incomplete-signup rejection is missing');
assert(canonical.includes('nh7_registration_version:CANONICAL'),'canonical signup metadata marker is missing');
assert(canonical.includes('school_registration:Object.assign'),'complete School packet is not attached to Auth signup');
assert(canonical.includes("/auth/v1/recover?redirect_to="),'existing-account recovery redirect query is missing');
assert(canonical.includes("/rest/v1/rpc/nh7_submit_registration_v3"),'canonical registration RPC is missing');

assert(recovery.includes("redirectPath('/auth/v1/recover')"),'recovery redirect query helper is missing');
assert(recovery.includes("if(type&&type!=='recovery')return null"),'non-recovery callbacks must not open password reset');
assert(recovery.includes('history.replaceState'),'recovery callback URL must be scrubbed');
assert(reset.includes('<meta name="referrer" content="no-referrer">'),'standalone reset page must disable referrer leakage');
assert(reset.includes('/auth/v1/recover?redirect_to='),'standalone recovery must use redirect_to query');
assert(app.includes("recover?redirect_to='+encodeURIComponent(NH7_PASSWORD_RESET_URL)"),'app recovery redirect query is missing');
assert(!app.includes('Registration RPC unavailable; using compatible fallback'),'unsafe registration fallback must not remain');

assert(beforeMigration.includes('nh7_auth_require_complete_school_signup_v355'),'server-side BEFORE INSERT registration guard migration is missing');
assert(beforeMigration.includes('NH7_COMPLETE_REGISTRATION_REQUIRED'),'server-side incomplete registration rejection marker is missing');
assert(afterMigration.includes('nh7_auth_create_school_registration_v356'),'atomic School registration trigger migration is missing');
assert(afterMigration.includes("insert into public.registrations"),'atomic School registration insert is missing');
assert(afterMigration.includes("revoke all on function public.nh7_create_school_registration_from_auth_v356() from public, anon, authenticated"),'atomic trigger function execute privileges are not revoked');

if(finalQa){
  assert(finalQa.includes('js/nh7-registration-canonical-v353.js'),'Final QA must load canonical registration directly');
  assert(finalQa.includes('js/nh7-auth-signup-guard-v343.js'),'Final QA must load latest signup guard');
  assert(finalQa.includes('js/nh7-auth-recovery-v342.js'),'Final QA must load latest recovery module');
  assert(finalQa.includes("window.NH7_DISABLE_PREVIEW_SERVICE_WORKER=true"),'Final QA must disable production service-worker registration');
}

console.log('Final auth/registration verifier v3.7.0 passed for app',version.app);
