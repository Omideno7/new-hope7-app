/* New Hope 7 v3.2.9 — resolve relative cache keys inside the installed project scope */
canonicalRequest=function nh7CanonicalScopedRequest(raw){
  const source=typeof raw==='string'?raw:raw?.url||'';
  const url=new URL(source,self.registration.scope);
  return new Request(url.origin+url.pathname,{method:'GET'});
};
