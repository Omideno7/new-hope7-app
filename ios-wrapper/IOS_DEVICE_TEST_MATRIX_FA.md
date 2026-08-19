# New Hope 7 — ماتریس تست iPhone / iPad

این سند برای تست نسخه iOS است. تا پایان تست‌ها، Branch iOS جدا از `main` باقی می‌ماند.

## 1) نصب و شروع

- نصب Build روی iPhone واقعی از TestFlight یا Xcode.
- نمایش آیکون New Hope 7 روی Home Screen.
- نمایش Launch Screen با لوگوی New Hope 7 و بدون تصویر پیش‌فرض Capacitor.
- اولین اجرا با اینترنت و اجرای دوباره بدون اینترنت.
- بررسی Safe Area روی iPhone دارای Dynamic Island / notch و iPad.
- بررسی فارسی RTL، English LTR و Croatian LTR.

## 2) حساب و مدرسه

- ثبت‌نام جدید مدرسه فقط یک‌بار ثبت شود.
- پیام موفقیت بعد از ثبت درخواست نمایش داده شود و کاربر به ورود مدرسه برگردد.
- ورود حساب تأییدشده.
- کاربر در انتظار تأیید به محتوای محافظت‌شده دسترسی نداشته باشد.
- Logout و Login مجدد دسترسی‌ها را درست بازیابی کنند.

## 3) Push Notification / OneSignal

- درخواست مجوز Push روی دستگاه واقعی.
- Push فارسی، انگلیسی و کرواتی مطابق زبان انتخاب‌شده اپ.
- Push در foreground، background و زمانی که اپ بسته است.
- Tap روی Push اپ را صحیح باز کند.
- Push دارای تصویر با Notification Service Extension نمایش داده شود.
- Badge و پاک‌شدن/به‌روزرسانی Badge بررسی شود.

## 4) Audio

- Sermons / School Audio / Audio Bible بدون گیرکردن باز شوند.
- Play / Pause / Seek / سرعت پخش.
- ادامه پخش با خاموش‌شدن صفحه یا رفتن اپ به background.
- Resume بعد از برگشت به اپ.
- دانلود آفلاین، پخش آفلاین و حذف فایل آفلاین.
- جابه‌جایی بین صفحات باعث شکستن Player نشود.

## 5) Bible و کتاب‌ها

- Bible: عهد → کتاب → باب.
- Previous / Next chapter و Previous / Next book.
- Notes / highlights / verse popup.
- Apocrypha و Library.
- PDF / readable books داخل اپ باز و قابل scroll/zoom باشند.
- لینک خارجی در Browser امن Native باز شود.

## 6) Video

- بازشدن Video portal فقط با دسترسی معتبر.
- MP4 H.264/AAC تست شود.
- Fullscreen / Seek / Speed / Mute / Captions.
- Watermark مزاحم مرکز تصویر نباشد.
- Revoke/expiry access روی iOS اعمال شود.

## 7) Inbox و اعلان‌های داخل اپ

- نمایش Badge Inbox.
- بازکردن پیام خصوصی.
- Refresh بعد از ارسال پیام جدید از Admin.

## 8) پایداری و شبکه

- تغییر Wi‑Fi ↔ cellular در حین استفاده.
- رفتن Offline و Online بدون reload خراب.
- Force close و بازکردن مجدد.
- کمبود حافظه/تعویض اپ و برگشت به New Hope 7.
- عدم نمایش صفحه سفید یا گیرکردن روی Loading.

## 9) iPad

- Portrait و Landscape.
- منوها و modalها بیرون صفحه نروند.
- Player و PDF viewer قابل استفاده باشند.
- keyboard روی فرم‌ها فیلد/دکمه Submit را نپوشاند.

## 10) قبل از ارسال App Store

- Release archive با Signing واقعی Apple Developer.
- TestFlight internal test.
- Push/APNs production test.
- App Privacy پاسخ‌ها با رفتار واقعی برنامه تطبیق داده شوند.
- Screenshots و metadata نهایی App Store Connect.
- بررسی نهایی اینکه تغییرات iOS باعث تغییر ناخواسته در Web/PWA یا Android نشده‌اند.
