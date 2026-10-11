#!/bin/bash
# Run on the existing R7 build Mac only. No project/dependency regeneration.
set -euo pipefail
[[ "$(uname -s)" == Darwin ]] || { echo 'Requires the R7 MacBook/Xcode wrapper; this is not a Linux build.' >&2; exit 1; }
qa_head="${1:?Usage: bash scripts/build-pr241-ios-device-qa-r8.sh EXACT_PR_HEAD [--install]}"
[[ "$qa_head" =~ ^[0-9a-f]{40}$ ]] || { echo 'Supply the full exact PR head SHA.' >&2; exit 1; }
qa_root=/Users/admin/NH7-PR241-DeviceQA
qa_wrapper="$qa_root/ios-release"
qa_app_id=com.omideno7.newhope7.qa241r8
qa_derived="$qa_root/DerivedData-DeviceQA-r8"
cd "$qa_root"
test -f "$qa_wrapper/ios/App/App.xcodeproj/project.pbxproj"
test -x "$qa_wrapper/node_modules/.bin/cap"
[[ ! -L "$qa_wrapper/www" ]] || { echo 'Refusing a symlinked Web payload.' >&2; exit 1; }

git fetch origin codex/web-mobile-parity-safe-v573
[[ "$(git rev-parse HEAD)" == "$qa_head" ]] || { echo 'Local HEAD differs; update the branch without discarding local README changes, then rerun.' >&2; exit 1; }
[[ "$(git branch --show-current)" == codex/web-mobile-parity-safe-v573 ]]
[[ "$(git rev-parse FETCH_HEAD)" == "$qa_head" ]] || { echo 'Remote branch moved; do not build a stale head.' >&2; exit 1; }

# Read-only GitHub gate. Every required validation workflow must be green at this SHA.
qa_gate=$(mktemp -d)
trap 'rm -rf "$qa_gate"' EXIT
gh api repos/Omideno7/new-hope7-app/pulls/241 > "$qa_gate/pr.json"
gh api "repos/Omideno7/new-hope7-app/actions/runs?head_sha=$qa_head&event=pull_request&per_page=100" > "$qa_gate/runs.json"
python3 - "$qa_head" "$qa_gate" "$qa_wrapper" <<'PY'
import json,sys
from pathlib import Path
sha,gate,wrapper=sys.argv[1:];gate=Path(gate);wrapper=Path(wrapper)
pr=json.loads((gate/'pr.json').read_text())
assert pr['head']['sha']==sha and pr['draft'], 'PR head moved or PR is no longer Draft'
runs=json.loads((gate/'runs.json').read_text())['workflow_runs']
for workflow in ['deploy-pages.yml','next-native-optimization-guard.yml','web-parity-v573.yml']:
    matching=[r for r in runs if r['head_sha']==sha and r['path'].split('@')[0].endswith('/'+workflow)]
    assert matching, f'No exact-head CI evidence for {workflow}'
    latest=max(matching,key=lambda r:(r['run_number'],r.get('run_attempt',1)))
    assert latest['status']=='completed' and latest['conclusion']=='success', f'{workflow} is not green'
expected={'@capacitor/core':'8.5.0','@capacitor/ios':'8.5.0','@capacitor/file-transfer':'2.0.5','@capacitor/filesystem':'8.1.3','@capacitor/local-notifications':'8.3.1','@capacitor/cli':'8.5.0'}
package=json.loads((wrapper/'package.json').read_text())
declared={**package.get('dependencies',{}),**package.get('devDependencies',{})}
for name,version in expected.items():
    assert declared.get(name)==version, f'R7 version changed: {name}'
    assert json.loads((wrapper/'node_modules'/name/'package.json').read_text())['version']==version, f'Installed R7 dependency differs: {name}'
config=json.loads((wrapper/'capacitor.config.json').read_text())
assert config['ios']['contentInset']=='automatic', 'R7 inset config changed; inspect before proceeding'
assert config['appId'] in ['com.omideno7.newhope7.qa241r7','com.omideno7.newhope7.qa241r8'], 'Refusing a Production/unknown wrapper'
print('Exact Draft PR head and all three CI workflows verified; R7 dependency versions preserved.')
PY

# Build only committed content. Preserve the old QA payload/config as local backups.
qa_stamp=$(date +%Y%m%d-%H%M%S)
if [[ -d "$qa_wrapper/www" ]]; then mv "$qa_wrapper/www" "$qa_wrapper/www.before-r8-$qa_stamp"; fi
mkdir "$qa_wrapper/www"
git archive "$qa_head" | tar -x -C "$qa_wrapper/www"
cp "$qa_wrapper/capacitor.config.json" "$qa_wrapper/capacitor.config.json.before-r8-$qa_stamp"
python3 - "$qa_wrapper/capacitor.config.json" <<'PY'
import json,sys
from pathlib import Path
p=Path(sys.argv[1]);config=json.loads(p.read_text())
config['appId']='com.omideno7.newhope7.qa241r8';config['appName']='NH7 QA241 R8'
p.write_text(json.dumps(config,indent=2)+'\n')
PY
cd "$qa_wrapper"
./node_modules/.bin/cap copy ios
cd "$qa_wrapper/ios/App"
xcodebuild -project App.xcodeproj -scheme App -configuration Debug -sdk iphoneos \
  -derivedDataPath "$qa_derived" -allowProvisioningUpdates -allowProvisioningDeviceRegistration \
  DEVELOPMENT_TEAM=CDLUYR2TH9 CODE_SIGN_STYLE=Automatic PRODUCT_BUNDLE_IDENTIFIER="$qa_app_id" \
  build > "$qa_root/BUILD_QA241_R8.log" 2>&1
qa_app="$qa_derived/Build/Products/Debug-iphoneos/App.app"
python3 - "$qa_app" "$qa_wrapper/www" "$qa_head" "$qa_root" <<'PY'
import hashlib,json,plistlib,sys
from pathlib import Path
app,web,sha,root=map(Path,sys.argv[1:])
info=plistlib.loads((app/'Info.plist').read_bytes())
assert info['CFBundleIdentifier']=='com.omideno7.newhope7.qa241r8'
files=['index.html','css/nh7-web-parity-v573.css','js/nh7-web-parity-v573.js','js/nh7-profile-photo-v564.js','js/app.js']
hashes={}
for f in files:
    expected=hashlib.sha256((web/f).read_bytes()).hexdigest()
    assert hashlib.sha256((app/'public'/f).read_bytes()).hexdigest()==expected, f'Embedded payload mismatch: {f}'
    hashes[f]=expected
(root/'QA241_R8_PROVENANCE.json').write_text(json.dumps({'pr':241,'head':str(sha),'appId':info['CFBundleIdentifier'],'files':hashes,'physicalVerification':'PENDING'},indent=2)+'\n')
print('R8 signed QA App.app built with verified payload. Physical WKWebView verification remains pending.')
PY
if [[ "${2:-}" == --install ]]; then
  for qa_device in 58F7206A-4B49-572F-B26E-564B2407F90F 915E55CE-D6E7-5BA5-A1FB-B434628D9257; do
    xcrun devicectl device install app --device "$qa_device" "$qa_app"
    xcrun devicectl device process launch --device "$qa_device" "$qa_app_id"
  done
fi
printf 'QA App: %s\nBuild log: %s\n' "$qa_app" "$qa_root/BUILD_QA241_R8.log"
