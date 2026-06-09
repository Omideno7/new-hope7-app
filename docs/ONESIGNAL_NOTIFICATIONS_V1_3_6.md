# New Hope 7 Notifications v1.3.6

OneSignal App ID:

```text
86f4116a-707a-4959-aa3f-7c703f57bf7e
```

This version connects the web app to OneSignal Web Push and sends these tags when a user enables notifications:

- language: en/fa/hr
- timezone: user's detected timezone
- daily_word_time: 07:00
- faith_time: 12:00
- daily_juice_time: 17:00
- gratitude_time: 21:00
- croatia_morning_meeting: 04:55
- croatia_sunday_service: 20:00

Important:
- The public OneSignal App ID is safe in the web app.
- Do not place the REST API Key in GitHub Pages.
- Scheduled notifications should be created in OneSignal Dashboard or from a secure server/Edge Function.
- iPhone users must add the PWA to the Home Screen before Web Push works reliably.
