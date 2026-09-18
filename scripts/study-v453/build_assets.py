"""Build public static study assets from pinned sources. No database or credentials."""
from pathlib import Path
import concurrent.futures,hashlib,io,json,re,subprocess,tarfile,tempfile,unicodedata,urllib.request,xml.etree.ElementTree as ET
from fontTools.ttLib import TTFont
OUT=Path('qa-study453');OUT.mkdir(exist_ok=True)
FONT_COMMIT='f2bd09badbc763d8757951d52deec29da27e85fb'
OLD_COMMIT='03b8ca7a26427abf235f04b89b9db0c49a9bc984'
STRONG_COMMIT='0acd2f251c2d35ff8db2dece4e0593979d3ac223'
GREEK_COMMIT='aaed91e57c8e4a8dc9a2383e129ca5e75fe6393d'
HEBREW_COMMIT='3d15126fb1ef74867fc1434be1942e837932691f'
TMP=Path(tempfile.mkdtemp(prefix='nh7-study-sources-'))
manifest={}
def get(url):
    assert url.startswith(('https://raw.githubusercontent.com/','https://codeload.github.com/'))
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'NewHope7-Static-Study-Builder'}),timeout=90) as r:
        assert r.status==200
        data=r.read()
    manifest[url]=hashlib.sha256(data).hexdigest();return data

def raw(repo,commit,path):return get('https://raw.githubusercontent.com/'+repo+'/'+commit+'/'+urllib.parse.quote(path,safe='/'))
def archive(repo,commit):
    data=get(f'https://codeload.github.com/{repo}/tar.gz/{commit}')
    target=TMP/repo.replace('/','-');target.mkdir()
    with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as t:t.extractall(target,filter='data')
    return next(target.iterdir())

def font(family):
    folder='ofl/'+family+'/'
    meta=raw('google/fonts',FONT_COMMIT,folder+'METADATA.pb').decode()
    assert 'license: "OFL"' in meta,family
    blocks=re.findall(r'fonts \{([\s\S]*?)\n\}',meta)
    block=next(b for b in blocks if 'style: "normal"' in b)
    filename=re.search(r'filename: "([^"]+)"',block)[1]
    license_text=raw('google/fonts',FONT_COMMIT,folder+'OFL.txt')
    assert b'SIL OPEN FONT LICENSE' in license_text
    data=raw('google/fonts',FONT_COMMIT,folder+filename)
    f=TTFont(io.BytesIO(data));cmap=f.getBestCmap();chars='پچژگیک' if family in ['vazirmatn','notonaskharabic','estedad'] else 'čćžšđČĆŽŠĐ'
    assert all(ord(c) in cmap for c in chars),(family,chars)
    f.flavor='woff2';base=Path('assets/fonts/v453');base.mkdir(parents=True,exist_ok=True);f.save(base/(family+'.woff2'))
    (base/(family+'-OFL.txt')).write_bytes(license_text)
    return{'family':family,'source':f'https://github.com/google/fonts/tree/{FONT_COMMIT}/{folder}','bytes':(base/(family+'.woff2')).stat().st_size,'scriptCoverageTest':chars,'license':'OFL-1.1'}
fonts=list(concurrent.futures.ThreadPoolExecutor(max_workers=3).map(font,['vazirmatn','notonaskharabic','estedad','inter','lora','nunitosans']))
Path('assets/fonts/v453/manifest.json').write_text(json.dumps({'fonts':fonts,'sourceCommit':FONT_COMMIT},ensure_ascii=False,indent=2))
print('Six licensed, script-checked font families packaged.',flush=True)

legacy=raw('Omideno7/omideno7-app',OLD_COMMIT,'v55-keywords-expanded-and-style-fix.js')
assert hashlib.sha1(b'blob '+str(len(legacy)).encode()+b'\0'+legacy).hexdigest()=='2cc38df240240fb8231ec31a2043bc2af58736c8'
links=json.JSONDecoder().raw_decode(legacy.decode().split('const EXTRA_KEY_TERMS = ',1)[1])[0]
old={row['id']:row for rows in links.values() for row in rows};assert len(old)==160 and sum(map(len,links.values()))==329
strong={}
for language in ['greek','hebrew']:
    source=raw('openscriptures/strongs',STRONG_COMMIT,f'{language}/strongs-{language}-dictionary.js').decode()
    start=re.search(r'\{\s*"[GH]\d+"',source)
    assert start,language
    strong.update(json.JSONDecoder().raw_decode(source[start.start():])[0])
