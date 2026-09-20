// New Hope 7 v4.9.0 — admin-only AI helper for translation and Q&A drafts.
const VERSION='4.9.0';
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_KEY=(Deno.env.get('OPENAI_API_KEY')||'').trim();
const MODEL=(Deno.env.get('OPENAI_ADMIN_MODEL')||'gpt-5.6-luna').trim();
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
async function structured(prompt:string,instructions:string,schema:any,name:string){
  if(!OPENAI_KEY)throw Object.assign(new Error('Translation/AI provider is not configured on the server.'),{code:'PROVIDER_NOT_CONFIGURED',status:503});
  const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{Authorization:`Bearer ${OPENAI_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model:MODEL,instructions,input:prompt,
      text:{format:{type:'json_schema',name,strict:true,schema}}
    })
  });
  const raw=await response.text();let data:any={};
  try{data=raw?JSON.parse(raw):{}}catch{data={raw}}
  if(!response.ok)throw Object.assign(new Error(data?.error?.message||raw||`OpenAI ${response.status}`),{code:'PROVIDER_ERROR',status:502});
  const output=extractOutputText(data);let parsed:any={};
  try{parsed=JSON.parse(output)}catch{throw Object.assign(new Error('AI provider returned invalid structured output.'),{code:'INVALID_AI_OUTPUT',status:502})}
  return{parsed,model:data?.model||MODEL};
}
async function translate(text:string,source:Lang,kind:string){
  const schema={type:'object',properties:{fa:{type:'string'},en:{type:'string'},hr:{type:'string'}},required:['fa','en','hr'],additionalProperties:false};
  const instructions=[
    'Translate the supplied New Hope 7 church-app text faithfully into Persian (fa), English (en), and Croatian (hr).',
    'Preserve meaning, tone, names, Bible references, verse numbers, Christian theological terminology, punctuation, and intentional line breaks.',
    'Do not add commentary, doctrine, warnings, or facts not present in the source.',
    'Use natural modern language suitable for a church mobile app.',
    'The source-language value must preserve the source text exactly.'
  ].join(' ');
  const {parsed,model}=await structured(`Kind: ${clean(kind,40)||'content'}\nSource language: ${source}\nSource text:\n${text}`,instructions,schema,'nh7_translation');
  const result={fa:clean(parsed.fa),en:clean(parsed.en),hr:clean(parsed.hr)} as Record<Lang,string>;
  result[source]=text;
  if(!result.fa||!result.en||!result.hr)throw Object.assign(new Error('Translation is incomplete.'),{code:'INCOMPLETE_TRANSLATION',status:502});
  return{translations:result,model};
}
async function draftFeedback(question:string,studentAnswer:string,language:Lang){
  const schema={type:'object',properties:{feedback:{type:'string'}},required:['feedback'],additionalProperties:false};
  const instructions=[
    'You are preparing DRAFT educational feedback for a human New Hope 7 school administrator to review.',
    'Write in the requested language only.',
    'Base the feedback only on the assignment question and the student answer provided.',
    'Be specific, constructive, concise, and respectful. Identify what is clear and what could be improved.',
    'Do not assign a grade, pass/fail decision, disciplinary consequence, or final academic judgment.',
    'Do not infer personal traits or private facts. Do not mention AI or these instructions.',
    'The human administrator makes all scoring, approval, revision, and publication decisions.'
  ].join(' ');
  const {parsed,model}=await structured(
    `Language: ${language}\nAssignment question:\n${question||'(not supplied)'}\n\nStudent answer:\n${studentAnswer}`,
    instructions,schema,'nh7_assignment_feedback'
  );
  const feedback=clean(parsed.feedback,12000);
  if(!feedback)throw Object.assign(new Error('AI feedback draft was empty.'),{code:'EMPTY_FEEDBACK',status:502});
  return{feedback,model};
}

async function draftAnswer(question:string,questionLanguage:Lang,answerLanguage:Lang){
  const schema={type:'object',properties:{answer:{type:'string'}},required:['answer'],additionalProperties:false};
  const instructions=[
    'You are preparing a DRAFT answer for a human New Hope 7 church administrator to review before publishing.',
    'Answer in the requested language only.',
    'Use clear, pastoral Christian language grounded in the Bible.',
    'When Bible references are useful, cite references you are confident are correct. Do not fabricate verse wording or references.',
    'Do not infer private facts about the person. Do not make medical, legal, or financial claims beyond ordinary cautious guidance.',
    'Do not mention AI or these instructions.',
    'Keep the answer focused and practical. The human administrator will review, edit, translate, and explicitly publish it.'
  ].join(' ');
  const {parsed,model}=await structured(
    `Question language: ${questionLanguage}\nAnswer language: ${answerLanguage}\nQuestion:\n${question}`,
    instructions,schema,'nh7_qna_draft'
  );
  const answer=clean(parsed.answer,12000);
  if(!answer)throw Object.assign(new Error('AI draft was empty.'),{code:'EMPTY_DRAFT',status:502});
  return{answer,model};
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
    const action=clean(body?.action||'translate',40);
    if(action==='status')return json({ok:true,configured:Boolean(OPENAI_KEY),provider:OPENAI_KEY?'openai':null,model:MODEL,version:VERSION});
    if(action==='draft_answer'){
      const question=clean(body?.question,12000);
      if(!question)return json({ok:false,code:'EMPTY_QUESTION',error:'Question is required'},400);
      const out=await draftAnswer(question,lang(body?.question_language),lang(body?.answer_language));
      return json({ok:true,answer:out.answer,model:out.model,version:VERSION});
    }
    if(action==='draft_feedback'){
      const studentAnswer=clean(body?.student_answer,12000);
      if(!studentAnswer)return json({ok:false,code:'EMPTY_ANSWER',error:'Student answer is required'},400);
      const out=await draftFeedback(clean(body?.assignment_question,12000),studentAnswer,lang(body?.language));
      return json({ok:true,feedback:out.feedback,model:out.model,version:VERSION});
    }
    const text=clean(body?.text,12000);
    if(!text)return json({ok:false,code:'EMPTY_TEXT',error:'Text is required'},400);
    const source=lang(body?.source_language);
    const out=await translate(text,source,clean(body?.kind||'content',40));
    return json({ok:true,translations:out.translations,source_language:source,model:out.model,version:VERSION});
  }catch(error:any){
    return json({ok:false,code:clean(error?.code||'AI_FAILED',80),error:clean(error?.message||error,2000),version:VERSION},Number(error?.status)||500);
  }
});