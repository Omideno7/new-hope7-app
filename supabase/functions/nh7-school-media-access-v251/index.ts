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
    const kind = clean(body?.kind || 'audio').toLowerCase();
    const lessonCode = clean(body?.lesson_code);
    const videoId = clean(body?.video_id);
    const deviceId = clean(body?.device_id || req.headers.get('x-device-id')).slice(0, 160);
    const userEmail = String(user.email).trim().toLowerCase();

    if (!['audio', 'portal', 'video'].includes(kind)) return json(origin, { error: 'Invalid media kind', code: 'invalid_kind' }, 400);

    if (kind === 'portal') {
      const { data, error } = await admin.rpc('nh7_video_portal_authorize_v251', {
        p_device_id: deviceId,
        p_user_id: user.id,
        p_user_email: userEmail,
      });
      if (error) return json(origin, { error: error.message, code: 'authorization_error' }, 400);
      const access = Array.isArray(data) ? data[0] : data;
      if (!access?.allowed) {
        const reason = String(access?.code || 'not_allowed');
        return json(origin, { error: reason, code: reason }, reason === 'login_required' ? 401 : 403);
      }
      return json(origin, {
        ok: true,
        allowed: true,
        kind: 'portal',
        catalog: Array.isArray(access.catalog) ? access.catalog : [],
        watermark_email: access.watermark_email || userEmail,
        watermark_device: access.watermark_device || deviceId.slice(-8),
      });
    }

    let access: any;
    if (kind === 'audio') {
      const { data, error } = await admin.rpc('nh7_school_media_authorize_v260', {
        p_kind: 'audio',
        p_lesson_code: lessonCode,
        p_video_id: null,
        p_code: '',
        p_device_id: deviceId,
        p_user_id: user.id,
        p_user_email: userEmail,
      });
      if (error) return json(origin, { error: error.message, code: 'authorization_error' }, 400);
      access = Array.isArray(data) ? data[0] : data;
    } else {
      if (!/^[0-9a-f-]{36}$/i.test(videoId)) return json(origin, { error: 'Invalid video id', code: 'invalid_video' }, 400);
      const { data, error } = await admin.rpc('nh7_video_authorize_v251', {
        p_video_id: videoId,
        p_device_id: deviceId,
        p_user_id: user.id,
        p_user_email: userEmail,
      });
      if (error) return json(origin, { error: error.message, code: 'authorization_error' }, 400);
      access = Array.isArray(data) ? data[0] : data;
    }

    if (!access?.allowed) {
      const reason = String(access?.code || 'not_allowed');
      const status = ['login_required', 'invalid_session'].includes(reason) ? 401 : reason.endsWith('_not_found') ? 404 : 403;
      return json(origin, { error: reason, code: reason }, status);
    }

    const bucket = clean(access.bucket);
    const storagePath = clean(access.storage_path).replace(/^\/+/, '');
    if (!bucket || !storagePath || storagePath.includes('..')) return json(origin, { error: 'Invalid storage path', code: 'invalid_path' }, 400);

    const expiresIn = kind === 'video' ? 8 * 60 * 60 : 6 * 60 * 60;
    const { data: signed, error: signError } = await admin.storage.from(bucket).createSignedUrl(storagePath, expiresIn);
    if (signError || !signed?.signedUrl) return json(origin, { error: signError?.message || 'Could not create signed URL', code: 'signed_url_failed' }, 500);

    const signTrack = async (trackPath: unknown) => {
      const subtitlePath = clean(trackPath).replace(/^\/+/, '');
      if (!subtitlePath || subtitlePath.includes('..')) return '';
      const { data, error } = await admin.storage.from(bucket).createSignedUrl(subtitlePath, expiresIn);
      return error ? '' : (data?.signedUrl || '');
    };
    const [subtitleEnUrl, subtitleHrUrl] = kind === 'video'
      ? await Promise.all([signTrack(access.subtitle_en_path), signTrack(access.subtitle_hr_path)])
      : ['', ''];

    return json(origin, {
      ok: true,
      allowed: true,
      kind,
      signed_url: signed.signedUrl,
      expires_in: expiresIn,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      file_name: access.file_name,
      mime_type: access.mime_type,
      duration_seconds: access.duration_seconds || 0,
      lesson_code: access.lesson_code || '',
      title_fa: access.title_fa || '',
      title_en: access.title_en || '',
      title_hr: access.title_hr || '',
      subtitle_en_url: subtitleEnUrl,
      subtitle_hr_url: subtitleHrUrl,
      watermark_email: access.watermark_email || userEmail,
      watermark_device: access.watermark_device || deviceId.slice(-8),
    });
  } catch (error) {
    console.error('nh7-school-media-access-v251', error);
    return json(origin, { error: error instanceof Error ? error.message : String(error), code: 'school_media_access_failed' }, 500);
  }
});
