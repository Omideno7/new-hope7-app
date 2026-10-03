#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def text(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing file: {path}")
        return ""
    return p.read_text(encoding="utf-8")

def require(path, needle, label=None):
    data = text(path)
    if needle not in data:
        errors.append(f"{path}: missing {label or needle}")

def forbid(path, needle, label=None):
    data = text(path)
    if needle in data:
        errors.append(f"{path}: forbidden regression found: {label or needle}")

index = "index.html"

# Release runtime signatures.
require(index, 'js/nh7-audio-classic-v484.js?v=4.8.5-no-telemetry', "audio no-telemetry runtime")
require(index, 'js/nh7-sermon-social-v443.js?v=4.4.8-batch', "batched sermon social runtime")
require(index, 'js/nh7-inbox-badge-sync-v418.js?v=4.1.10-snapshot', "Inbox snapshot runtime")
require(index, 'js/nh7-school-path-v351.js?v=4.6.7-io', "School Path low-I/O runtime")
require(index, 'js/app.js?v=4.8.16-inbox', "shared Inbox/app runtime")
forbid(index, 'nh7-book-reading-telemetry-v490.js', "book reading telemetry script")

# Retired telemetry must not reappear in active clients.
for rpc in (
    'nh7_track_audio_session_v222',
    'nh7_school_record_audio_v380',
):
    forbid('js/nh7-audio-classic-v484.js', rpc)

for rpc in (
    'nh7_track_content_v223',
    'nh7_track_app_section_v222',
    'nh7_library_reading_record_v490',
):
    forbid('js/app.js', rpc)

# Social batching + safe fallback + low prefetch + double-tap protection.
require('js/nh7-sermon-social-v443.js', "nh7_sermon_social_batch_v444")
require('js/nh7-sermon-social-v443.js', "nh7_sermon_social_state_v440")
require('js/nh7-sermon-social-v443.js', "rootMargin:'80px 0px'")
require('js/nh7-sermon-social-v443.js', "button?.dataset.busy==='1'", "Like double-tap guard")
require('js/nh7-sermon-social-v443.js', "slice(0,20)", "social batch limit")

# Inbox snapshot + fallback + low polling.
require('js/nh7-inbox-badge-sync-v418.js', 'nh7_inbox_snapshot_v419')
require('js/nh7-inbox-badge-sync-v418.js', 'const SYNC_TTL_MS=120000;')
require('js/nh7-inbox-badge-sync-v418.js', 'const POLL_MS=900000;')
require('js/nh7-inbox-badge-sync-v418.js', 'snapshot fallback')
require('js/nh7-inbox-badge-sync-v418.js', 'Promise.all([rest(ownPath)', "legacy Inbox fallback")

# School Path cache/refresh.
require('js/nh7-school-path-v351.js', 'Date.now()-cacheAt<30000')
require('js/nh7-school-path-v351.js', 'setInterval(refreshSchoolPath,120000);')

# Stable Library catalog cache.
require('js/app.js', 'const NH7_LIBRARY_CATALOG_CACHE_MS=10*60*1000;')

# Data-preservation guard for this release and future timestamped migrations.
# Only migrations at/after the first Supabase hardening migration are scanned,
# so historical migrations are not re-linted retroactively.
PROTECTED_DATA_TABLES = (
    'nh7_account_notes',
    'nh7_account_progress',
    'nh7_account_saved_verses',
    'nh7_account_verse_marks_v230',
    'nh7_library_reading_progress_v490',
    'nh7_school_audio_progress_v380',
    'school_progress',
    'school_legacy_progress_v542',
    'school_assignments',
    'registrations',
    'saved_verses',
    'user_notes',
    'user_progress',
    'spiritual_plan_progress',
)
MIGRATION_FLOOR = 20261003171531

migration_dir = ROOT / 'supabase' / 'migrations'
for migration in sorted(migration_dir.glob('*.sql')):
    match = re.match(r'^(\d{14})_', migration.name)
    if not match or int(match.group(1)) < MIGRATION_FLOOR:
        continue
    sql = migration.read_text(encoding='utf-8')
    sql = re.sub(r'--.*$', '', sql, flags=re.MULTILINE).lower().replace('"', '')
    if re.search(r'\bdrop\s+schema\s+(?:if\s+exists\s+)?public\b', sql):
        errors.append(f"{migration}: forbidden DROP SCHEMA public")
    for table in PROTECTED_DATA_TABLES:
        q = rf'(?:public\.)?{re.escape(table)}'
        destructive_patterns = (
            rf'\bdrop\s+table\b[^;]*\b{q}\b',
            rf'\btruncate(?:\s+table)?\b[^;]*\b{q}\b',
            rf'\bdelete\s+from\s+{q}\b',
            rf'\balter\s+table\s+(?:if\s+exists\s+)?{q}\b[^;]*\bdrop\b',
        )
        for pattern in destructive_patterns:
            if re.search(pattern, sql, flags=re.DOTALL):
                errors.append(f"{migration}: destructive SQL against protected table {table}")
                break

# A native update must never wipe all local user state.
for runtime in [index, *[str(p.relative_to(ROOT)) for p in (ROOT / 'js').glob('*.js')]]:
    forbid(runtime, 'localStorage.clear(', 'global localStorage wipe')
    forbid(runtime, 'indexedDB.deleteDatabase(', 'IndexedDB database deletion')

if errors:
    print("New Hope 7 next-native optimization guard: FAILED")
    for item in errors:
        print(f" - {item}")
    sys.exit(1)

print("New Hope 7 next-native optimization guard: PASS")
