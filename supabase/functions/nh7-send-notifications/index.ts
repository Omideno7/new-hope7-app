// New Hope 7 automatic notification sender for Supabase Edge Functions.
// Required secrets:
// ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!;
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = 'https://omideno7.github.io/new-hope7-app/?v=138';

type Lang = 'fa' | 'en' | 'hr';

const messages = {
  daily_word: {
    time: '07:00AM', mode: 'timezone', category: 'daily_word',
    fa: ['کلام روزانه آماده است', 'امروز کلام خدا را دریافت کن و روزت را با ایمان شروع کن.'],
    en: ['Daily Word is ready', 'Receive God’s Word today and start your day in faith.'],
    hr: ['Dnevna Riječ je spremna', 'Primi Božju Riječ danas i započni dan u vjeri.'],
  },
  faith: {
    time: '12:00PM', mode: 'timezone', category: 'faith',
    fa: ['اعلان ایمان آماده است', 'وقت اعلان ایمان است؛ کلام را با دهانت اعلام کن.'],
    en: ['Faith proclamation is ready', 'It is time for your faith proclamation; speak the Word.'],
    hr: ['Proglas vjere je spreman', 'Vrijeme je za proglas vjere; izgovori Riječ.'],
  },
  daily_juice: {
    time: '05:00PM', mode: 'timezone', category: 'daily_juice',
    fa: ['آبمیوه روزانه آماده است', 'آبمیوه روزانه امروز آماده است؛ چند دقیقه برای تقویت روح خود وقت بگذار.'],
    en: ['Daily Juice is ready', 'Today’s Daily Juice is ready; take a few minutes to strengthen your spirit.'],
    hr: ['Dnevni sok je spreman', 'Današnji Daily Juice je spreman; odvoji nekoliko minuta za svoj duh.'],
  },
  gratitude: {
    time: '09:00PM', mode: 'timezone', category: 'gratitude',
    fa: ['یادآوری شکرگزاری', 'امروز را با شکرگزاری به پایان برسان و نیکویی خدا را به یاد آور.'],
    en: ['Gratitude reminder', 'End today with thanksgiving and remember God’s goodness.'],
    hr: ['Podsjetnik zahvalnosti', 'Završi dan zahvalnošću i sjeti se Božje dobrote.'],
  },
  morning_meeting: {
    category: 'meeting',
    fa: ['یادآوری جلسه دعای صبحگاهی', 'جلسه دعای صبحگاهی کلیسا ۵ دقیقه دیگر آغاز می‌شود.'],
    en: ['Morning prayer meeting reminder', 'The morning prayer meeting starts in 5 minutes.'],
    hr: ['Podsjetnik za jutarnju molitvu', 'Jutarnji molitveni sastanak počinje za 5 minuta.'],
  },
  sunday_service: {
    category: 'meeting',
    fa: ['یادآوری جلسه کلیسای یکشنبه', 'جلسه کلیسای یکشنبه آماده است. برای ورود به جلسه کلیک کن.'],
    en: ['Sunday church meeting reminder', 'The Sunday church meeting is ready. Tap to join.'],
    hr: ['Podsjetnik za nedjeljni sastanak', 'Nedjeljni crkveni sastanak je spreman. Dodirni za ulazak.'],
  },
} as const;

async function sendOneSignal(key: keyof typeof messages, lang: Lang) {
  const msg = messages[key];
  const [title, body] = msg[lang];
  const payload: Record<string, unknown> = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: 'push',
    filters: [
      { field: 'tag', key: 'app', relation: '=', value: 'new_hope_7' },
      { operator: 'AND' },
      { field: 'tag', key: 'language', relation: '=', value: lang },
    ],
    headings: { [lang]: title, en: title },
    contents: { [lang]: body, en: body },
    url: APP_URL,
  };
  if ('mode' in msg && msg.mode === 'timezone') {
    payload.delayed_option = 'timezone';
    payload.delivery_time_of_day = msg.time;
  }
  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`OneSignal ${res.status}: ${await res.text()}`);
  return res.json();
}

async function saveGlobalInbox(key: keyof typeof messages, lang: Lang) {
  const msg = messages[key];
  const [title, body] = msg[lang];
  await fetch(`${SUPABASE_URL}/rest/v1/notification_inbox`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ title, body, category: msg.category, language: lang, device_id: null, user_email: null }),
  });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') || 'daily';
    const keys = mode === 'daily'
      ? ['daily_word', 'faith', 'daily_juice', 'gratitude']
      : mode === 'morning'
        ? ['morning_meeting']
        : mode === 'sunday'
          ? ['sunday_service']
          : [];
    const out = [];
    for (const key of keys as (keyof typeof messages)[]) {
      for (const lang of ['fa','en','hr'] as Lang[]) {
        out.push(await sendOneSignal(key, lang));
        await saveGlobalInbox(key, lang);
      }
    }
    return new Response(JSON.stringify({ ok: true, mode, sent: out.length }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
});