assert len(strong)>12000
meta=json.loads(Path('data/bible/plans/reading_plans_1yr_2yr.json').read_text())['books']
byid={b['id']:b for b in meta};aliases={b['names']['en'].lower():b['id'] for b in meta}
aliases.update({b['id'].lower():b['id'] for b in meta});aliases['psalm']='PSA';aliases['song of songs']='SNG'
def refs(text):
    result=[]
    for part in str(text).split(';'):
        part=part.strip()
        if 'LXX' in part:continue
        m=re.fullmatch(r'([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)',part)
        if m:result.append(f'{m[1]}.{int(m[2])}.{int(m[3])}');continue
        m=re.fullmatch(r'(.+?)\s+(\d+):(\d+)(?:[-–](\d+))?',part)
        if not m:continue
        book=aliases.get(m[1].lower());start=int(m[3]);end=int(m[4] or m[3])
        if book and 0<=end-start<=25:result += [f'{book}.{int(m[2])}.{v}' for v in range(start,end+1)]
    return result

def strong_ids(text):return list(dict.fromkeys(m[0]+str(int(m[1:])) for m in re.findall(r'[GH]\d+',text)))
entries={}
for row in sorted(old.values(),key=lambda x:x['id']):
    ids=strong_ids(row['strong']);assert ids and all(s in strong for s in ids),row
    identity='/'.join(ids);assert identity not in entries
    lemma=' / '.join(strong[s]['lemma'] for s in ids)
    entries[identity]={'id':identity.replace('/','-'),'strong':ids,'lemma':lemma,'transliteration':' / '.join(strong[s].get('translit','') for s in ids),'pronunciationFa':row.get('pronunciation',{}).get('fa',''),'gloss':row['term'],'language':'mixed' if len({s[0] for s in ids})>1 else 'greek' if ids[0].startswith('G') else 'hebrew','kind':'phrase' if len(ids)>1 else 'lemma','legacyId':row['id'],'source':'v1-160','suggestedRefs':sorted({ref for ref,rows in links.items() if any(r['id']==row['id'] for r in rows)})}
extra=[]
for line in Path('scripts/study-v453/phase2-extra-glosses.txt').read_text().splitlines():
    if not line or line.startswith('#'):continue
    s,fa,en,hr,reftext=line.split('|');assert s in strong and s not in entries,s
    entries[s]={'id':s,'strong':[s],'lemma':strong[s]['lemma'],'transliteration':strong[s].get('translit',''),'pronunciationFa':'','gloss':{'fa':fa,'en':en,'hr':hr},'language':'greek' if s.startswith('G') else 'hebrew','kind':'lemma','source':'phase2-200-recovered','suggestedRefs':refs(reftext)};extra.append(s)
assert len(extra)==120 and len(entries)==280
# Known Aramaic forms retain an explicit language label; G/H numbering alone is not language.
for s in ['G5','G347','G1115','G2188','G3134','G4469','G4510','G4997','G5614','H1247','H6591','H8065','H4430','H4437','H426/G1682','G5008/G2891']:
    if s in entries:entries[s]['language']='aramaic'
# Clarify basic glosses that previously hard-coded a theological or etymological distinction.
corrections={'G26':['محبت','Love','Ljubav'],'G3056':['کلام / سخن / پیام','Word / statement / message','Riječ / izjava / poruka'],'G4487':['سخن / گفته','Saying / utterance','Izreka / iskaz'],'G1343':['عدالت / پارسایی','Righteousness / justice','Pravednost / pravda'],'G1344':['عادل شمردن / تبرئه کردن','To justify / vindicate','Opravdati / proglasiti pravednim'],'G1922':['شناخت / شناخت دقیق','Knowledge / recognition','Spoznaja / prepoznavanje'],'G5485':['فیض / لطف','Grace / favor','Milost / naklonost'],'H5769':['زمان دور / جاودانگی','Long duration / eternity','Dugo trajanje / vječnost']}
for s,terms in corrections.items():
    if s in entries:entries[s]['gloss']=dict(zip(['fa','en','hr'],terms))
