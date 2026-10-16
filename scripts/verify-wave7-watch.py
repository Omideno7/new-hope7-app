"""Static Watch/data-source validation only. This is not a Swift compiler or native build."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import json,plistlib,yaml,re,tempfile,subprocess,hashlib,collections,shutil
from importlib.util import spec_from_file_location,module_from_spec
spec=spec_from_file_location('watch_builder','scripts/build-watch-bible-wave7.py');module=module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory(prefix='nh7-watch-wave7-') as directory:
 out=Path(directory);metadata=module.build(out)
 assert metadata['network_requests']==0 and metadata['books']==66 and metadata['chapters']==1189
 expected=collections.defaultdict(list)
 for file in Path('data/bible/groups').glob('bible_group_*.json'):
  data=json.loads(file.read_bytes())
  for v in data['verses']:expected[(v['bookId'],v['chapter'])].append({'verse':v['verse'],'text':{l:v['text'][l] for l in ['fa','en','hr']}})
 for (book,number),verses in expected.items():assert json.loads((out/f'bible_{book}_{number}.json').read_bytes())==sorted(verses,key=lambda v:v['verse'])
 assert len(expected)==1189 and len(list(out.glob('bible_*.json')))==1190
 # Existing unrelated output is preserved, never removed by a build helper.
 (out/'owner-sentinel').write_text('Preserve exact')
 try:module.build(out)
 except AssertionError:pass
 else:raise AssertionError('Refuse unsafe output directory')
 assert (out/'owner-sentinel').read_text()=='Preserve exact'
 print('PASS Watch all 66/1189 bundled chapters byte-exact text FA/EN/HR; '+str(metadata['bible_resource_bytes'])+' static bytes; max chapter '+str(metadata['largest_chapter_bytes'])+' <=256KiB; no runtime cache/network; unknown output preserved')
plist=plistlib.loads(Path('watchos/NewHope7Watch/Info.plist').read_bytes());assert plist['WKApplication'] is True and plist['WKRunsIndependentlyOfCompanionApp'] is False and plist['WKWatchOnly'] is False
assert plist['WKCompanionAppBundleIdentifier']=='com.omideno7.newhope7.qa.wave7'
assert 'UIBackgroundModes' not in plist
project=yaml.safe_load(Path('watchos/project.yml').read_text());target=project['targets']['NewHope7Watch'];assert target['platform']=='watchOS' and target['deploymentTarget']=='10.0'
assert project['settings']['base']['CODE_SIGNING_ALLOWED']=='NO' and target['settings']['base']['CODE_SIGNING_ALLOWED']=='NO'
assert target['settings']['base']['PRODUCT_BUNDLE_IDENTIFIER']==plist['WKCompanionAppBundleIdentifier']+'.watchapp'
assert any(row.get('path')=='GeneratedBible' and row.get('buildPhase')=='resources' for row in target['sources'])
files=list(Path('watchos/NewHope7Watch').glob('*.swift'));assert len(files)==3
for p in files:
 source=p.read_text();assert source.count('{')==source.count('}') and source.count('(')==source.count(')'),p
 assert not re.search(r'URLSession|https?://|AVPlayer|Timer\(|scheduledTimer|Task\.sleep|service_role|sb_secret_|sk_live_|execute\(|deleteAccount',source),p
 assert not re.search(r'\.font\(\.system\(size:',source),p
root=Path('watchos/NewHope7Watch/NewHope7WatchApp.swift').read_text();labels=re.findall(r'^\s*"([\w]+)": \[([^\n]+)\]',root,re.M);assert len(labels)==9
for key,values in labels:assert len(re.findall(r'"(?:[^"\\]|\\.)*"',values))==3,key
assert '.rightToLeft' in root and '.leftToRight' in root and '@AppStorage("nh7WatchLanguage")' in root
bible=Path('watchos/NewHope7Watch/Bible.swift').read_text();assert 'size <= limit' in bible and 'data.count <= limit' in bible and 'rows.count <= 200' in bible and 'limit: 262144' in bible and 'limit: 32768' in bible and '.onDisappear { verses = [] }' in bible
assert 'WatchAudioAvailabilityView' in root and 'audioPhone' in Path('watchos/NewHope7Watch/Audio.swift').read_text()
print('PASS Swift source invariants, parsed YAML/plist, nine trilingual labels, semantic Dynamic Type/RTL, unsigned QA identity; no direct protected audio/catalog bypass')
print('BLOCKED_TOOLCHAIN: Xcode/watchOS SDK/XcodeGen unavailable in this Linux gate. Swift compilation/API compatibility not proven; installation/pairing PHYSICAL_QA_ONLY.')
