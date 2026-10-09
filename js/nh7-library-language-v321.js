/* Option B: UID/language-scoped PUBLIC reader cache; Ministers always online + v321 authorization. */
(() => {
  'use strict';
  const VERSION = '125.2-library-public-offline',
    CACHE = 'nh7reader-public-v125',
    LEGACY = 'nh7reader-offline-v327';
  if (window.fetch?.__nh7LibraryLanguageV125) return;
  const original = window.fetch.bind(window);
  const key = (uid, id, language) =>
    new Request(
      new URL(
        '__nh7_reader_public_v125__/' +
          [uid, id, language].map(encodeURIComponent).join('/'),
        location.href,
      ).href,
    );
  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }
  const denial = () =>
    Response.json(
      { allowed: false, code: 'content_access_required' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    );
  const offlineMiss = () => Response.json({allowed:false,code:'library_offline_unavailable'}, {status:503});
  // Dedicated PUBLIC-only IndexedDB store works without WKWebView CacheStorage.
  // All transactions complete before ready/open succeeds. No unrelated databases are touched.
  const DB='nh7-reader-public-v125', STORE='readers';
  let dbPromise, maintenance=Promise.resolve();
  function database(){
    if(!window.indexedDB)return Promise.reject(new Error('indexeddb_unavailable'));
    if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB,1);
      request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'key'});
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    return dbPromise;
  }
  async function transaction(mode,work){
    const db=await database();return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);let result;
      work(store,value=>result=value);
      tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(tx.error||new Error('reader_store_failed'));
    });
  }
  const recordKey=(owner,id,language)=>JSON.stringify([owner,String(id),language]);
  async function prune(owner,allowed=null){
    await transaction('readwrite',store=>{
      const request=store.openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;
        const row=cursor.value;if(!owner||row.uid!==owner||(allowed&&!allowed.has(row.item)))cursor.delete();cursor.continue();};
    }).catch(()=>{});
    if(window.caches)try{const cache=await caches.open(CACHE);for(const request of await cache.keys()){
      const parts=new URL(request.url).pathname.split('/'),uid=decodeURIComponent(parts[parts.length-3]||''),id=decodeURIComponent(parts[parts.length-2]||'');
      if(!owner||uid!==owner||(allowed&&!allowed.has(id)))await cache.delete(request);
    }}catch(_){}
  }
  window.addEventListener('nh7-library-security',event=>{
    const owner=window.NH7LibrarySecurityV125?.uid(),reason=event.detail.reason;
    const allowed=reason==='verified'?new Set(event.detail.bundle.items.filter(x=>x.audience==='public').map(x=>String(x.id))):
      ['reader_denied','login_required','catalog_denied'].includes(reason)?new Set():null;
    maintenance=maintenance.then(()=>prune(owner,allowed)).catch(()=>{});
  });
  // On startup keep only this UID's records; authorization is checked again before every read.
  maintenance=maintenance.then(()=>prune(window.NH7LibrarySecurityV125?.uid()));
  async function cached(owner,row,language){
    if(row?.audience!=='public')return null;
    await maintenance;
    const security=window.NH7LibrarySecurityV125;
    if(owner!==security?.uid()||!security.publicItem(row.id))return null;
    let response;
    try{const record=await transaction('readonly',(store,done)=>{const request=store.get(recordKey(owner,row.id,language));request.onsuccess=()=>done(request.result);});
      if(record?.data?.allowed===true&&record.data.audience==='public')response=Response.json(record.data);
    }catch(_){}
    if(!response&&window.caches)try{response=await(await caches.open(CACHE)).match(key(owner,row.id,language));const data=response?await response.clone().json():null;if(data?.allowed!==true||data?.audience!=='public')response=null;}catch(_){}
    return owner===security.uid()&&security.publicItem(row.id)?response:null;
  }
  async function removeItem(owner,id){
    await transaction('readwrite',store=>{const request=store.openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;if(cursor.value.uid===owner&&cursor.value.item===String(id))cursor.delete();cursor.continue();};}).catch(()=>{});
    if(window.caches)try{const cache=await caches.open(CACHE);for(const language of ['fa','en','hr'])await cache.delete(key(owner,id,language));}catch(_){}
  }
  async function persist(owner,row,language,data,response){
    await maintenance;
    const security=window.NH7LibrarySecurityV125;
    if(owner!==security.uid()||!security.publicItem(row.id))return;
    if(data.audience==='public')await transaction('readwrite',store=>store.put({key:recordKey(owner,row.id,language),uid:owner,item:String(row.id),language,data})).catch(()=>{});
    if(owner!==security.uid()||!security.publicItem(row.id)){await removeItem(owner,row.id);return;}
    if(window.caches)try{await(await caches.open(CACHE)).put(key(owner,row.id,language),response.clone());}catch(_){}
    if(owner!==security.uid()||!security.publicItem(row.id))await removeItem(owner,row.id);
  }
  // Legacy email/hash reader entries cannot be trusted offline. Production v321 bodies lack
  // item identity: keep those quarantined, requiring one verified PUBLIC online reopen.
  // Never infer identity from audience, title, storage metadata or the legacy hash alone.
  window.addEventListener('nh7-library-security', async (event) => {
    if (event.detail.reason !== 'verified' || !window.caches) return;
    const security = window.NH7LibrarySecurityV125,
      owner = security.uid();
    let email = '';
    try {
      const s = JSON.parse(
        localStorage.getItem('nh7_user_session_v170') || 'null',
      );
      email = String((s?.currentSession || s?.session || s)?.user?.email || '')
        .trim()
        .toLowerCase();
    } catch (_) {}
    try {
      const legacy = await caches.open(LEGACY),
        target = await caches.open(CACHE);
      for (const row of event.detail.bundle.items.filter(
        (x) => x.audience === 'public',
      ))
        for (const language of ['fa', 'en', 'hr']) {
          const old = new Request(
              new URL(
                '__nh7_reader_cache_v327__/' +
                  hash([email, row.id, language].join('|')),
                location.href,
              ).href,
            ),
            response = await legacy.match(old);
          const data = response ? await response.clone().json() : null;
          if (
            response &&
            owner === security.uid() &&
            data?.allowed === true &&
            data?.audience === 'public' &&
            String(data?.item?.id || data?.item_id || '') === String(row.id)
          ) {
            await target.put(key(owner, row.id, language), response.clone());
            await legacy.delete(old);
          }
        } // Unidentified legacy bodies remain quarantined; do not destroy possible public downloads.
      for (const row of event.detail.bundle.items.filter(
        (x) => x.audience === 'ministers',
      ))
        for (const language of ['fa', 'en', 'hr']) {
          const old = new Request(
              new URL(
                '__nh7_reader_cache_v327__/' +
                  hash([email, row.id, language].join('|')),
                location.href,
              ).href,
            ),
            response = await legacy.match(old),
            data = response ? await response.clone().json() : null;
          if (String(data?.item?.id || data?.item_id || '') === String(row.id))
            await legacy.delete(old);
        }
      for (const request of await target.keys()) {
        const parts = new URL(request.url).pathname.split('/'),
          itemId = decodeURIComponent(parts[parts.length - 2] || '');
        const row = event.detail.bundle.items.find(
          (x) => String(x.id) === itemId,
        );
        if (row?.audience !== 'public') await target.delete(request);
      }
    } catch (_) {}
  });
  const wrapped = async function (input, init = {}) {
    const raw = typeof input === 'string' ? input : input?.url || '';
    if (
      !/\/rest\/v1\/rpc\/nh7_library_reader_access_v(?:250|321)(?:$|\?)/.test(
        raw,
      )
    )
      return original(input, init);
    const next = { ...init, cache: 'no-store' };
    let body = {};
    try {
      body = JSON.parse(String(next.body || '{}')) || {};
    } catch (_) {}
    const language =
      localStorage.getItem('nh7_lang') || document.documentElement.lang || 'fa';
    body.p_language = ['fa', 'en', 'hr'].includes(language) ? language : 'fa';
    next.body = JSON.stringify(body);
    const security = window.NH7LibrarySecurityV125,
      owner = security?.uid(),
      catalog = await security?.catalog();
    const row = catalog?.items.find(
      (x) => String(x.id) === String(body.p_item_id),
    );
    if (!owner || owner !== security?.uid() || !row) return denial();
    if (!navigator.onLine)
      return (await cached(owner, row, body.p_language)) || (row.audience==='public'?offlineMiss():denial());
    // v321 retains its five-parameter contract and authorizes through v230/auth.uid().
    let response;
    try {
      response = await original(
        raw.replace(
          '/nh7_library_reader_access_v250',
          '/nh7_library_reader_access_v321',
        ),
        next,
      );
    } catch (error) {
      return owner === security.uid()
        ? (await cached(owner, row, body.p_language)) || (row.audience==='public'?offlineMiss():denial())
        : denial();
    }
    if (owner !== security.uid()) return denial();
    const data = await response
      .clone()
      .json()
      .catch(() => null);
    if (!response.ok || data?.allowed === false) {
      if(response.status===401||response.status===403||(response.ok&&data?.allowed===false&&!['reader_not_ready','reader_unavailable','request_failed'].includes(data.code||''))){security.invalidate('reader_denied');await removeItem(owner,row.id);}
      return response;
    }
    if (row.audience === 'public' && data?.allowed === true && data?.audience==='public') {
      const current = await security.catalog();
      if (
        owner !== security.uid() ||
        !current.items.some(
          (x) => String(x.id) === String(row.id) && x.audience === 'public',
        )
      )
        return denial();
      await persist(owner,row,body.p_language,data,response);
    }
    return response;
  };
  wrapped.__nh7LibraryLanguageV125 = true;
  wrapped.__nh7LibraryLanguageV321 = true;
  window.fetch = wrapped;
  // Status uses the same UID/item/language key and current PUBLIC authorization as replay.
  window.NH7LibraryReaderCacheV125 = Object.freeze({ready: async (id) => {
    const security=window.NH7LibrarySecurityV125,owner=security?.uid(),row=security?.publicItem(id);
    const language=localStorage.getItem('nh7_lang')||document.documentElement.lang||'fa';
    if(!owner||owner!==security?.uid()||!row)return false;
    const response=await cached(owner,row,language),data=response?await response.json().catch(()=>null):null;
    return owner===security.uid()&&!!security.publicItem(id)&&data?.allowed===true;
  }});
  window.NH7_LIBRARY_LANGUAGE_VERSION = VERSION;
})();
