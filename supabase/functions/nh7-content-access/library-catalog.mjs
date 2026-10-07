/** Review-only replacement for the Library branch AFTER the existing School approval gate.
 * No service-role client, client identity hints, or DB changes are used here.
 * The deployed index.ts is not in this repository; see the deployment review gate.
 */
export function filterLibraryCatalog(rows, query='') {
  const params=new URLSearchParams(query);
  let items=rows;
  for(const [field,filter] of params){
    if(['select','order','limit','offset'].includes(field))continue;
    if(!/^[a-z_]+$/.test(field))throw new Error('unsupported_library_filter');
    if(filter.startsWith('eq.'))items=items.filter(row=>String(row[field])===filter.slice(3));
    else if(filter.startsWith('is.'))items=items.filter(row=>String(row[field])===filter.slice(3));
    else throw new Error('unsupported_library_filter');
  }
  const order=params.get('order');
  if(order){const [field,direction]=order.split('.');items=[...items].sort((a,b)=>String(a[field]??'').localeCompare(String(b[field]??''))*(direction==='desc'?-1:1))}
  const offset=Math.max(0,Number(params.get('offset'))||0),limit=params.get('limit');
  items=items.slice(offset,limit===null?undefined:offset+Math.max(0,Number(limit)||0));
  const select=params.get('select');
  if(select&&select!=='*'){
    const fields=select.split(',');if(!fields.every(field=>/^[a-z_]+$/.test(field)))throw new Error('unsupported_library_projection');
    items=items.map(row=>Object.fromEntries(fields.filter(field=>Object.hasOwn(row,field)).map(field=>[field,row[field]])));
  }
  return items;
}
export async function libraryCatalog(request, payload, {supabaseUrl,publishableKey,corsHeaders={},fetcher=fetch}) {
  const headers={...corsHeaders,'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','Vary':'Authorization, Origin'};
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  const bearer=request.headers.get('Authorization')||'';
  if(!/^Bearer\s+\S+$/i.test(bearer))return reply({error:'login_required'},401);
  const upstreamHeaders={apikey:publishableKey,Authorization:bearer,'Content-Type':'application/json'};
  try{
    const userResponse=await fetcher(supabaseUrl+'/auth/v1/user',{headers:upstreamHeaders,cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!userResponse.ok)return reply({error:'login_required'},401);
    const user=await userResponse.json();if(!user?.id)return reply({error:'login_required'},401);
    // Forward the validated caller JWT, NOT a service-role JWT: auth.uid() is the caller.
    const response=await fetcher(supabaseUrl+'/rest/v1/rpc/nh7_library_catalog_v396',{method:'POST',headers:upstreamHeaders,body:'{}',cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)return reply({error:'library_access_denied'},response.status===401?401:403);
    const raw=await response.json(),bundle=Array.isArray(raw)?raw[0]:raw;
    if(bundle?.allowed===false)return reply({error:'library_access_denied'},403);
    const items=filterLibraryCatalog(Array.isArray(bundle?.items)?bundle.items:[],String(payload.query||''));
    return reply({items,user_email:user.email||''});
  }catch(error){return reply({error:error.message?.startsWith('unsupported_library_')?error.message:'library_catalog_unavailable'},error.message?.startsWith('unsupported_library_')?400:503)}
}
