/* New Hope 7 v3.4.3 — distinguish a real new signup from Supabase's obfuscated existing-user response */
(()=>{'use strict';
  if(window.__NH7_SIGNUP_GUARD_V343__) return;
  window.__NH7_SIGNUP_GUARD_V343__=true;
  const nativeFetch=window.fetch.bind(window);
  const target='https://gpzcwffxnddhaeaogdyo.supabase.co/auth/v1/signup';
  window.fetch=async function(input,init){
    const response=await nativeFetch(input,init);
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      const method=String(init?.method||input?.method||'GET').toUpperCase();
      if(method!=='POST'||!String(url).startsWith(target)||!response.ok) return response;
      const data=await response.clone().json();
      const identities=Array.isArray(data?.user?.identities)?data.user.identities:null;
      if(data?.user&&!data?.access_token&&identities&&identities.length===0){
        return new Response(JSON.stringify({code:'user_already_exists',message:'User already registered'}),{
          status:422,
          statusText:'Unprocessable Entity',
          headers:{'Content-Type':'application/json'}
        });
      }
    }catch(error){
      console.warn('NH7 signup guard skipped',error);
    }
    return response;
  };
  window.NH7_AUTH_SIGNUP_GUARD_VERSION='3.4.3';
})();
