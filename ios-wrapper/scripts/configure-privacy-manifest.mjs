import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperRoot = path.resolve(here, '..');
const appRoot = path.join(wrapperRoot, 'ios', 'App');
const appSource = path.join(appRoot, 'App');
const projectPath = path.join(appRoot, 'App.xcodeproj', 'project.pbxproj');
const privacyPath = path.join(appSource, 'PrivacyInfo.xcprivacy');

const FILE_REF = '7B0000010000000000000001';
const BUILD_REF = '7B0000020000000000000002';

const collected = [
  ['NSPrivacyCollectedDataTypeName', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']],
  ['NSPrivacyCollectedDataTypeEmailAddress', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']],
  ['NSPrivacyCollectedDataTypePhoneNumber', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']],
  ['NSPrivacyCollectedDataTypeSensitiveInfo', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']],
  ['NSPrivacyCollectedDataTypeOtherUserContent', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']],
  ['NSPrivacyCollectedDataTypeUserID', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']],
  ['NSPrivacyCollectedDataTypeDeviceID', ['NSPrivacyCollectedDataTypePurposeAppFunctionality', 'NSPrivacyCollectedDataTypePurposeAnalytics']],
  ['NSPrivacyCollectedDataTypeProductInteraction', ['NSPrivacyCollectedDataTypePurposeAnalytics']],
  ['NSPrivacyCollectedDataTypeOtherDataTypes', ['NSPrivacyCollectedDataTypePurposeAppFunctionality']]
];

const collectedXml = collected.map(([type, purposes]) => `\t\t<dict>\n\t\t\t<key>NSPrivacyCollectedDataType</key>\n\t\t\t<string>${type}</string>\n\t\t\t<key>NSPrivacyCollectedDataTypeLinked</key>\n\t\t\t<true/>\n\t\t\t<key>NSPrivacyCollectedDataTypeTracking</key>\n\t\t\t<false/>\n\t\t\t<key>NSPrivacyCollectedDataTypePurposes</key>\n\t\t\t<array>\n${purposes.map(p => `\t\t\t\t<string>${p}</string>`).join('\n')}\n\t\t\t</array>\n\t\t</dict>`).join('\n');

const manifest = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>NSPrivacyTracking</key>\n\t<false/>\n\t<key>NSPrivacyTrackingDomains</key>\n\t<array/>\n\t<key>NSPrivacyCollectedDataTypes</key>\n\t<array>\n${collectedXml}\n\t</array>\n\t<key>NSPrivacyAccessedAPITypes</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>NSPrivacyAccessedAPIType</key>\n\t\t\t<string>NSPrivacyAccessedAPICategoryFileTimestamp</string>\n\t\t\t<key>NSPrivacyAccessedAPITypeReasons</key>\n\t\t\t<array>\n\t\t\t\t<string>C617.1</string>\n\t\t\t</array>\n\t\t</dict>\n\t</array>\n</dict>\n</plist>\n`;

await writeFile(privacyPath, manifest, 'utf8');
let pbx = await readFile(projectPath, 'utf8');

if (!pbx.includes(`${FILE_REF} /* PrivacyInfo.xcprivacy */`)) {
  const buildEnd = '/* End PBXBuildFile section */';
  const fileEnd = '/* End PBXFileReference section */';
  if (!pbx.includes(buildEnd) || !pbx.includes(fileEnd)) throw new Error('Missing PBX file sections');
  pbx = pbx.replace(buildEnd, `\t\t${BUILD_REF} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${FILE_REF} /* PrivacyInfo.xcprivacy */; };\n${buildEnd}`);
  pbx = pbx.replace(fileEnd, `\t\t${FILE_REF} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = \"<group>\"; };\n${fileEnd}`);

  const appGroupMatch = pbx.match(/([0-9A-F]{24}) \/\* App \*\/ = \{\n\s*isa = PBXGroup;[\s\S]*?\n\s*\};/);
  if (!appGroupMatch) throw new Error('Could not locate App PBXGroup');
  let appGroup = appGroupMatch[0];
  appGroup = appGroup.replace(/(children = \(\n)/, `$1\t\t\t\t${FILE_REF} /* PrivacyInfo.xcprivacy */,\n`);
  pbx = pbx.replace(appGroupMatch[0], appGroup);

  const resourceMatches = [...pbx.matchAll(/([0-9A-F]{24}) \/\* Resources \*\/ = \{\n\s*isa = PBXResourcesBuildPhase;[\s\S]*?\n\s*\};/g)];
  const mainResources = resourceMatches.find(m => m[0].includes('public in Resources'));
  if (!mainResources) throw new Error('Could not locate main App resources phase');
  let resources = mainResources[0];
  resources = resources.replace(/(files = \(\n)/, `$1\t\t\t\t${BUILD_REF} /* PrivacyInfo.xcprivacy in Resources */,\n`);
  pbx = pbx.replace(mainResources[0], resources);
}

await writeFile(projectPath, pbx, 'utf8');
console.log('Configured New Hope 7 PrivacyInfo.xcprivacy with FileTimestamp reason C617.1 and app data disclosures.');
