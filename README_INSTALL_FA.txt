New Hope 7 v2.1.8 — نصب هدفمند

این بسته فقط چهار مشکل را اصلاح می‌کند:
1) ویرایش عنوان و متن مدرک پایان دوره در فارسی، انگلیسی و کرواتی
2) بازیابی رمز کاربران و ادمین بدون localhost
3) چشم نمایش/پنهان‌کردن رمز در ورود پنل ادمین
4) حذف واقعی و فوری پیام‌های تکراری

مراحل نصب:
1. فایل supabase_v2_1_8_certificate_password_message_fix.sql را یک بار در Supabase SQL Editor اجرا کن.
2. در GitHub فایل‌های زیر را جایگزین/اضافه کن:
   admin.html
   certificate.html
   reset-password.html (جدید)
   service-worker.js
   js/app.js
3. فایل .nojekyll را حذف نکن.
4. منتظر سبزشدن GitHub Pages بمان و پنل را با ?v=218 باز کن.

تنظیم بسیار مهم Supabase برای بازیابی رمز:
Authentication > URL Configuration
- Site URL را روی این آدرس بگذار:
  https://omideno7.github.io/new-hope7-app/reset-password.html
- در Redirect URLs همین آدرس دقیق را اضافه کن:
  https://omideno7.github.io/new-hope7-app/reset-password.html
- آدرس‌های http://localhost:3000 و localhost را از Redirect URLs حذف کن.

پس از ذخیره تنظیمات، لینک‌های قدیمی کار نمی‌کنند. کاربر باید دوباره «فراموشی رمز» را بزند و ایمیل جدید دریافت کند.

نکته Google Play:
فایل app.js برای نسخه وب و Build بعدی اصلاح شده است. برای رفع فوری لینک‌های کاربرانِ نسخه نصب‌شده، تنظیم URL Configuration در Supabase عامل اصلی است و نیاز نیست همین لحظه AAB جدید منتشر شود. در آپدیت بعدی Google Play همین app.js نیز داخل Build قرار بگیرد.

روش قطعی برای جلوگیری از localhost در نسخه نصب‌شده فعلی:
Supabase > Authentication > Email Templates > Reset Password
لینک دکمه بازیابی را روی این آدرس قرار بده:
https://omideno7.github.io/new-hope7-app/reset-password.html?token_hash={{ .TokenHash }}&type=recovery

نمونه ساده قالب:
<h2>Reset Password</h2>
<p><a href="https://omideno7.github.io/new-hope7-app/reset-password.html?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a></p>

این روش لینک را مستقیماً به صفحه عمومی بازیابی می‌فرستد و به آدرس localhost وابسته نیست.
