import OneSignal from '@onesignal/capacitor-plugin';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Filesystem } from '@capacitor/filesystem';
import { FileTransfer } from '@capacitor/file-transfer';
import { Haptics } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';

const cap = window.Capacitor;
const isNative = !!cap?.isNativePlatform?.();

if (isNative) {
  window.NH7_NATIVE_IOS = cap.getPlatform?.() === 'ios';
  document.documentElement.classList.add('nh7-native', `nh7-native-${cap.getPlatform?.() || 'app'}`);

  cap.Plugins = cap.Plugins || {};
  Object.assign(cap.Plugins, {
    App,
    Browser,
    Filesystem,
    FileTransfer,
    Haptics,
    LocalNotifications,
    Network
  });

  window.plugins = window.plugins || {};
  window.plugins.OneSignal = {
    ...OneSignal,
    initialize(appId) {
      const value = typeof appId === 'string' ? appId : appId?.appId;
      return OneSignal.initialize(value);
    },
    User: OneSignal.User,
    Notifications: OneSignal.Notifications,
    InAppMessages: OneSignal.InAppMessages,
    LiveActivities: OneSignal.LiveActivities,
    Debug: OneSignal.Debug,
    login: (...args) => OneSignal.login(...args),
    logout: (...args) => OneSignal.logout(...args)
  };

  document.addEventListener('click', async (event) => {
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor) return;
    let url;
    try { url = new URL(anchor.href, location.href); } catch { return; }
    if (!/^https?:$/.test(url.protocol)) return;
    const isChurchWeb = url.hostname === 'omideno7.github.io' && url.pathname.startsWith('/new-hope7-app/');
    if (isChurchWeb) return;
    event.preventDefault();
    try { await Browser.open({ url: url.href }); }
    catch { location.href = url.href; }
  }, true);

  App.addListener('appUrlOpen', ({ url }) => {
    try {
      const target = new URL(url);
      const route = target.searchParams.get('route');
      if (route && typeof window.navigate === 'function') window.navigate(route, {});
    } catch (_) {}
  });

  window.dispatchEvent(new CustomEvent('nh7-native-ready', {
    detail: { platform: cap.getPlatform?.() || 'native' }
  }));
}