notes=json.loads(Path('scripts/study-v453/reviewed-notes.json').read_text())
for s,note in notes.items():
    if s in entries:entries[s]['explanation']=note['text'];entries[s]['related']=note.get('related',[])

# Verify suggested associations, not every occurrence. No translated token is guessed.
greek_dir=archive('morphgnt/sblgnt',GREEK_COMMIT)
greek_by_ref={}
nt=[b['id'] for b in meta if b['testament']=='NT']
def gn(x):return unicodedata.normalize('NFC',x.strip()).casefold()
for path in greek_dir.glob('*-morphgnt.txt'):
    for line in path.read_text().splitlines():
        parts=line.split();assert len(parts)==7,(path.name,line)
        bcv=parts[0];ref=f'{nt[int(bcv[:2])-1]}.{int(bcv[2:4])}.{int(bcv[4:6])}'
        greek_by_ref.setdefault(ref,set()).add(gn(parts[-1]))
assert len(greek_by_ref)>7000
hebrew_dir=archive('openscriptures/morphhb',HEBREW_COMMIT)
osis=['Gen','Exod','Lev','Num','Deut','Josh','Judg','Ruth','1Sam','2Sam','1Kgs','2Kgs','1Chr','2Chr','Ezra','Neh','Esth','Job','Ps','Prov','Eccl','Song','Isa','Jer','Lam','Ezek','Dan','Hos','Joel','Amos','Obad','Jonah','Mic','Nah','Hab','Zeph','Hag','Zech','Mal']
osis_ids=dict(zip(osis,[b['id'] for b in meta if b['testament']=='OT']))
verse_map={};excluded=set()
for node in ET.parse(hebrew_dir/'wlc/VerseMap.xml').getroot().iter():
    a=node.attrib
    if a.get('wlc') and a.get('kjv'):
        if a.get('type')=='full':verse_map[a['wlc']]=a['kjv']
        else:excluded.update([a['wlc'],a['kjv']])
claimed=set(verse_map.values());hebrew_by_ref={};ns={'o':'http://www.bibletechnologies.net/2003/OSIS/namespace'}
for name,book in osis_ids.items():
    for verse in ET.parse(hebrew_dir/'wlc'/f'{name}.xml').getroot().findall('.//o:verse',ns):
        origin=verse.attrib.get('osisID','')
        if origin in excluded or (origin not in verse_map and origin in claimed):continue
        target=verse_map.get(origin,origin)
        if target in excluded:continue
        p=target.split('.')
        if len(p)!=3 or p[0] not in osis_ids or not p[1].isdigit() or not p[2].isdigit() or int(p[2])==0:continue
        ref=f'{osis_ids[p[0]]}.{int(p[1])}.{int(p[2])}'
        ids=set()
        for word in verse.findall('.//o:w',ns):ids.update('H'+str(int(s)) for s in re.findall(r'\d+',word.attrib.get('lemma','')))
        hebrew_by_ref.setdefault(ref,set()).update(ids)
# Where Strong's traditional headword differs from MorphGNT's lemmatization, explicitly record the alias.
alias_lemmas={'G1492':['οἶδα'],'G4982':['σῴζω'],'G1096':['γίνομαι'],'G1538':['ἕκαστος']}
rejected=[];verified_total=0;vocab_refs={}
valid_refs=set()
for p in Path('data/bible/groups').glob('*.json'):
    d=json.loads(p.read_text());valid_refs.update(f"{v['bookId']}.{v['chapter']}.{v['verse']}" for v in d['verses'])
