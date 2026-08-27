import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://omideno7.github.io',
  'https://raw.githack.com',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
]);

function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://omideno7.github.io';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id, x-user-email, range',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges, content-type',
    'Vary': 'Origin',
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(origin),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
    },
  });
}

const clean = (value: unknown) => String(value || '').trim();
const tokenFrom = (req: Request) => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();

function storagePathFromAudioUrl(raw: string) {
  const value = clean(raw);
  if (!value) return '';
  try {
    const url = new URL(value);
    const marker = '/storage/v1/object/';
    const index = url.pathname.indexOf(marker);
    if (index < 0) return '';
    let path = url.pathname.slice(index + marker.length);
    path = path.replace(/^(?:public|sign|authenticated)\//i, '');
    path = path.replace(/^church-audio\//i, '');
    return decodeURIComponent(path).replace(/^\/+/, '');
  } catch (_) {
    return value.replace(/^.*?church-audio\//i, '').split('?')[0].replace(/^\/+/, '');
  }
}

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
    const sermonId = clean(body?.sermon_id);
    const videoId = clean(body?.video_id);
    const code = clean(body?.code);
    const deviceId = clean(body?.device_id || req.headers.get('x-device-id')).slice(0, 160);
    const userEmail = String(user.email).trim().toLowerCase();

    if (!['audio', 'sermon', 'portal', 'video'].includes(kind)) return json(origin, { error: 'Invalid media kind', code: 'invalid_kind' }, 400);

    if (kind === 'portal') {
      const { data, error } = await admin.rpc('nh7_video_portal_authorize_v392', {
        p_code: code,
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
        target_name: access.target_name || '',
      });
    }

    if (kind === 'sermon') {
      const { data: approved } = await admin.rpc('nh7_school_access_approved_v230', {
        p_user_id: user.id,
        p_email: userEmail,
        p_device_id: deviceId,
      });
      const { data: adminAccess } = await admin.rpc('nh7_admin_my_access_v350');
      const adminRow = Array.isArray(adminAccess) ? adminAccess[0] : adminAccess;
      if (approved !== true && adminRow?.is_admin !== true) {
        return json(origin, { error: 'school_approval_required', code: 'school_approval_required' }, 403);
      }
      if (!/^[0-9a-f-]{36}$/i.test(sermonId)) return json(origin, { error: 'Invalid sermon id', code: 'invalid_sermon' }, 400);
      const { data: sermon, error: sermonError } = await admin
        .from('sermons')
        .select('id,audio_url,title_fa,title_en,title_hr,duration_seconds,duration_minutes,is_published')
        .eq('id', sermonId)
        .eq('is_published', true)
        .maybeSingle();
      if (sermonError || !sermon?.audio_url) return json(origin, { error: sermonError?.message || 'Sermon audio not found', code: 'sermon_not_found' }, 404);
      const path = storagePathFromAudioUrl(String(sermon.audio_url));
      if (!path || path.includes('..')) return json(origin, { error: 'Invalid sermon audio path', code: 'invalid_path' }, 400);
      const expiresIn = 6 * 60 * 60;
      const { data: signed, error: signError } = await admin.storage.from('church-audio').createSignedUrl(path, expiresIn);
      if (signError || !signed?.signedUrl) return json(origin, { error: signError?.message || 'Could not create sermon signed URL', code: 'signed_url_failed' }, 500);
      return json(origin, {
        ok: true,
        allowed: true,
        kind: 'sermon',
        signed_url: signed.signedUrl,
        expires_in: expiresIn,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        file_name: path.split('/').pop() || '',
        mime_type: /\.m4a$/i.test(path) ? 'audio/mp4' : 'audio/mpeg',
        duration_seconds: Number(sermon.duration_seconds || 0) || Math.round(Number(sermon.duration_minutes || 0) * 60),
        title_fa: sermon.title_fa || '',
        title_en: sermon.title_en || '',
        title_hr: sermon.title_hr || '',
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
      const { data, error } = await admin.rpc('nh7_video_authorize_v392', {
        p_video_id: videoId,
        p_code: code,
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
    const path = clean(access.storage_path).replace(/^\/+/, '');
    if (!bucket || !path || path.includes('..')) return json(origin, { error: 'Invalid storage path', code: 'invalid_path' }, 400);

    const expiresIn = kind === 'video' ? 8 * 60 * 60 : 6 * 60 * 60;
    const { data: signed, error: signError } = await admin.storage.from(bucket).createSignedUrl(path, expiresIn);
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
    console.error('nh7-school-media-access', error);
    return json(origin, { error: error instanceof Error ? error.message : String(error), code: 'school_media_access_failed' }, 500);
  }
});
