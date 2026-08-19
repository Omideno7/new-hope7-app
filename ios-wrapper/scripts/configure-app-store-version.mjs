import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperRoot = path.resolve(here, '..');
const pbxPath = path.join(wrapperRoot, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

const APP_STORE_VERSION = '1.0';
const BUILD_NUMBER = '1';

let pbx = await readFile(pbxPath, 'utf8');
pbx = pbx.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${APP_STORE_VERSION};`);
pbx = pbx.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${BUILD_NUMBER};`);

await writeFile(pbxPath, pbx, 'utf8');
console.log(`Aligned iOS app and extensions to App Store version ${APP_STORE_VERSION} (${BUILD_NUMBER}).`);
