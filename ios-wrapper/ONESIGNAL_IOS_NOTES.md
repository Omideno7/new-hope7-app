# OneSignal iOS configuration notes

Native iOS configuration for New Hope 7.

- OneSignal App ID: `86f4116a-707a-4959-aa3f-7c703f57bf7e`
- Main bundle ID: `com.omideno7.newhope7`
- App Group: `group.com.omideno7.newhope7.onesignal`
- Notification Service Extension target: `OneSignalNotificationServiceExtension`
- Recommended minimum deployment target: iOS 15+

The Capacitor config intentionally sets:

```json
{
  "ios": {
    "handleApplicationNotifications": false
  }
}
```

This lets OneSignal handle iOS application notifications without Capacitor intercepting APNs callbacks.

Before production push testing, APNs must be configured in the OneSignal dashboard using the Apple Developer p8 token (recommended) or a compatible certificate, and the main target must have Push Notifications + Background Modes / Remote notifications enabled.
