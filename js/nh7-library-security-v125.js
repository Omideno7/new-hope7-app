/* Library-only authorization freshness. Persistent snapshots contain public metadata only. */
(() => {
  'use strict';
  const URL = 'https://gpzcwffxnddhaeaogdyo.supabase.co';
  const KEY = 'sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
  const SESSION = 'nh7_user_session_v170',
    CACHE = 'nh7_library_public_v125_';
  const fetchNetwork = window.fetch.bind(window);
  let identity = '',
    generation = 0,
    bundle = { items: [], collections: [] },
    checkedAt = 0;
  function session() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION) || 'null');
      return s?.currentSession || s?.session || s;
    } catch (_) {
      return null;
    }
  }
  function uid() {
    const s = session();
    return localStorage.getItem('nh7_explicit_logout') === '1' ||
      !s?.access_token
      ? ''
      : String(s.user?.id || '');
  }
  function publicOnly(value) {
    return {
      items: (value?.items || []).filter((x) => x.audience === 'public'),
      collections: (value?.collections || []).filter(
        (x) => x.audience === 'public',
      ),
    };
  }
  function emit(reason) {
    window.dispatchEvent(
      new CustomEvent('nh7-library-security', {
        detail: { reason, uid: identity, bundle },
      }),
    );
  }
  function invalidate(reason = 'identity') {
    generation++;
    bundle =
      reason === 'offline' || reason === 'unverified'
        ? readPublic(identity)
        : { items: [], collections: [] };
    checkedAt = 0;
    emit(reason);
  }
  function sync() {
    const next = uid();
    if (next !== identity) {
      identity = next;
      invalidate();
    }
    return identity;
  }
  function purgeLegacy() {
    for (const storage of [sessionStorage, localStorage]) {
      for (const key of Object.keys(storage)) {
        if (
          key === 'nh7_library_catalog_cache_v1' ||
          key.startsWith('nh7_library_collections_cache_v327_')
        )
          storage.removeItem(key);
        else if (key.startsWith('nh7_protected_catalog_v327_')) {
          try {
            if (JSON.parse(storage.getItem(key))?.resource === 'library')
              storage.removeItem(key);
          } catch (_) {
            /* Unknown shared audio snapshots are not removed. */
          }
        }
      }
    }
  }
  function readPublic(id) {
    try {
      const v = JSON.parse(
        localStorage.getItem(CACHE + id) ||
          sessionStorage.getItem(CACHE + id) ||
          'null',
      );
      return v?.uid === id ? publicOnly(v) : { items: [], collections: [] };
    } catch (_) {
      return { items: [], collections: [] };
    }
  }
  async function catalog() {
    const id = sync(),
      epoch = generation,
      accessToken = session()?.access_token;
    if (!id) {
      invalidate('login_required');
      return bundle;
    }
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 10000);
    try {
      if (!navigator.onLine) throw new Error('offline');
      const response = await fetchNetwork(
        URL + '/rest/v1/rpc/nh7_library_catalog_v396',
        {
          method: 'POST',
          headers: {
            apikey: KEY,
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
          },
          body: '{}',
          cache: 'no-store',
          signal: controller.signal,
        },
      );
      if (!response.ok)
        throw Object.assign(new Error('catalog_denied'), {
          status: response.status,
        });
      const raw = await response.json(),
        value = Array.isArray(raw) ? raw[0] : raw;
      if (value?.allowed === false)
        throw Object.assign(new Error('catalog_denied'), { status: 403 });
      if (sync() !== id || epoch !== generation)
        return { items: [], collections: [] };
      bundle = {
        items: Array.isArray(value?.items) ? value.items : [],
        collections: Array.isArray(value?.collections) ? value.collections : [],
      };
      checkedAt = Date.now();
      try {
        const snapshot = JSON.stringify({
          uid: id,
          at: checkedAt,
          ...publicOnly(bundle),
        });
        sessionStorage.setItem(CACHE + id, snapshot);
        localStorage.setItem(CACHE + id, snapshot);
      } catch (_) {}
      await reconcileFiles(id, bundle);
      if (sync() !== id || epoch !== generation)
        return { items: [], collections: [] };
      emit('verified');
      return bundle;
    } catch (error) {
      if (sync() !== id || epoch !== generation)
        return { items: [], collections: [] };
      if (error.status === 401 || error.status === 403) {
        try {
          localStorage.removeItem(CACHE + id);
          sessionStorage.removeItem(CACHE + id);
        } catch (_) {}
      }
      invalidate(
        error.status === 401 || error.status === 403 ? 'denied' : 'unverified',
      );
      // Denial never resurrects any snapshot. Offline/transient fallback is public-only and UID-bound.
      if (error.status !== 401 && error.status !== 403) {
        bundle = readPublic(id);
        emit('public_fallback');
      }
      return bundle;
    } finally {
      clearTimeout(timer);
    }
  }
  function libraryFile(raw) {
    try {
      const u = new window.URL(raw, location.href);
      return (
        u.origin === URL &&
        /^\/storage\/v1\/object\/(?:(?:sign|authenticated|public)\/)?nh7-library\//.test(
          decodeURIComponent(u.pathname),
        )
      );
    } catch (_) {
      return false;
    }
  }

  // Only verified PUBLIC identity mappings persist. Restricted URLs/metadata stay in memory.
  const FILES = 'nh7_library_public_files_v125_',
    PROOF_DB = 'nh7-library-public-v125';
  let restrictedFiles = new Set();
  function canonicalFile(raw) {
    try {
      const u = new window.URL(raw, location.href);
      return (
        u.origin +
        decodeURIComponent(u.pathname).replace(
          /\/storage\/v1\/object\/(?:sign|authenticated|public)\//,
          '/storage/v1/object/',
        )
      );
    } catch (_) {
      return '';
    }
  }
  function files(id = uid()) {
    try {
      return JSON.parse(localStorage.getItem(FILES + id) || '{}');
    } catch (_) {
      return {};
    }
  }
  function writeFiles(id, value) {
    try {
      localStorage.setItem(FILES + id, JSON.stringify(value));
    } catch (_) {}
  }
  function proofStore(identity, value) {
    return new Promise((resolve) => {
      try {
        const r = indexedDB.open(PROOF_DB, 1);
        r.onupgradeneeded = () =>
          r.result.createObjectStore('proofs', { keyPath: 'identity' });
        r.onerror = () => resolve();
        r.onsuccess = () => {
          const db = r.result,
            tx = db.transaction('proofs', 'readwrite');
          value
            ? tx.objectStore('proofs').put({ identity, ...value })
            : tx.objectStore('proofs').delete(identity);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
        };
      } catch (_) {
        resolve();
      }
    });
  }
  function fileAllowed(raw) {
    if (!libraryFile(raw)) return true;
    const id = sync(),
      key = canonicalFile(raw);
    const proof = files(id)[key];
    return (
      !!id &&
      !restrictedFiles.has(key) &&
      proof?.audience === 'public' &&
      readPublic(id).items.some(
        (row) => String(row.id) === proof.itemId && row.audience === 'public',
      )
    );
  }
  function publicFile(itemId) {
    const id = sync();
    if (!id) return '';
    const index = files(id);
    return (
      Object.keys(index).find(
        (key) => index[key]?.itemId === String(itemId) && fileAllowed(key),
      ) || ''
    );
  }
  async function reconcileFiles(id, value) {
    const rows = new Map(value.items.map((x) => [String(x.id), x]));
    for (const storageKey of Object.keys(localStorage).filter((key) =>
      key.startsWith(FILES),
    )) {
      const owner = storageKey.slice(FILES.length),
        index = files(owner);
      for (const [key, proof] of Object.entries(index)) {
        const row = rows.get(String(proof.itemId));
        if (
          (owner === id && row?.audience !== 'public') ||
          (row && row.audience !== 'public')
        ) {
          delete index[key];
          restrictedFiles.add(key);
          await proofStore(key, null);
          await window.NH7OfflineV325?.remove(key);
        }
      }
      writeFiles(owner, index);
    }
  }
  async function bindFile(itemId, raw) {
    const id = sync(),
      row = bundle.items.find((x) => String(x.id) === String(itemId));
    if (
      !id ||
      !checkedAt ||
      Date.now() - checkedAt > 35000 ||
      !row ||
      !libraryFile(raw)
    )
      return false;
    const key = canonicalFile(raw);
    if (row.audience !== 'public') {
      restrictedFiles.add(key);
      const index = files(id);
      delete index[key];
      writeFiles(id, index);
      await proofStore(key, null);
      await window.NH7OfflineV325?.remove(raw);
      return false;
    }
    restrictedFiles.delete(key);
    const proof = {
      audience: 'public',
      itemId: String(row.id),
      uid: id,
      verifiedAt: checkedAt,
    };
    const index = files(id);
    index[key] = proof;
    writeFiles(id, index);
    await proofStore(key, proof);
    return id === sync() && fileAllowed(raw);
  }
  // Capture successful signed-file responses, including legacy callers, without changing their contract.
  window.fetch = async function (input, init) {
    const raw = typeof input === 'string' ? input : input?.url || '',
      id = sync();
    const response = await fetchNetwork(input, init);
    if (raw === URL + '/functions/v1/nh7-library-access' && response.ok) {
      try {
        const body = JSON.parse(init?.body || '{}'),
          data = await response.clone().json();
        if (
          data.signed_url &&
          data.allowed !== false &&
          !data.error &&
          id &&
          id === sync()
        ) {
          await catalog();
          if (id === sync()) await bindFile(body.item_id, data.signed_url);
        }
      } catch (_) {
        /* Unknown files remain quarantined. */
      }
    }
    return response;
  };

  window.NH7LibrarySecurityV125 = {
    catalog,
    uid: () => sync(),
    invalidate,
    sync,
    libraryFile,
    fileAllowed,
    publicFile,
    publicItem: (id) => { sync(); const row=bundle.items.find(x=>String(x.id)===String(id)&&x.audience==='public'); return row?{...row}:null; },
  };
  purgeLegacy();
  sync();
  window.addEventListener('storage', sync);
  window.addEventListener('nh7-library-auth-change', sync);
  window.addEventListener('offline', () => {
    invalidate('offline');
    if (identity) {
      bundle = readPublic(identity);
      emit('public_fallback');
    }
  });
  window.addEventListener('pageshow', () => {
    sync();
    if (bundle.items.some((x) => x.audience !== 'public')) catalog();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      sync();
      if (bundle.items.some((x) => x.audience !== 'public')) catalog();
    }
  });
  setInterval(() => {
    sync();
    if (checkedAt && Date.now() - checkedAt > 35000) {
      if (bundle.items.some((x) => x.audience !== 'public'))
        invalidate('expired');
      else checkedAt = 0;
    }
  }, 1000);
  setInterval(() => {
    if (bundle.items.some((x) => x.audience !== 'public')) catalog();
  }, 10000);
})();
