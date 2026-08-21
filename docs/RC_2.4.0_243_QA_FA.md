# New Hope 7 — RC 2.4.0.243 QA checklist

این فایل فقط برای Branch تست و آماده‌سازی نسخه بعدی است. `main` و نسخه کاربران تا تأیید نهایی تغییر نمی‌کند.

## گزارش QA کاربر — 2026-08-22

- [x] بازطراحی Reader اپوکریفا به نمایش پیوسته آیه‌محور شبیه Bible.
- [x] شماره آیه واضح، انتخاب باب، باب قبلی/بعدی، کتاب قبلی/بعدی و Swipe بین باب‌ها.
- [x] ابزار آیه در اپوکریفا: Highlight، Note، Copy و Share.
- [x] حذف نمایش متن صفحه‌ای قدیمی فارسی/کرواتی از Reader جدید.
- [x] فیلتر سخت‌گیرانه: FA/HR فقط ردیف‌های ترجمه تازه پروژه با `in_review` نمایش داده شوند.
- [ ] جایگزینی همه ترجمه‌های قدیمی FA/HR با ترجمه تازه پروژه بر پایه منبع انگلیسی Public Domain؛ این بخش محتوایی باید کتاب‌به‌کتاب تکمیل و QC شود.
- [x] حذف Pastoral Guidance از پلن «30 Days of Prayer in the Spirit and Tongues» در RC.
- [x] محلی‌سازی نام کتاب‌های آیات در Spiritual Plans برای FA/EN/HR.
- [x] محلی‌سازی عمومی نام کتاب‌های آیات در Daily / Gratitude و UIهای داینامیک.
- [x] تشخیص علت Load Failed پیام‌های صوتی: `church-audio` خصوصی است ولی JSON قدیمی از `/object/public/` استفاده می‌کرد.
- [x] ایجاد Signed URL امن برای پیام‌های صوتی کاربران مجاز در RC.
- [x] تأیید وجود فایل‌های School Audio در Storage با MIME `audio/mpeg` و حجم واقعی.
- [x] انتقال Preview از RawGitHack به Origin اختصاصی پروژه Supabase برای تست امن Login/School و حذف مشکل CORS محیط QA.
- [ ] تست عملی School Audio و Message Audio توسط کاربر روی Preview اختصاصی جدید.
- [ ] تست کامل سه زبان FA/EN/HR پس از اصلاحات.
- [ ] تست کامل Login / Logout / Password Recovery / Registration روی RC.
- [ ] تست نهایی Android Internal Testing بعد از تأیید Web RC.
- [ ] تست نهایی iOS TestFlight بعد از تأیید Web RC.
- [ ] انتشار Production فقط پس از تأیید نهایی کاربر.
