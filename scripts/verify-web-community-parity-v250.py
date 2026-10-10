#!/usr/bin/env python3
from pathlib import Path
import json, re, sys

root=Path(__file__).resolve().parents[1]
errors=[]
def need(cond,msg):
    if not cond: errors.append(msg)

def text(rel):
    p=root/rel
    need(p.exists(), f'missing {rel}')
    return p.read_text(encoding='utf-8') if p.exists() else ''

index=text('index.html')
app=text('js/app.js')
community=text('js/nh7-community-v502.js')
sw=text('sw-release-core-v403.js')
worker=text('service-worker.js')

guide_path=root/'data/community/testimony_guide_v502.json'
try:
    guide=json.loads(guide_path.read_text(encoding='utf-8'))
except Exception as e:
    errors.append(f'invalid testimony guide JSON: {e}')
    guide={}

# Assets/wiring.
need('js/nh7-community-v502.js?v=5.0.7-prayer-reply' in index,'index does not load Community runtime')
need(index.find('js/nh7-community-v502.js') < index.find('js/app.js'),'Community runtime must be declared before app.js')
need('community=507' in index,'app cache tag not rotated for Community')
release_match=re.search(r"NH7_RELEASE_CORE_VERSION='([^']+)'",sw)
need(bool(release_match),'release core version declaration missing')
release_version=release_match.group(1) if release_match else ''
need(bool(release_version) and release_version in index and release_version in worker,'index/worker release-core version tags are not aligned')
need("'./js/nh7-community-v502.js'" in sw,'Community JS missing from release precache')
need("'./data/community/testimony_guide_v502.json'" in sw,'Community guide missing from release data precache')
need('"js/nh7-community-v502.js"' in sw,'Community JS missing from release fetch allow-list')

# Three-language navigation; Profile deliberately uses current local v563/v564 path.
for route in ('testimonies','prayerRequest','profile'):
    need(route in app,f'{route} missing from app integration')
need("route==='testimonies'" in app and 'renderTestimonies' in app,'testimonies route is not wired')
need("route==='prayerRequest'" in app and 'renderPrayer' in app,'prayer route is not wired')
need("else if(route==='profile') await account();" in app,'Profile must use current Account/local-photo path')
need('renderProfile' not in app,'stale cloud Profile route must not be called by app.js')
need("['testimonies','✨']" in app and "['prayerRequest','🙏']" in app and "['profile','👤']" in app,'More navigation is incomplete')
for token in ("testimonies:'Testimonies'","testimonies:'شهادت‌ها'","testimonies:'Svjedočanstva'",
              "prayerRequest:'Prayer Request'","prayerRequest:'درخواست دعا'","prayerRequest:'Molitveni zahtjev'",
              "profile:'My Profile'","profile:'پروفایل من'","profile:'Moj profil'"):
    need(token in app,f'missing translation: {token}')

# Preserve newer main Profile implementation; do not reintroduce old header button.
for src in ('js/nh7-profile-photo-guard-v563.js','js/nh7-profile-photo-v563.js','js/nh7-profile-photo-v564.js'):
    need(src in index,f'current profile module lost: {src}')
need('profileHeaderBtn' not in index,'old Community profileHeaderBtn must not be introduced')
need('refreshHeaderProfile' not in app,'old Community cloud-header sync must not be introduced')

# Backend contract / safety invariants.
need("const TESTIMONY_MAX_BYTES=50*1024*1024;" in community,'client testimony limit must match live 50 MiB bucket')
need('60 MB' not in community and '۶۰ مگابایت' not in community,'stale 60 MB copy remains')
need("nh7_prayer_requests_v502" in community,'prayer backend contract missing')
need("nh7_testimonies_v502" in community,'testimony backend contract missing')
need("nh7_public_testimony_feed_v502" in community,'public testimony RPC missing')
need("window.NH7CommunityV502={VERSION,renderTestimonies,renderPrayer,resumePending,dispose};" in community,'stale cloud Profile export must stay disabled')
need('service_role' not in (community+app).lower(),'service_role reference found in browser runtime')
need('SUPABASE_SECRET' not in (community+app),'secret-key symbol found in browser runtime')
need("upsert=false" in app and "'x-upsert':upsert?'true':'false'" in app,'storage upload contract unexpectedly changed')

# Guide shape.
langs=guide.get('languages',{}) if isinstance(guide,dict) else {}
for lang in ('fa','en','hr'):
    need(lang in langs,f'guide language missing: {lang}')
    if lang in langs:
        need(bool(langs[lang].get('sections')),f'guide sections missing: {lang}')
        need(bool(langs[lang].get('ui')),f'guide UI copy missing: {lang}')

# Lifecycle and login resume guard.
need("window.NH7CommunityV502?.dispose?.()" in app,'Community media lifecycle dispose guard missing')
need(app.count("window.NH7CommunityV502?.resumePending?.()") >= 2,'pending-login resume hooks incomplete')

if errors:
    print('Web Community parity verification: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('Web Community parity verification: PASS')
print(' - Testimonies + Prayer Request wired to current main')
print(' - Profile uses existing v563/v564 Account path; stale cloud profile backend is not exposed')
print(' - 50 MiB live testimony bucket limit matched')
print(' - FA/EN/HR guide and navigation present')
print(' - Service worker cache rotated with Community assets')
