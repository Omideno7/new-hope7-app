/* New Hope 7 Q&A multilingual bridge v3.4.1
   Isolated to Q&A network responses. No other app routes are changed.
*/
(()=>{
  'use strict';
  const VERSION='3.4.1-qna-i18n';
  const priorFetch=window.fetch.bind(window);

  function currentLang(){
    const v=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();
    return ['fa','en','hr'].includes(v)?v:'en';
  }
  function urlOf(input){
    try{return typeof input==='string'?input:(input?.url||String(input||''))}catch(_){return''}
  }
  function methodOf(input,init){
    return String(init?.method||input?.method||'GET').toUpperCase();
  }
  function mergedHeaders(input,init){
    const h=new Headers();
    try{if(input instanceof Request)input.headers.forEach((v,k)=>h.set(k,v))}catch(_){}
    try{new Headers(init?.headers||{}).forEach((v,k)=>h.set(k,v))}catch(_){}
    return h;
  }
  function restResource(u){
    const marker='/rest/v1/';
    const i=u.pathname.indexOf(marker);
    return i<0?'':u.pathname.slice(i+marker.length).replace(/^\/+|\/+$/g,'');
  }
  function rpcUrl(restUrl,name){
    const u=new URL(restUrl,location.href);
    const marker='/rest/v1/';
    const i=u.pathname.indexOf(marker);
    if(i<0)throw new Error('Supabase REST endpoint unavailable');
    u.pathname=u.pathname.slice(0,i)+marker+'rpc/'+name;
    u.search='';
    return u.href;
  }
  function localizeRow(row,lang){
    if(!row||typeof row!=='object')return row;
    const q=String(row['question_'+lang]||'').trim();
    const a=String(row['answer_'+lang]||'').trim();
    return Object.assign({},row,{
      question_text:q||row.question_text||'',
      answer_text:a||row.answer_text||''
    });
  }
  async function localizeJsonResponse(res){
    if(!res?.ok)return res;
    let rows;
    try{rows=await res.clone().json()}catch(_){return res}
    if(!Array.isArray(rows))return res;
    const headers=new Headers(res.headers);
    headers.set('content-type','application/json; charset=utf-8');
    headers.set('cache-control','no-store');
    return new Response(JSON.stringify(rows.map(r=>localizeRow(r,currentLang()))),{
      status:res.status,
      statusText:res.statusText,
      headers
    });
  }

  window.fetch=async function(input,init={}){
    const raw=urlOf(input);
    let u=null;
    try{u=new URL(raw,location.href)}catch(_){return priorFetch(input,init)}
    const resource=restResource(u);
    const method=methodOf(input,init);

    // Public answered Q&A: use a PII-safe localized RPC.
    if(resource==='qa_questions' && method==='GET' && String(u.searchParams.get('status')||'')==='eq.answered'){
      const headers=mergedHeaders(input,init);
      headers.set('content-type','application/json');
      headers.set('cache-control','no-store');
      return priorFetch(rpcUrl(u.href,'nh7_public_answered_questions_i18n_v341'),{
        method:'POST',
        headers,
        body:JSON.stringify({p_limit:50,p_lang:currentLang()}),
        cache:'no-store'
      });
    }

    const res=await priorFetch(input,init);

    // Private "My questions" keeps existing authorization/device rules,
    // then replaces only the displayed Q&A text with the selected language.
    if(method==='POST' && resource==='rpc/nh7_my_questions_v220'){
      return localizeJsonResponse(res);
    }
    return res;
  };

  window.NH7_QNA_I18N_VERSION=VERSION;
  console.info('NH7 Q&A multilingual bridge active',VERSION);
})();