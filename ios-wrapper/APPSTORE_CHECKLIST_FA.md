# New Hope 7 — iOS / App Store checklist

این فایل فقط مربوط به بسته‌بندی iOS است و فایل‌های Production وب یا Android را تغییر نمی‌دهد.

## آماده‌شده در کد

- Bundle ID اصلی: `com.omideno7.newhope7`
- Capacitor iOS wrapper جدا از Web/PWA
- Web bundle مخصوص Native بدون Service Worker و OneSignal Web
- OneSignal Capacitor plugin
- Safe Area برای iPhone/iPad
- Filesystem, File Transfer, Browser, Network, Local Notifications
- Simulator build verification در GitHub Actions

## قبل از TestFlight

- Apple Developer Team انتخاب شود.
- App ID با Bundle ID `com.omideno7.newhope7` ثبت/تأیید شود.
- Push Notifications capability فعال شود.
- Background Modes > Remote notifications فعال شود.
- App Group با شناسه `group.com.omideno7.newhope7.onesignal` ساخته شود.
- OneSignal APNs با p8 Token اپل متصل شود.
- Notification Service Extension با نام `OneSignalNotificationServiceExtension` اضافه و با همان App Group تنظیم شود.
- آیکون App Store و Splash نهایی تأیید شوند.
- Build روی iPhone واقعی تست شود.
- تست Push سه‌زبانه FA/EN/HR انجام شود.
- صوت مدرسه، دانلود آفلاین، PDF/کتاب، ویدئو، Login/School access و Inbox روی iOS تست شوند.
- سپس Archive و ارسال به TestFlight انجام شود.
