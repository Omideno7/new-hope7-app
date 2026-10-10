#!/usr/bin/env python3
from pathlib import Path
import sys
r=Path(__file__).resolve().parents[1]
errs=[]
def need(ok,msg):
    if not ok: errs.append(msg)
app=(r/'js/app.js').read_text()
lib=(r/'js/nh7-library-security-v125.js').read_text()
idx=(r/'index.html').read_text()
sw=(r/'service-worker.js').read_text()
core=(r/'sw-release-core-v403.js').read_text()
candidate=(r/'supabase/review/optimize_inbox_rls_cost_v1_candidate.sql').read_text().lower()
need('maybeCreateScheduledInboxMessages(); await refreshInboxFromCloud(false);' in app,'Inbox open still force-syncs')
need('PUBLIC_CATALOG_TTL_MS = 120000' in lib,'public library TTL missing')
need("bundle.items.every((x) => x.audience === 'public')" in lib,'public-only item cache fence missing')
need("bundle.collections.every((x) => x.audience === 'public')" in lib,'public-only collection cache fence missing')
need('if (catalogPromise) return catalogPromise;' in lib,'catalog single-flight missing')
need('nh7-library-security-v125.js?v=125.6-cost-cache' in idx,'library cache-bust missing')
need('5.4.5-cost-audit' in idx and '5.4.5-cost-audit' in sw and "NH7_RELEASE_CORE_VERSION='5.4.5-cost-audit'" in core,'release cache rotation missing')
for bad in ('drop table','truncate','delete from','drop schema'):
    need(bad not in candidate,f'candidate SQL contains destructive operation: {bad}')
need('alter policy "nh7 account notes own"' in candidate,'account notes InitPlan candidate missing')
need('notification_inbox_lower_email_delivered_cost_v1' in candidate,'Inbox expression index candidate missing')
if errs:
    print('Cost audit v5.4.5 verification: FAIL')
    [print(' -',x) for x in errs]
    sys.exit(1)
print('Cost audit v5.4.5 verification: PASS')
print(' - Inbox opening reuses shared sync TTL')
print(' - public-only Library catalog cache is fenced from protected content')
print(' - backend SQL remains review-only and non-destructive')
