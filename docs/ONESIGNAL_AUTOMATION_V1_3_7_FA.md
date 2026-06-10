# New Hope 7 — راه‌اندازی ارسال خودکار اعلان‌ها v1.3.8

این نسخه داخل اپ، صندوق ورودی اعلان‌ها را اضافه می‌کند و کاربر بعد از فعال‌سازی اعلان‌ها، زبان و timezone خودش را برای OneSignal ثبت می‌کند.

برای ارسال خودکار واقعی، باید یک Supabase Edge Function با کلید خصوصی OneSignal راه‌اندازی شود. کلید خصوصی را داخل GitHub یا داخل اپ نگذارید.

## Secretهای لازم در Supabase

در Supabase بروید به:

Project Settings → Edge Functions → Secrets

و این موارد را اضافه کنید:

- `ONESIGNAL_APP_ID` = `86f4116a-707a-4959-aa3f-7c703f57bf7e`
- `ONESIGNAL_REST_API_KEY` = کلید REST API از OneSignal، آن را در اپ یا GitHub نگذارید.
- `SUPABASE_URL` = `https://gpzcwffxnddhaeaogdyo.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = service role key از Supabase، آن را در اپ یا GitHub نگذارید.

## Edge Function آماده

کد آماده در این مسیر قرار داده شده است:

`supabase/functions/nh7-send-notifications/index.ts`

## زمان‌بندی مورد نیاز

- Daily Word: ساعت 07:00 به وقت محلی هر کاربر
- Faith Proclamation: ساعت 12:00 به وقت محلی هر کاربر
- Daily Juice: ساعت 17:00 به وقت محلی هر کاربر
- Gratitude Reminder: ساعت 21:00 به وقت محلی هر کاربر
- Morning meeting: ساعت 04:55 به وقت کرواسی
- Sunday church: ساعت 20:00 به وقت کرواسی

تابع برای Daily ها از قابلیت timezone delivery در OneSignal استفاده می‌کند. برای جلسه صبح و جلسه یکشنبه، Supabase باید تابع را در همان ساعت کرواسی اجرا کند.

## نکته مهم

آپلود GitHub فقط قسمت اپ و صندوق ورودی را فعال می‌کند. ارسال خودکار push واقعی بعد از deploy کردن Edge Function و تنظیم Secretها کامل می‌شود.
