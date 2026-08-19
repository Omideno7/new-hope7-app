# New Hope 7 — iOS Wrapper (Stable 2.3.9)

این پوشه برای ساخت نسخه Native iOS از نسخه پایدار وب New Hope 7 طراحی شده است.

## هویت برنامه
- App Name: New Hope 7
- Bundle ID: `com.omideno7.newhope7`
- Web baseline: Stable 2.3.9
- Native runtime: Capacitor 8
- Push: OneSignal + APNs

## معماری
ریشه Repository همان وب‌اپ Production باقی می‌ماند. هنگام ساخت iOS، اسکریپت `prepare:web` فقط فایل‌های لازم کاربر را به `ios-wrapper/www` کپی می‌کند و نسخه Native-safe از `index.html` می‌سازد. پنل ادمین، SQL و فایل‌های توسعه داخل IPA بسته‌بندی نمی‌شوند.

## اولین ساخت روی Mac
```bash
cd ios-wrapper
npm install
npm run ios:add
npm run ios:open
```

بعد از هر تغییر وب:
```bash
cd ios-wrapper
npm run ios:sync
npm run ios:open
```

## تنظیمات Xcode
روی Target اصلی App:
1. Signing Team را انتخاب کن.
2. Bundle Identifier باید `com.omideno7.newhope7` باشد.
3. Push Notifications را اضافه کن.
4. Background Modes را اضافه کن و `Remote notifications` را فعال کن.
5. Deployment target را حداقل iOS 15 قرار بده.

برای OneSignal یک Notification Service Extension با نام `OneSignalNotificationServiceExtension` ایجاد کن.

App Group پیشنهادی:
`group.com.omideno7.newhope7.onesignal`

همان App Group باید روی App target و Notification Service Extension فعال باشد.

## APNs / OneSignal
برای iOS باید در OneSignal، Apple iOS (APNs) را با p8 Auth Key اپل تنظیم کرد. کلید p8، Key ID و Team ID هرگز داخل GitHub قرار نگیرند.

## تفاوت Native با PWA
در نسخه Native:
- OneSignal Web SDK load نمی‌شود.
- Service Worker وب register نمی‌شود.
- OneSignal از SDK Native استفاده می‌کند.
- Local Notifications، Filesystem، FileTransfer، Browser و Network از Capacitor استفاده می‌کنند.
- لینک‌های خارجی در مرورگر Native باز می‌شوند.
- Safe Area برای notch و home indicator اعمال می‌شود.

## تست‌های اجباری قبل از TestFlight
- ورود/ثبت‌نام و بازیابی دسترسی
- School approval و Waiting List
- Audio Messages و School Audio
- دانلود و پخش آفلاین
- Audio Bible و تغییر باب
- PDF/Book reader
- Secure Video و MOV/MP4 fallback
- Inbox و badge
- Push در foreground/background/terminated
- تغییر زبان FA/EN/HR و زبان Push
- لینک جلسه کلیسا و لینک‌های خارجی
- iPhone و iPad

## App Store
Signing، provisioning profile، APNs secret و App Store Connect credentials داخل Repository قرار نمی‌گیرند.
