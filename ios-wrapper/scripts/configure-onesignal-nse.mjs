import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperRoot = path.resolve(here, '..');
const appProjectRoot = path.join(wrapperRoot, 'ios', 'App');
const projectPath = path.join(appProjectRoot, 'App.xcodeproj', 'project.pbxproj');
const extensionName = 'OneSignalNotificationServiceExtension';
const extensionRoot = path.join(appProjectRoot, extensionName);
const mainBundleId = 'com.omideno7.newhope7';
const extensionBundleId = `${mainBundleId}.${extensionName}`;
const appGroup = `group.${mainBundleId}.onesignal`;

const ids = {
  target: '7A0000010000000000000001',
  product: '7A0000020000000000000002',
  group: '7A0000030000000000000003',
  swiftRef: '7A0000040000000000000004',
  plistRef: '7A0000050000000000000005',
  entitlementsRef: '7A0000060000000000000006',
  swiftBuild: '7A0000070000000000000007',
  sourcesPhase: '7A0000080000000000000008',
  frameworksPhase: '7A0000090000000000000009',
  resourcesPhase: '7A00000A000000000000000A',
  debugConfig: '7A00000B000000000000000B',
  releaseConfig: '7A00000C000000000000000C',
  configList: '7A00000D000000000000000D',
  embedPhase: '7A00000E000000000000000E',
  embedBuild: '7A00000F000000000000000F',
  containerProxy: '7A0000100000000000000010',
  targetDependency: '7A0000110000000000000011',
  packageRef: '7A0000120000000000000012',
  packageProduct: '7A0000130000000000000013',
  frameworkBuild: '7A0000140000000000000014'
};

await mkdir(extensionRoot, { recursive: true });

await writeFile(path.join(extensionRoot, 'NotificationService.swift'), `import UserNotifications\nimport OneSignalExtension\n\nclass NotificationService: UNNotificationServiceExtension {\n    var contentHandler: ((UNNotificationContent) -> Void)?\n    var receivedRequest: UNNotificationRequest!\n    var bestAttemptContent: UNMutableNotificationContent?\n\n    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {\n        self.receivedRequest = request\n        self.contentHandler = contentHandler\n        self.bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)\n\n        if let bestAttemptContent = bestAttemptContent {\n            OneSignalExtension.didReceiveNotificationExtensionRequest(\n                self.receivedRequest,\n                with: bestAttemptContent,\n                withContentHandler: self.contentHandler\n            )\n        }\n    }\n\n    override func serviceExtensionTimeWillExpire() {\n        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {\n            OneSignalExtension.serviceExtensionTimeWillExpireRequest(\n                self.receivedRequest,\n                with: self.bestAttemptContent\n            )\n            contentHandler(bestAttemptContent)\n        }\n    }\n}\n`, 'utf8');

