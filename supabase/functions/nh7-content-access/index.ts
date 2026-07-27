import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://omideno7.github.io',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
]);

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://omideno7.github.io',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-user-email',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
function reply(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, private' },
  });
}
function clean(value: unknown) { return String(value || '').trim(); }
function cleanEmail(value: unknown) { return clean(value).toLowerCase(); }
function bearer(req: Request) {
  const value = req.headers.get('authorization') || '';
  return /^Bearer\s+/i.test(value) ? value.replace(/^Bearer\s+/i, '').trim() : '';
}
function storagePathFromUrl(value: unknown) {
  const raw = clean(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const marker = '/storage/v1/object/public/church-audio/';
    const signedMarker = '/storage/v1/object/sign/church-audio/';
    if (url.pathname.includes(marker)) return decodeURIComponent(url.pathname.split(marker)[1] || '');
    if (url.pathname.includes(signedMarker)) return decodeURIComponent(url.pathname.split(signedMarker)[1] || '');
  } catch (_) { /* storage_path may already be relative */ }
  return raw.startsWith('audio-bible/') || raw.startsWith('messages/') || raw.startsWith('school/') ? raw.replace(/^\/+/, '') : '';
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return reply(origin, { error: 'POST required', code: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceRole) return reply(origin, { error: 'Server configuration is incomplete', code: 'server_config' }, 500);

  const token = bearer(req);
  if (!token) return reply(origin, { error: 'Sign in is required', code: 'login_required' }, 401);

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.id || !user.email) return reply(origin, { error: 'The account session is invalid or expired', code: 'invalid_session' }, 401);

  const body = await req.json().catch(() => ({}));
  const action = clean(body?.action || 'status');
  const email = cleanEmail(user.email);
  const deviceId = clean(body?.device_id || req.headers.get('x-device-id')).slice(0, 160);

  /* This RPC already exists in the current production database and performs
     an indexed server-side lookup, so approval is not limited to a page of
     registration rows. The email comes only from the verified JWT user. */
  const { data: approvalData, error: approvalError } = await admin.rpc('nh7_school_access_approved_v223', {
    p_email: email,
    p_device_id: deviceId,
  });
  if (approvalError) return reply(origin, { error: approvalError.message, code: 'registration_check_failed' }, 500);
  const approved = Boolean(approvalData);

  if (action === 'status') {
    return reply(origin, { authenticated: true, approved, user_email: email, code: approved ? 'approved' : 'school_approval_required' });
  }
  if (!approved) return reply(origin, { error: 'Approved school registration is required', code: 'school_approval_required' }, 403);

  try {
    if (action === 'catalog') {
      const resource = clean(body?.resource);
      const query = new URLSearchParams(clean(body?.query));
      const language = ['fa', 'en', 'hr'].includes(clean(body?.language)) ? clean(body?.language) : 'en';

      if (resource === 'audio_bible_books') {
        const { data, error } = await admin.from('audio_bible_books').select('*').eq('is_active', true).order('book_order');
        if (error) throw error;
        return reply(origin, { items: data || [], approved: true, user_email: email });
      }

      if (resource === 'audio_bible_chapters') {
        const requestedLanguage = clean(query.get('language') || '').replace(/^eq\./, '') || language;
        const { data, error } = await admin.from('audio_bible_chapters').select('*').eq('is_published', true).is('admin_deleted_at', null).eq('language', requestedLanguage).order('book_code').order('chapter_number');
        if (error) throw error;
        const items = await Promise.all((data || []).map(async (row: any) => {
          const path = clean(row.storage_path) || storagePathFromUrl(row.audio_url);
          if (!path) return { ...row, audio_url: '' };
          const { data: signed, error: signError } = await admin.storage.from('church-audio').createSignedUrl(path, 900);
          return { ...row, audio_url: signError ? '' : signed?.signedUrl || '', storage_path: '' };
        }));
        return reply(origin, { items, approved: true, user_email: email });
      }

      if (resource === 'sermons') {
        const { data, error } = await admin.from('sermons').select('*').eq('is_published', true).order('sort_order').order('published_at', { ascending: false });
        if (error) throw error;
        const items = await Promise.all((data || []).map(async (row: any) => {
          const path = storagePathFromUrl(row.audio_url);
          if (!path) return { ...row, audio_url: '' };
          const { data: signed, error: signError } = await admin.storage.from('church-audio').createSignedUrl(path, 900);
          return { ...row, audio_url: signError ? '' : signed?.signedUrl || '' };
        }));
        return reply(origin, { items, approved: true, user_email: email });
      }

      if (resource === 'library') {
        const { data, error } = await admin.from('nh7_library_items').select('id,title_fa,title_en,title_hr,description_fa,description_en,description_hr,audience,file_name,file_size,cover_url,sort_order,resource_type,apocrypha_book,mime_type,is_published,is_active').eq('is_active', true).eq('is_published', true).order('sort_order').order('created_at', { ascending: false });
        if (error) throw error;
        return reply(origin, { items: data || [], approved: true, user_email: email });
      }

      return reply(origin, { error: 'Unsupported protected resource', code: 'unsupported_resource' }, 400);
    }

    if (action === 'save_bible_batch') {
      const items = Array.isArray(body?.items) ? body.items.slice(0, 250) : [];
      if (!items.length) return reply(origin, { ok: true, saved: 0 });
      const batchId = clean(body?.batch_id) || crypto.randomUUID();
      const language = ['fa', 'en', 'hr'].includes(clean(body?.language)) ? clean(body?.language) : 'en';
      const now = new Date().toISOString();
      const rows = items.map((item: any) => ({
        user_id: user.id,
        user_email: email,
        verse_ref: clean(item?.verse_ref).slice(0, 300),
        verse_key: clean(item?.verse_key).slice(0, 400),
        verse_text: clean(item?.verse_text).slice(0, 8000),
        saved: Boolean(item?.saved),
        highlight_color: clean(item?.highlight_color).slice(0, 32),
        note: clean(item?.note).slice(0, 3000),
        language,
        batch_id: batchId,
        updated_at: now,
      })).filter((row: any) => row.verse_ref || row.verse_key);
      const { error } = await admin.from('nh7_account_verse_marks_v230').upsert(rows, { onConflict: 'user_id,verse_key' });
      if (error) throw error;

      const savedRows = rows.filter((row: any) => row.saved && row.verse_ref).map((row: any) => ({ user_email: email, ref: row.verse_ref, language, updated_at: now }));
      if (savedRows.length) await admin.from('nh7_account_saved_verses').upsert(savedRows, { onConflict: 'user_email,ref' });
      return reply(origin, { ok: true, saved: rows.length, batch_id: batchId });
    }

    return reply(origin, { error: 'Unknown action', code: 'unknown_action' }, 400);
  } catch (error) {
    console.error('nh7-content-access', error);
    return reply(origin, { error: error instanceof Error ? error.message : String(error), code: 'content_access_failed' }, 500);
  }
});
