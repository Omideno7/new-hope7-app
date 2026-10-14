// REVIEW ONLY. Enable only after separately approved schema/provider/device gates.
import {handlers} from './edge.ts';
const names=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_ANON_KEY','ONESIGNAL_APP_ID','ONESIGNAL_REST_API_KEY','NH7_NOTIFICATION_EVENT_WORKER_SECRET','ONESIGNAL_IDENTITY_VERIFICATION_KEY'];
const env=Object.fromEntries(names.map(n=>[n,Deno.env.get(n)||'']));
const api=handlers(env);
// Select this entrypoint mode in reviewed function packaging, never client-controlled.
const mode=Deno.env.get('NH7_NOTIFICATION_FUNCTION_MODE');
if(!['campaign','events','binding'].includes(mode||''))throw Error('Explicit reviewed function mode required');
Deno.serve(mode==='events'?api.events:mode==='binding'?api.binding:api.campaign);
