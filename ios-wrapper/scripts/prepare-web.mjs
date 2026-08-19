import { cp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperRoot = path.resolve(here, '..');
const repoRoot = path.resolve(wrapperRoot, '..');
const webRoot = path.join(wrapperRoot, 'www');

const requiredFiles = ['index.html', 'manifest.json', 'service-worker.js'];
const optionalFiles = ['certificate.html', 'verify-document.html', 'reset-password.html', 'privacy.html', 'app-v239.html'];
const requiredDirs = ['assets', 'css', 'data', 'js'];
const optionalDirs = ['offline', 'push'];

async function exists(p) { try { await access(p); return true; } catch { return false; } }
async function copyRel(rel, required = false) {
  const from = path.join(repoRoot, rel);
  const to = path.join(webRoot, rel);
  if (!(await exists(from))) {
    if (required) throw new Error(`Missing required web asset: ${rel}`);
    return;
  }
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to, { recursive: true, force: true });
}

await rm(webRoot, { recursive: true, force: true });
await mkdir(webRoot, { recursive: true });
for (const p of requiredFiles) await copyRel(p, true);
for (const p of optionalFiles) await copyRel(p, false);
for (const p of requiredDirs) await copyRel(p, true);
for (const p of optionalDirs) await copyRel(p, false);

const indexPath = path.join(webRoot, 'index.html');
let html = await readFile(indexPath, 'utf8');

html = html.replace(
  "if ('serviceWorker' in navigator) {",
  "if (!window.Capacitor?.isNativePlatform?.() && 'serviceWorker' in navigator) {"
);

html = html.replace(
  /<script src="https:\/\/cdn\.onesignal\.com\/sdks\/web\/v16\/OneSignalSDK\.page\.js" defer><\/script>/,
  `<script>if(!window.Capacitor?.isNativePlatform?.()){const s=document.createElement('script');s.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';s.defer=true;document.head.appendChild(s);}</script>`
);

const nativeTags = `\n  <link rel="stylesheet" href="native/nh7-native-ios.css">\n  <script src="native/nh7-native-bridge.js"></script>\n`;
html = html.replace('</head>', `${nativeTags}</head>`);
await writeFile(indexPath, html, 'utf8');

console.log('Prepared New Hope 7 native web bundle from:', repoRoot);
