import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperRoot = path.resolve(here, '..');
const iosRoot = path.join(wrapperRoot, 'ios');
const appRoot = path.join(iosRoot, 'App');
const appSource = path.join(appRoot, 'App');
const plistPath = path.join(appSource, 'Info.plist');
const entitlementsPath = path.join(appSource, 'NewHope7.entitlements');
const pbxPath = path.join(appRoot, 'App.xcodeproj', 'project.pbxproj');

const APP_GROUP = 'group.com.omideno7.newhope7.onesignal';
const BUNDLE_ID = 'com.omideno7.newhope7';

await mkdir(appSource, { recursive: true });

let plist = await readFile(plistPath, 'utf8');
function addPlistBlock(key, xml) {
  if (plist.includes(`<key>${key}</key>`)) return;
  plist = plist.replace('</dict>', `\t<key>${key}</key>\n${xml}\n</dict>`);
}

addPlistBlock('OneSignal_app_groups_key', `\t<string>${APP_GROUP}</string>`);
addPlistBlock('UIBackgroundModes', `\t<array>\n\t\t<string>audio</string>\n\t\t<string>remote-notification</string>\n\t</array>`);
addPlistBlock('ITSAppUsesNonExemptEncryption', `\t<false/>`);
await writeFile(plistPath, plist, 'utf8');

const entitlements = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>aps-environment</key>\n\t<string>$(APS_ENVIRONMENT)</string>\n\t<key>com.apple.security.application-groups</key>\n\t<array>\n\t\t<string>${APP_GROUP}</string>\n\t</array>\n</dict>\n</plist>\n`;
await writeFile(entitlementsPath, entitlements, 'utf8');

let pbx = await readFile(pbxPath, 'utf8');

function patchTargetConfig(name, aps) {
  const marker = `PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID};`;
  const blocks = [...pbx.matchAll(/\b[0-9A-F]{24} \/\* (Debug|Release) \*\/ = \{[\s\S]*?\n\t\t\};/g)];
  const block = blocks.find(match => match[1] === name && match[0].includes(marker));
  if (!block) throw new Error(`Could not locate ${name} app target build configuration`);

  let next = block[0];
  if (!next.includes('CODE_SIGN_ENTITLEMENTS = App/NewHope7.entitlements;')) {
    next = next.replace(
      'CODE_SIGN_STYLE = Automatic;',
      'CODE_SIGN_ENTITLEMENTS = App/NewHope7.entitlements;\n\t\t\t\tCODE_SIGN_STYLE = Automatic;'
    );
  }
  if (!next.includes('APS_ENVIRONMENT =')) {
    next = next.replace(
      'ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;',
      `APS_ENVIRONMENT = ${aps};\n\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;`
    );
  }
  next = next.replace(/CURRENT_PROJECT_VERSION = [^;]+;/, 'CURRENT_PROJECT_VERSION = 1;');
  next = next.replace(/MARKETING_VERSION = [^;]+;/, 'MARKETING_VERSION = 2.3.9;');
  pbx = pbx.replace(block[0], next);
}

patchTargetConfig('Debug', 'development');
patchTargetConfig('Release', 'production');

if (!pbx.includes('com.apple.Push = {')) {
  const before = 'ProvisioningStyle = Automatic;\n\t\t\t\t\t};';
  const after = `ProvisioningStyle = Automatic;\n\t\t\t\t\t\tSystemCapabilities = {\n\t\t\t\t\t\t\tcom.apple.ApplicationGroups.iOS = {\n\t\t\t\t\t\t\t\tenabled = 1;\n\t\t\t\t\t\t\t};\n\t\t\t\t\t\t\tcom.apple.BackgroundModes = {\n\t\t\t\t\t\t\t\tenabled = 1;\n\t\t\t\t\t\t\t};\n\t\t\t\t\t\t\tcom.apple.Push = {\n\t\t\t\t\t\t\t\tenabled = 1;\n\t\t\t\t\t\t\t};\n\t\t\t\t\t\t};\n\t\t\t\t\t};`;
  if (!pbx.includes(before)) throw new Error('Could not locate App target attributes');
  pbx = pbx.replace(before, after);
}

await writeFile(pbxPath, pbx, 'utf8');
console.log('Configured New Hope 7 iOS capabilities:', { BUNDLE_ID, APP_GROUP });
