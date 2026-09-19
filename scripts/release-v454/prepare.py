"""Prepare clean production runtime from an exact tested source, never a whole-branch merge."""
from pathlib import Path
import hashlib,json,os,re,subprocess
BASE=os.environ['BASE_SHA'];SOURCE=os.environ['SOURCE_SHA'];OUT=Path(os.environ['QA_OUTPUT']);OUT.mkdir(exist_ok=True,parents=True)
def git(ref,name):return subprocess.check_output(['git','show',ref+':'+name])
files=['index.html','js/app.js','js/nh7-reader-toolbar-v452.js','js/nh7-apocrypha-preview-v240.js','js/nh7-apocrypha-v270.js','js/nh7-theme-studio-v453.js','js/nh7-original-language-v453.js','js/nh7-fonts-v454.js','js/nh7-audio-quick-bible-v454.js','css/nh7-theme-studio-v453.css','css/nh7-study-reader-v453.css','css/nh7-fonts-quick-bible-v454.css','data/lexicon/original-language-core-v454.json','data/lexicon/ATTRIBUTION-v453.md']
font_files=subprocess.check_output(['git','ls-tree','-r','--name-only',SOURCE,'--','assets/fonts/v453','assets/fonts/v454'],text=True).splitlines();assert font_files and sum(p.endswith('.woff2') for p in font_files)==8
files+=font_files
for name in files:
 p=Path(name);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(git(SOURCE,name))
p=Path('index.html');text=p.read_text().replace('service-worker.js?v=4.5.2','service-worker.js?v=4.5.4')
assert 'nh7-study-preview' not in text and 'study-preview.html' not in text and 'nh7-reader-preview' not in text
p.write_text(text)
# Runtime code is exactly the code tested in the full-app harness.
for name in files:
 if name!='index.html':assert Path(name).read_bytes()==git(SOURCE,name),name
# Normalize upstream license whitespace only. Keep every word and copyright notice.
# Font binaries and all executable runtime files remain byte-identical to SOURCE.
license_report=[]
for name in font_files:
 if not name.endswith('-OFL.txt'):continue
 p=Path(name);original=git(SOURCE,name).decode('utf-8')
 normalized='\n'.join(line.rstrip(' \t\r') for line in original.splitlines()).rstrip('\n')+'\n'
 assert original.split()==normalized.split(),name
 assert 'SIL OPEN FONT LICENSE' in normalized,name
 p.write_text(normalized,encoding='utf-8',newline='\n')
 license_report.append({'path':name,'wordingUnchanged':True,'upstreamSha256':hashlib.sha256(original.encode('utf-8')).hexdigest(),'normalizedSha256':hashlib.sha256(p.read_bytes()).hexdigest()})
assert len(license_report)==8
(OUT/'license-format-report.json').write_text(json.dumps({'status':'passed','normalization':'line endings, trailing whitespace and terminal blank lines only','licenses':license_report},indent=2))
p=Path('sw-release-core-v403.js');text=git(BASE,str(p)).decode()
text=text.replace("'4.5.2-reader'","'4.5.4-study'").replace("'nh7-release-core-v452-reader'","'nh7-release-core-v454-study'")
paths=[name for name in files if name.endswith(('.js','.css','.json','.woff2')) and name!='index.html']
assets=re.search(r'const NH7_RELEASE_ASSETS=\[([\s\S]*?)\];',text);assert assets
previous=re.findall(r"'([^']+)'",assets[1]);extra=['./'+n for n in paths if './'+n not in previous]
text=text[:assets.end(1)]+(',\n  '+','.join(repr(n) for n in extra) if extra else '')+text[assets.end(1):]
pattern=r'const NH7_READER_RELEASE_PATHS_V452=new Set\((\[[^;]+\])\);';m=re.search(pattern,text);assert m
prior=json.loads(m[1]);all_paths=list(dict.fromkeys(prior+paths));text=text[:m.start(1)]+json.dumps(all_paths)+text[m.end(1):]
text=text.replace("relative.endsWith('.css')?'text/css':'application/javascript'","relative.endsWith('.css')?'text/css':relative.endsWith('.woff2')?'font/woff2':relative.endsWith('.json')?'application/json':'application/javascript'")
p.write_text(text)
p=Path('service-worker.js');text=git(BASE,str(p)).decode();assert 'sw-release-core-v403.js?v=4.5.2' in text;p.write_text(text.replace('sw-release-core-v403.js?v=4.5.2','sw-release-core-v403.js?v=4.5.4'))
files+=['service-worker.js','sw-release-core-v403.js']
subprocess.run(['git','diff','--exit-code',BASE,'--','data/bible','data/apocrypha','supabase','version.json','manifest.json','app','.github','js/nh7-audio-classic-v400.js'],check=True)
subprocess.run(['git','diff','--check'],check=True)
for name in files:
 if name.endswith('.js'):subprocess.run(['node','--check',name],check=True)
(OUT/'allowed-files.json').write_text(json.dumps(files,indent=2))
(OUT/'runtime-hashes.json').write_text(json.dumps({name:hashlib.sha256(Path(name).read_bytes()).hexdigest() for name in files},indent=2))
(OUT/'scope-report.json').write_text(json.dumps({'status':'passed','base':BASE,'testedSource':SOURCE,'runtimeOnlyFiles':files,'cacheHandlerScope':all_paths,'nativeVersionUnchanged':True,'scriptureCorpusUnchanged':True,'classicAudioLogicUnchanged':True,'publicLexiconEntries':60,'bundledFonts':8,'previewFilesExcluded':True,'licenseWordingUnchanged':True},indent=2))
print('Prepared clean runtime and scoped font/lexicon caches; no user-data migration.')
