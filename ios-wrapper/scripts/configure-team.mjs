import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperRoot = path.resolve(here, '..');
const pbxPath = path.join(wrapperRoot, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

const TEAM_ID = 'CDLUYR2TH9';
const BUNDLE_IDS = [
  'com.omideno7.newhope7',
  'com.omideno7.newhope7.OneSignalNotificationServiceExtension'
];

let pbx = await readFile(pbxPath, 'utf8');
let patched = 0;

const blocks = [...pbx.matchAll(/\b[0-9A-F]{24} \/\* (Debug|Release) \*\/ = \{[\s\S]*?\n\t\t\};/g)];
for (const match of blocks) {
  const original = match[0];
  if (!BUNDLE_IDS.some(id => original.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${id};`))) continue;

  let next = original;
  if (/DEVELOPMENT_TEAM = [^;]+;/.test(next)) {
    next = next.replace(/DEVELOPMENT_TEAM = [^;]+;/g, `DEVELOPMENT_TEAM = ${TEAM_ID};`);
  } else if (next.includes('CODE_SIGN_STYLE = Automatic;')) {
    next = next.replace(
      'CODE_SIGN_STYLE = Automatic;',
      `CODE_SIGN_STYLE = Automatic;\n\t\t\t\tDEVELOPMENT_TEAM = ${TEAM_ID};`
    );
  } else {
    next = next.replace(
      /PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/,
      `DEVELOPMENT_TEAM = ${TEAM_ID};\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = $1;`
    );
  }

  if (next !== original) {
    pbx = pbx.replace(original, next);
    patched += 1;
  }
}

if (patched < 4) {
  throw new Error(`Expected to configure 4 iOS build configurations, patched ${patched}`);
}

await writeFile(pbxPath, pbx, 'utf8');
console.log('Configured Apple Developer Team for New Hope 7:', TEAM_ID, 'build configurations:', patched);
