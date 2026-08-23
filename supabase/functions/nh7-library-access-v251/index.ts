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
    'Vary': 'Origin',
  };
}
function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, private' },
  });
}
const clean = (value: unknown) => String(value || '').trim();
const tokenFrom = (req: Request) => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return json(origin, { error: 'POST required', code: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!supabaseUrl || !serviceRole) return json(origin, { error: 'Server configuration is incomplete', code: 'server_config' }, 500);

  const accessToken = tokenFrom(req);
  if (!accessToken) return json(origin, { error: 'Sign in is required', code: 'login_required' }, 401);

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  const user = userData?.user;
  if (userError || !user?.id || !user.email) return json(origin, { error: 'The account session is invalid or expired', code: 'invalid_session' }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const itemId = clean(body?.item_id);
    const deviceId = clean(body?.device_id || req.headers.get('x-device-id')).slice(0, 160);
    if (!/^[0-9a-f-]{36}$/i.test(itemId)) return json(origin, { error: 'Invalid item id', code: 'invalid_item' }, 400);

    const { data: authData, error: authError } = await admin.rpc('nh7_library_authorize_v251', {
      p_item_id: itemId,
      p_device_id: deviceId,
      p_user_id: user.id,
      p_user_email: String(user.email).trim().toLowerCase(),
    });
    if (authError) return json(origin, { error: authError.message, code: 'authorization_error' }, 400);
    const access = Array.isArray(authData) ? authData[0] : authData;
    if (!access?.allowed) {
      const reason = String(access?.code || 'not_allowed');
      const status = ['login_required', 'invalid_session'].includes(reason) ? 401 : reason === 'not_found' ? 404 : 403;
      return json(origin, { error: reason, code: reason }, status);
    }

    const storagePath = clean(access.storage_path).replace(/^\/+/, '');
    if (!storagePath || storagePath.includes('..')) return json(origin, { error: 'Invalid storage path', code: 'invalid_path' }, 400);
    const { data: signed, error: signError } = await admin.storage.from('nh7-library').createSignedUrl(storagePath, 600, {
      download: clean(access.file_name) || undefined,
    });
    if (signError || !signed?.signedUrl) return json(origin, { error: signError?.message || 'Could not create signed URL', code: 'signed_url_failed' }, 500);

    return json(origin, {
      ok: true,
      allowed: true,
      signed_url: signed.signedUrl,
      expires_in: 600,
      audience: access.audience,
      grant_active: true,
      file_name: access.file_name,
      mime_type: access.mime_type,
      resource_type: access.resource_type,
      title_fa: access.title_fa,
      title_en: access.title_en,
      title_hr: access.title_hr,
    });
  } catch (error) {
    console.error('nh7-library-access-v251', error);
    return json(origin, { error: error instanceof Error ? error.message : String(error), code: 'library_access_failed' }, 500);
  }
});
