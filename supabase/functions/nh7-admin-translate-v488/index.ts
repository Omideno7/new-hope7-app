// New Hope 7 v4.8.8 — admin-only FA/EN/HR translation service.
const VERSION='4.8.8';
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_KEY=(Deno.env.get('OPENAI_API_KEY')||'').trim();
const MODEL=(Deno.env.get('OPENAI_TRANSLATE_MODEL')||'gpt-5.6-luna').trim();
const CORS={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:CORS});
const clean=(v:unknown,max=12000)=>String(v??'').trim().slice(0,max);
type Lang='fa'|'en'|'hr';
function lang(v:unknown):Lang{const s=clean(v,5).toLowerCase();return s==='fa'||s==='hr'?s:'en'}
function publicKey(){return Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||SERVICE_KEY}
async function adminIdentity(jwt:string){
  const key=publicKey();
  const userRes=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:key,Authorization:`Bearer ${jwt}`}});
  if(!userRes.ok)return null;
  const user=await userRes.json();
  const adminRes=await fetch(SUPABASE_URL+'/rest/v1/rpc/nh7_is_admin',{
    method:'POST',headers:{apikey:key,Authorization:`Bearer ${jwt}`,'Content-Type':'application/json'},body:'{}'
  });
  if(!adminRes.ok||await adminRes.json()!==true)return null;
  return{id:clean(user?.id,80),email:clean(user?.email,320).toLowerCase()};
}
function extractOutputText(data:any){
  if(typeof data?.output_text==='string'&&data.output_text.trim())return data.output_text.trim();
  for(const item of Array.isArray(data?.output)?data.output:[]){
    for(const part of Array.isArray(item?.content)?item.content:[]){
      if(typeof part?.text==='string'&&part.text.trim())return part.text.trim();
    }
  }
  return'';
}
async function translate(text:string,source:Lang,kind:string){
  if(!OPENAI_KEY)throw Object.assign(new Error('Translation provider is not configured on the server.'),{code:'PROVIDER_NOT_CONFIGURED',status:503});
  const schema={
    type:'object',
    properties:{fa:{type:'string'},en:{type:'string'},hr:{type:'string'}},
    required:['fa','en','hr'],additionalProperties:false
  };
  const instructions=[
    'Translate the supplied church-app Q&A text faithfully into Persian (fa), English (en), and Croatian (hr).',
    'Preserve meaning, tone, names, Bible references, verse numbers, quoted scripture references, and Christian theological terminology.',
    'Do not add explanations, doctrine, warnings, commentary, or facts that are not in the source.',
    'Use natural modern language suitable for a church mobile app.',
    'Return all three languages. The source-language value must preserve the source text exactly.'
  ].join(' ');
  const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{Authorization:`Bearer ${OPENAI_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model:MODEL,
      instructions,
      input:`Kind: ${clean(kind,30)||'qna'}\nSource language: ${source}\nSource text:\n${text}`,
      text:{format:{type:'json_schema',name:'nh7_translation',strict:true,schema}}
    })
  });
  const raw=await response.text();let data:any={};
  try{data=raw?JSON.parse(raw):{}}catch{data={raw}}
  if(!response.ok)throw Object.assign(new Error(data?.error?.message||raw||`OpenAI ${response.status}`),{code:'PROVIDER_ERROR',status:502});
  const output=extractOutputText(data);let parsed:any={};
  try{parsed=JSON.parse(output)}catch{throw Object.assign(new Error('Translation provider returned invalid JSON.'),{code:'INVALID_TRANSLATION',status:502})}
  const result={fa:clean(parsed.fa),en:clean(parsed.en),hr:clean(parsed.hr)};
  result[source]=text;
  if(!result.fa||!result.en||!result.hr)throw Object.assign(new Error('Translation provider returned an incomplete result.'),{code:'INCOMPLETE_TRANSLATION',status:502});
  return result;
}
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
  if(req.method!=='POST')return json({ok:false,error:'Method not allowed'},405);
  try{
    const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim();
    if(!jwt)return json({ok:false,code:'AUTH_REQUIRED',error:'Admin authentication required'},401);
    const admin=await adminIdentity(jwt);
    if(!admin)return json({ok:false,code:'ADMIN_REQUIRED',error:'Admin access required'},403);
    const body=await req.json().catch(()=>({}));
    if(String(body?.action||'')==='status')return json({ok:true,configured:Boolean(OPENAI_KEY),provider:OPENAI_KEY?'openai':null,version:VERSION});
    const source=lang(body?.source_language);
    const text=clean(body?.text);
    const kind=clean(body?.kind||'qna',30);
    if(text.length<1)return json({ok:false,code:'EMPTY_TEXT',error:'Text is required'},400);
    if(text.length>12000)return json({ok:false,code:'TEXT_TOO_LONG',error:'Text is too long'},400);
    const translations=await translate(text,source,kind);
    return json({ok:true,translations,source_language:source,provider:'openai',model:MODEL,version:VERSION});
  }catch(error:any){
    return json({ok:false,code:clean(error?.code||'TRANSLATE_FAILED',80),error:clean(error?.message||error,2000),version:VERSION},Number(error?.status)||500);
  }
});