for e in entries.values():
    accepted=[]
    for ref in dict.fromkeys(e.pop('suggestedRefs')):
        okay=ref in valid_refs
        for s in e['strong']:
            if s.startswith('H'):okay=okay and s in hebrew_by_ref.get(ref,set())
            else:okay=okay and any(gn(x) in greek_by_ref.get(ref,set()) for x in [strong[s]['lemma'],*alias_lemmas.get(s,[])])
        if okay:accepted.append(ref);vocab_refs.setdefault(ref,[]).append(e['id'])
        else:rejected.append({'entry':e['id'],'reference':ref,'reason':'not_confirmed_in_pinned_original_language_corpus_or_versification'})
    e['references']=accepted;verified_total+=len(accepted)
    e['detailStatus']='reviewed_summary' if 'explanation' in e else 'basic_gloss_only'
    e['sources']=[f"https://biblehub.com/{'greek' if s[0]=='G' else 'hebrew'}/{int(s[1:])}.htm" for s in e['strong']]
assert 'EPH.2.8' in entries['G5485']['references']
assert '2CO.5.21' in entries['G1343']['references']
assert 'EXO.3.14' not in entries['H3068']['references']
assert 'EXO.3.15' in entries['H3068']['references']
for e in entries.values():
    assert all(e['gloss'].get(l) for l in ['fa','en','hr'])
    assert not re.search('[\u0600-\u06ff]',e['gloss']['en']+e['gloss']['hr'])
    e['related']=[s.replace('/','-') for s in e.get('related',[]) if s in entries]
DATA=Path('data/lexicon');DATA.mkdir(exist_ok=True)
package={'version':'4.5.3','count':len(entries),'scope':'recovered_core_glossary_not_complete_lexicon','referenceScope':'selected_lemma_verified_references_not_exhaustive','reviewedSummaries':sum('explanation'in e for e in entries.values()),'entries':list(entries.values()),'byVerse':vocab_refs,'referenceMappingLicense':'CC-BY-SA-4.0','sources':{'legacyCommit':OLD_COMMIT,'strongsCommit':STRONG_COMMIT,'morphGNTCommit':GREEK_COMMIT,'OSHBCommit':HEBREW_COMMIT}}
(DATA/'original-language-v453.json').write_text(json.dumps(package,ensure_ascii=False,separators=(',',':')))
(DATA/'ATTRIBUTION-v453.md').write_text(f'''# Original-language study assets\nRecovered core glossary: Omideno7 project v1 (160 entries) and lexical fields from Omideno7_Biblical_Word_Bank_Phase2_200_Trilingual.json (200 entries, 120 additional Strong keys). Duplicate keys were combined. Old placeholder prose and unverified verse associations are not published.\n\nCanonical headwords/transliteration: Open Scriptures Strong's Dictionaries, commit {STRONG_COMMIT}; public-domain dictionary material.\n\nGreek selected-reference verification: Tauber, J. K., ed. (2017), MorphGNT: SBLGNT Edition 6.12, commit {GREEK_COMMIT}, https://github.com/morphgnt/sblgnt . Source morphological analysis and lemmatization: CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/). The adapted selected-reference mappings here are offered under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). No complete Greek verse text is redistributed here.\n\nHebrew/Aramaic verification: Open Scriptures Hebrew Bible Project, commit {HEBREW_COMMIT}, https://github.com/openscriptures/morphhb . Source Hebrew morphological data: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). The combined adapted selected-reference mapping fields are CC BY-SA 4.0; this license does not cover the independently authored app code. WLC verse mapping is respected; ambiguous partial mappings were excluded.\n\nThis resource is not a complete original-language Bible or a word-for-word interlinear. Only selected verified associations are shown. A translation label is not proof of one original lemma, and related terms are not automatically interchangeable. The app's Bible/Apocrypha corpus remains unchanged.\n''')
(OUT/'lexicon-audit.json').write_text(json.dumps({'status':'passed','legacyEntries':160,'phase2RecoveredAdditionalKeys':len(extra),'entries':len(entries),'verifiedSelectedLinks':verified_total,'rejectedSuggestions':rejected,'reviewedSummaries':package['reviewedSummaries'],'placeholderProsePublished':False,'translationCorpusModified':False},ensure_ascii=False,indent=2))
(OUT/'source-download-hashes.json').write_text(json.dumps(manifest,indent=2))
(OUT/'font-audit.json').write_text(json.dumps({'status':'passed','fonts':fonts},ensure_ascii=False,indent=2))
print(f'Lexicon: {len(entries)} entries; {verified_total} verified selected links; {len(rejected)} unconfirmed suggestions excluded.',flush=True)
