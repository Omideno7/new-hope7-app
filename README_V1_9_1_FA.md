# New Hope 7 v1.9.1 — School Media & Stability

این Patch روی نسخه تأییدشده v1.9.0 ساخته شده است.

## تغییرات
- آپلود مستقیم PDF برای هر درس از پنل ادمین
- آپلود مستقیم تصویر برای هر درس از پنل ادمین
- ذخیره فایل‌ها در Supabase Storage در پوشه‌های school/pdfs و school/images
- نمایش تصویر درس داخل اپ
- حفظ لینک دستی PDF و تصویر در صورت نیاز
- نمایش خلاصه سلامت Inbox و تعداد تکراری‌های احتمالی در پنل اعلان‌ها
- افزایش نسخه Cache و Service Worker به v1.9.1

## نصب
SQL جدید لازم نیست.
فقط این سه فایل را در GitHub جایگزین کنید:
- admin.html
- js/app.js
- service-worker.js

سپس GitHub Actions را بررسی و Cache را تازه‌سازی کنید.