await writeFile(path.join(extensionRoot, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>CFBundleDevelopmentRegion</key>\n\t<string>$(DEVELOPMENT_LANGUAGE)</string>\n\t<key>CFBundleDisplayName</key>\n\t<string>New Hope 7 Notification Service</string>\n\t<key>CFBundleExecutable</key>\n\t<string>$(EXECUTABLE_NAME)</string>\n\t<key>CFBundleIdentifier</key>\n\t<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>\n\t<key>CFBundleInfoDictionaryVersion</key>\n\t<string>6.0</string>\n\t<key>CFBundleName</key>\n\t<string>$(PRODUCT_NAME)</string>\n\t<key>CFBundlePackageType</key>\n\t<string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>\n\t<key>CFBundleShortVersionString</key>\n\t<string>$(MARKETING_VERSION)</string>\n\t<key>CFBundleVersion</key>\n\t<string>$(CURRENT_PROJECT_VERSION)</string>\n\t<key>NSExtension</key>\n\t<dict>\n\t\t<key>NSExtensionPointIdentifier</key>\n\t\t<string>com.apple.usernotifications.service</string>\n\t\t<key>NSExtensionPrincipalClass</key>\n\t\t<string>$(PRODUCT_MODULE_NAME).NotificationService</string>\n\t</dict>\n\t<key>OneSignal_app_groups_key</key>\n\t<string>${appGroup}</string>\n</dict>\n</plist>\n`, 'utf8');

await writeFile(path.join(extensionRoot, 'NewHope7OneSignalExtension.entitlements'), `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>com.apple.security.application-groups</key>\n\t<array>\n\t\t<string>${appGroup}</string>\n\t</array>\n</dict>\n</plist>\n`, 'utf8');

let pbx = await readFile(projectPath, 'utf8');
if (pbx.includes(`${ids.target} /* ${extensionName} */`)) {
  console.log('OneSignal Notification Service Extension already configured.');
  process.exit(0);
}

const mainTargetId = pbx.match(/([0-9A-F]{24}) \/\* App \*\/ = \{\n\s*isa = PBXNativeTarget;/)?.[1];
const projectId = pbx.match(/([0-9A-F]{24}) \/\* Project object \*\/ = \{\n\s*isa = PBXProject;/)?.[1];
if (!mainTargetId || !projectId) throw new Error('Could not locate the generated Capacitor App target/project.');

function matchingBrace(text, openIndex) {
  let depth = 0, quoted = false, escaped = false;
  for (let i = openIndex; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === '{') depth += 1;
    else if (c === '}' && --depth === 0) return i;
  }
  throw new Error('Unbalanced PBX object braces.');
}

function mutateObject(id, mutation) {
  const needle = `\t\t${id}`;
  let start = -1;
  let offset = 0;
  for (const line of pbx.split('\n')) {
    if (line.startsWith(needle) && line.includes(' = {')) {
      start = offset;
      break;
    }
    offset += line.length + 1;
  }
  if (start < 0) throw new Error(`Missing PBX object ${id}`);
  const open = pbx.indexOf('{', start);
  const close = matchingBrace(pbx, open);
  const original = pbx.slice(start, close + 1);
  const replacement = mutation(original);
  pbx = pbx.slice(0, start) + replacement + pbx.slice(close + 1);
}

function prependArrayItem(block, key, line) {
  const pattern = new RegExp(`(${key} = \\(\\n)`);
  if (!pattern.test(block)) throw new Error(`Missing PBX array ${key}`);
  return block.replace(pattern, `$1\t\t\t\t${line}\n`);
}

function appendSection(section, entry, beforeSection = null) {
  const endMarker = `/* End ${section} section */`;
  if (pbx.includes(endMarker)) {
    pbx = pbx.replace(endMarker, `${entry}\n${endMarker}`);
    return;
  }
  if (!beforeSection) throw new Error(`Missing PBX section ${section}`);
  const beforeMarker = `/* Begin ${beforeSection} section */`;
  if (!pbx.includes(beforeMarker)) throw new Error(`Missing PBX insertion point ${beforeSection}`);
  pbx = pbx.replace(beforeMarker, `/* Begin ${section} section */\n${entry}\n/* End ${section} section */\n\n${beforeMarker}`);
}

appendSection('PBXBuildFile', `\t\t${ids.swiftBuild} /* NotificationService.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${ids.swiftRef} /* NotificationService.swift */; };\n\t\t${ids.embedBuild} /* ${extensionName}.appex in Embed App Extensions */ = {isa = PBXBuildFile; fileRef = ${ids.product} /* ${extensionName}.appex */; settings = {ATTRIBUTES = (CodeSignOnCopy, RemoveHeadersOnCopy, ); }; };\n\t\t${ids.frameworkBuild} /* OneSignalExtension in Frameworks */ = {isa = PBXBuildFile; productRef = ${ids.packageProduct} /* OneSignalExtension */; };`);

appendSection('PBXCopyFilesBuildPhase', `\t\t${ids.embedPhase} /* Embed App Extensions */ = {\n\t\t\tisa = PBXCopyFilesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tdstPath = \"\";\n\t\t\tdstSubfolderSpec = 13;\n\t\t\tfiles = (\n\t\t\t\t${ids.embedBuild} /* ${extensionName}.appex in Embed App Extensions */,\n\t\t\t);\n\t\t\tname = \"Embed App Extensions\";\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t};`, 'PBXFileReference');

appendSection('PBXContainerItemProxy', `\t\t${ids.containerProxy} /* PBXContainerItemProxy */ = {\n\t\t\tisa = PBXContainerItemProxy;\n\t\t\tcontainerPortal = ${projectId} /* Project object */;\n\t\t\tproxyType = 1;\n\t\t\tremoteGlobalIDString = ${ids.target};\n\t\t\tremoteInfo = ${extensionName};\n\t\t};`, 'PBXCopyFilesBuildPhase');

appendSection('PBXFileReference', `\t\t${ids.product} /* ${extensionName}.appex */ = {isa = PBXFileReference; explicitFileType = \"wrapper.app-extension\"; includeInIndex = 0; path = ${extensionName}.appex; sourceTree = BUILT_PRODUCTS_DIR; };\n\t\t${ids.swiftRef} /* NotificationService.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = NotificationService.swift; sourceTree = \"<group>\"; };\n\t\t${ids.plistRef} /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; };\n\t\t${ids.entitlementsRef} /* NewHope7OneSignalExtension.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = NewHope7OneSignalExtension.entitlements; sourceTree = \"<group>\"; };`);

appendSection('PBXFrameworksBuildPhase', `\t\t${ids.frameworksPhase} /* Frameworks */ = {\n\t\t\tisa = PBXFrameworksBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t\t${ids.frameworkBuild} /* OneSignalExtension in Frameworks */,\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t};`);

appendSection('PBXGroup', `\t\t${ids.group} /* ${extensionName} */ = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t${ids.swiftRef} /* NotificationService.swift */,\n\t\t\t\t${ids.plistRef} /* Info.plist */,\n\t\t\t\t${ids.entitlementsRef} /* NewHope7OneSignalExtension.entitlements */,\n\t\t\t);\n\t\t\tpath = ${extensionName};\n\t\t\tsourceTree = \"<group>\";\n\t\t};`);

appendSection('PBXNativeTarget', `\t\t${ids.target} /* ${extensionName} */ = {\n\t\t\tisa = PBXNativeTarget;\n\t\t\tbuildConfigurationList = ${ids.configList} /* Build configuration list for PBXNativeTarget \"${extensionName}\" */;\n\t\t\tbuildPhases = (\n\t\t\t\t${ids.sourcesPhase} /* Sources */,\n\t\t\t\t${ids.frameworksPhase} /* Frameworks */,\n\t\t\t\t${ids.resourcesPhase} /* Resources */,\n\t\t\t);\n\t\t\tbuildRules = (\n\t\t\t);\n\t\t\tdependencies = (\n\t\t\t);\n\t\t\tname = ${extensionName};\n\t\t\tpackageProductDependencies = (\n\t\t\t\t${ids.packageProduct} /* OneSignalExtension */,\n\t\t\t);\n\t\t\tproductName = ${extensionName};\n\t\t\tproductReference = ${ids.product} /* ${extensionName}.appex */;\n\t\t\tproductType = \"com.apple.product-type.app-extension\";\n\t\t};`);

appendSection('PBXResourcesBuildPhase', `\t\t${ids.resourcesPhase} /* Resources */ = {\n\t\t\tisa = PBXResourcesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t};`);

appendSection('PBXSourcesBuildPhase', `\t\t${ids.sourcesPhase} /* Sources */ = {\n\t\t\tisa = PBXSourcesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t\t${ids.swiftBuild} /* NotificationService.swift in Sources */,\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t};`);

appendSection('PBXTargetDependency', `\t\t${ids.targetDependency} /* PBXTargetDependency */ = {\n\t\t\tisa = PBXTargetDependency;\n\t\t\ttarget = ${ids.target} /* ${extensionName} */;\n\t\t\ttargetProxy = ${ids.containerProxy} /* PBXContainerItemProxy */;\n\t\t};`, 'PBXVariantGroup');

let mainGroupId, productsGroupId;
mutateObject(projectId, block => {
  mainGroupId = block.match(/mainGroup = ([0-9A-F]{24})/)?.[1];
  productsGroupId = block.match(/productRefGroup = ([0-9A-F]{24})/)?.[1];
  if (!mainGroupId || !productsGroupId) throw new Error('Could not locate project groups.');
  return block;
});

mutateObject(mainGroupId, block => prependArrayItem(block, 'children', `${ids.group} /* ${extensionName} */,`));
mutateObject(productsGroupId, block => prependArrayItem(block, 'children', `${ids.product} /* ${extensionName}.appex */,`));
mutateObject(mainTargetId, block => {
  block = prependArrayItem(block, 'buildPhases', `${ids.embedPhase} /* Embed App Extensions */,`);
  block = prependArrayItem(block, 'dependencies', `${ids.targetDependency} /* PBXTargetDependency */,`);
  return block;
});

mutateObject(projectId, block => {
  block = prependArrayItem(block, 'targets', `${ids.target} /* ${extensionName} */,`);
  block = prependArrayItem(block, 'packageReferences', `${ids.packageRef} /* XCRemoteSwiftPackageReference \"OneSignal-XCFramework\" */,`);

  const attributesMarker = 'TargetAttributes = {';
  const markerIndex = block.indexOf(attributesMarker);
  if (markerIndex < 0) throw new Error('Could not locate TargetAttributes.');
  const attributesOpen = block.indexOf('{', markerIndex);
  const attributesClose = matchingBrace(block, attributesOpen);
  const extensionAttributes = `\n\t\t\t\t\t${ids.target} = {\n\t\t\t\t\t\tCreatedOnToolsVersion = 26.0;\n\t\t\t\t\t\tProvisioningStyle = Automatic;\n\t\t\t\t\t\tSystemCapabilities = {\n\t\t\t\t\t\t\tcom.apple.ApplicationGroups.iOS = {\n\t\t\t\t\t\t\t\tenabled = 1;\n\t\t\t\t\t\t\t};\n\t\t\t\t\t\t};\n\t\t\t\t\t};\n\t\t\t\t`;
  return block.slice(0, attributesClose) + extensionAttributes + block.slice(attributesClose);
});

appendSection('XCBuildConfiguration', `\t\t${ids.debugConfig} /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {\n\t\t\t\tAPPLICATION_EXTENSION_API_ONLY = YES;\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = ${extensionName}/NewHope7OneSignalExtension.entitlements;\n\t\t\t\tCODE_SIGN_STYLE = Automatic;\n\t\t\t\tCURRENT_PROJECT_VERSION = 1;\n\t\t\t\tINFOPLIST_FILE = ${extensionName}/Info.plist;\n\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 15.0;\n\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (\n\t\t\t\t\t\"$(inherited)\",\n\t\t\t\t\t\"@executable_path/Frameworks\",\n\t\t\t\t\t\"@executable_path/../../Frameworks\",\n\t\t\t\t);\n\t\t\t\tMARKETING_VERSION = 2.3.9;\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = ${extensionBundleId};\n\t\t\t\tPRODUCT_NAME = \"$(TARGET_NAME)\";\n\t\t\t\tSKIP_INSTALL = YES;\n\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;\n\t\t\t\tSWIFT_VERSION = 5.0;\n\t\t\t\tTARGETED_DEVICE_FAMILY = \"1,2\";\n\t\t\t};\n\t\t\tname = Debug;\n\t\t};\n\t\t${ids.releaseConfig} /* Release */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {\n\t\t\t\tAPPLICATION_EXTENSION_API_ONLY = YES;\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = ${extensionName}/NewHope7OneSignalExtension.entitlements;\n\t\t\t\tCODE_SIGN_STYLE = Automatic;\n\t\t\t\tCURRENT_PROJECT_VERSION = 1;\n\t\t\t\tINFOPLIST_FILE = ${extensionName}/Info.plist;\n\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 15.0;\n\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (\n\t\t\t\t\t\"$(inherited)\",\n\t\t\t\t\t\"@executable_path/Frameworks\",\n\t\t\t\t\t\"@executable_path/../../Frameworks\",\n\t\t\t\t);\n\t\t\t\tMARKETING_VERSION = 2.3.9;\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = ${extensionBundleId};\n\t\t\t\tPRODUCT_NAME = \"$(TARGET_NAME)\";\n\t\t\t\tSKIP_INSTALL = YES;\n\t\t\t\tSWIFT_VERSION = 5.0;\n\t\t\t\tTARGETED_DEVICE_FAMILY = \"1,2\";\n\t\t\t};\n\t\t\tname = Release;\n\t\t};`);

appendSection('XCConfigurationList', `\t\t${ids.configList} /* Build configuration list for PBXNativeTarget \"${extensionName}\" */ = {\n\t\t\tisa = XCConfigurationList;\n\t\t\tbuildConfigurations = (\n\t\t\t\t${ids.debugConfig} /* Debug */,\n\t\t\t\t${ids.releaseConfig} /* Release */,\n\t\t\t);\n\t\t\tdefaultConfigurationIsVisible = 0;\n\t\t\tdefaultConfigurationName = Release;\n\t\t};`);

appendSection('XCRemoteSwiftPackageReference', `\t\t${ids.packageRef} /* XCRemoteSwiftPackageReference \"OneSignal-XCFramework\" */ = {\n\t\t\tisa = XCRemoteSwiftPackageReference;\n\t\t\trepositoryURL = \"https://github.com/OneSignal/OneSignal-XCFramework\";\n\t\t\trequirement = {\n\t\t\t\tkind = upToNextMajorVersion;\n\t\t\t\tminimumVersion = 5.0.0;\n\t\t\t};\n\t\t};`, 'XCSwiftPackageProductDependency');

appendSection('XCSwiftPackageProductDependency', `\t\t${ids.packageProduct} /* OneSignalExtension */ = {\n\t\t\tisa = XCSwiftPackageProductDependency;\n\t\t\tpackage = ${ids.packageRef} /* XCRemoteSwiftPackageReference \"OneSignal-XCFramework\" */;\n\t\t\tproductName = OneSignalExtension;\n\t\t};`);

await writeFile(projectPath, pbx, 'utf8');
console.log('Configured OneSignal Notification Service Extension:', {
  extensionName,
  extensionBundleId,
  appGroup
});
