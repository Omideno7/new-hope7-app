/* Isolated preflight bootstrap: real test configuration, no fake login, no production writes. */
(() => {
  'use strict';
  const policy = window.NH7_TEST_POLICY;
  if (!policy) throw new Error('NH7_TEST_POLICY_MISSING');
  const originalFetch = window.fetch.bind(window);
  const attempts = [];
  const key = 'sb_publishable_VR4ToI7LpDeQh780aEv45Q_jP3Yl_rI';
  const productionAnonPrefix='eyJ';
  function record(channel, raw, method, reason) {
    let path = '';
    try { const u = new URL(raw, location.href); path = u.origin + u.pathname; } catch (_) {}
    attempts.push({channel, method: String(method || 'GET'), path, reason});
    if (attempts.length > 100) attempts.shift();
  }
  function headerProblem(headers) {
    const h = new Headers(headers || {});
    if (h.has('x-http-method-override') || h.has('x-method-override')) return 'METHOD_OVERRIDE';
    if (h.has('apikey') && h.get('apikey') !== key) return 'WRONG_PROJECT_KEY';
    const token = (h.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return '';
    if (token === key) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'service_role') return 'PRIVILEGED_TOKEN';
      return payload.iss === policy.backend + '/auth/v1' || payload.ref === policy.projectRef ? '' : 'WRONG_PROJECT_TOKEN';
    } catch (_) { return 'INVALID_OR_DEMO_TOKEN'; }
  }
  function denied(reason) {
    return new Response(JSON.stringify({code:'NH7_TEST_' + reason,
      message:'Isolated QA: this action was blocked by the environment safety policy.'}),
      {status:403, headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
  function repairedHeaders(headers, decision){
    const h=new Headers(headers||{});
    if(decision?.testBackend){
      h.set('apikey',key);
      const token=(h.get('authorization')||'').replace(/^Bearer\s+/i,'');
      if(!token || token.startsWith(productionAnonPrefix)){ h.set('authorization','Bearer '+key); }
    }
    return h;
  }
  window.fetch = function(input, init) {
    const options = init || {}, raw = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    const method = options.method || input.method || 'GET';
    const mapped=policy.remap(raw,method,location.href);
    const decision = policy.decide(mapped, method, location.href);
    const headers=repairedHeaders(options.headers || input.headers,decision);
    const reason = !decision.allowed ? decision.reason : !decision.local ? headerProblem(headers) : '';
    if (reason) { record('fetch', raw, method, reason); return Promise.resolve(denied(reason)); }
    return originalFetch(mapped, {...options, headers, redirect:'error', ...(!decision.local ? {cache:'no-store', credentials:'omit'} : {})});
  };
  const xhrState = new WeakMap(), proto = XMLHttpRequest.prototype;
  const open = proto.open, send = proto.send, setHeader = proto.setRequestHeader;
  proto.open = function(method, raw, ...rest) {
    const mapped=policy.remap(String(raw),method,location.href);
    const decision = policy.decide(mapped, method, location.href);
    if (!decision.allowed) { record('xhr',raw,method,decision.reason); throw new DOMException('NH7_TEST_' + decision.reason,'SecurityError'); }
    xhrState.set(this,{raw:String(raw),mapped,method,local:decision.local,testBackend:decision.testBackend,headers:{}});
    return open.call(this,method,mapped,...rest);
  };
  proto.setRequestHeader = function(name, value) {
    const state=xhrState.get(this);
    if(state){
      state.headers[name]=value;
      if(state.testBackend && String(name).toLowerCase()==='apikey') value=key;
      if(state.testBackend && String(name).toLowerCase()==='authorization' && String(value).replace(/^Bearer\s+/i,'').startsWith(productionAnonPrefix)) value='Bearer '+key;
    }
    return setHeader.call(this,name,value);
  };
  proto.send = function(body) {
    const state=xhrState.get(this), reason=state && !state.local ? headerProblem(state.headers) : '';
    if(reason){record('xhr',state.raw,state.method,reason);throw new DOMException('NH7_TEST_'+reason,'SecurityError');}
    return send.call(this,body);
  };
  try { Object.defineProperty(navigator,'sendBeacon',{value:function(raw){record('beacon',raw,'POST','BLOCKED');return false;}}); } catch (_) {}
  for(const channel of ['WebSocket','EventSource']){
    if(!window[channel])continue;
    window[channel]=function(raw){record(channel,raw,'CONNECT','BLOCKED');throw new DOMException('NH7_TEST_BLOCKED','SecurityError');};
  }
  const originalOpen=window.open.bind(window);
  window.open=function(raw,...rest){const d=policy.decide(raw||'about:blank','GET',location.href);if(!d.allowed||!d.local){record('open',raw,'NAVIGATE','EXTERNAL_NAVIGATION');return null;}return originalOpen(raw,...rest);};
  function protectNative(){
    const cap=window.Capacitor;if(!cap||cap.__nh7TestGuard)return;
    for(const name of ['nativePromise','nativeCallback']){
      if(typeof cap[name]!=='function')continue;
      const original=cap[name].bind(cap);
      cap[name]=function(plugin,method,...args){
        if(!policy.nativeAllowed(plugin,method)){
          record('native',plugin+'/'+method,'NATIVE','NATIVE_SIDE_EFFECT_BLOCKED');
          const error=new Error('NH7_TEST_NATIVE_SIDE_EFFECT_BLOCKED');
          if(name==='nativePromise')return Promise.reject(error);
          const callback=args.find(arg=>typeof arg==='function');if(callback)queueMicrotask(()=>callback(null,error));return 'nh7-test-blocked';
        }
        return original(plugin,method,...args);
      };
    }
    cap.__nh7TestGuard=true;
  }
  protectNative();document.addEventListener('deviceready',protectNative,{once:true});
  if(policy.allowedPage(location.href)){
    try{
      const session=JSON.parse(localStorage.getItem('nh7_user_session_v170')||'null');
      if(session?.access_token==='preview-access-token'){
        localStorage.removeItem('nh7_user_session_v170');
        if(localStorage.getItem('nh7_manual_email')==='preview.member@example.invalid')localStorage.removeItem('nh7_manual_email');
        const school=JSON.parse(localStorage.getItem('nh7_school_access')||'null');
        if(school?.email==='preview.member@example.invalid')localStorage.removeItem('nh7_school_access');
      }
    }catch(_){}
  }
  Object.defineProperty(window,'NH7_TEST_STATUS',{value:Object.freeze({build:policy.build,projectRef:policy.projectRef,readOnly:false,readyForRealAccount:true,blocked:()=>attempts.slice()})});
  window.NH7_PRIVATE_PREVIEW=true;
  document.addEventListener('click',event=>{
    const a=event.target.closest?.('a[href]');if(!a)return;
    const d=policy.decide(a.href,'GET',location.href);
    if(!d.allowed||!d.local){event.preventDefault();event.stopImmediatePropagation();record('link',a.href,'NAVIGATE','EXTERNAL_NAVIGATION');}
  },true);
  document.addEventListener('DOMContentLoaded',()=>{
    protectNative();
    if(!policy.allowedPage(location.href)){
      document.body.replaceChildren();const p=document.createElement('p');p.textContent='This isolated test build cannot run on an unapproved or production host.';document.body.append(p);return;
    }
    const banner=document.createElement('aside');banner.className='nh7-test-banner';banner.setAttribute('aria-label','Test environment status');
    banner.innerHTML='<strong>NEW HOPE 7 TEST · 23</strong><span>محیط تست مستقل؛ تغییرات شما فقط در دیتابیس تست ذخیره می‌شود.</span>';
    document.body.prepend(banner);
    const measure=()=>document.documentElement.style.setProperty('--nh7-test-banner-height',banner.getBoundingClientRect().height+'px');
    if(window.ResizeObserver)new ResizeObserver(measure).observe(banner);measure();
  });
})();
