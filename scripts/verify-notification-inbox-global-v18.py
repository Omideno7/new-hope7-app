#!/usr/bin/env python3
from pathlib import Path
import sys
p=Path(__file__).resolve().parents[1]/'supabase/functions/nh7-send-notifications/index.ts'
s=p.read_text(encoding='utf-8')
errors=[]
def need(cond,msg):
    if not cond: errors.append(msg)
need("shared Inbox rows avoid per-user duplication" in s,'v18 marker missing')
need("device_id:null,user_email:null" in s,'global Inbox rows missing')
need("(['fa','en','hr'] as Lang[]).map" in s,'three-language shared rows missing')
need("dedupePrefix}:global:${lang}" in s,'global dedupe key missing')
need('approvedRecipients' not in s,'per-user approved-recipient fanout returned')
need('registrations?select=language,payload,status' not in s,'sender still fetches all approved users')
need("processScheduled" in s and "processAdminEvents" in s,'scheduled/admin dispatch paths missing')
need("cronAuthorized" in s and "notification_dispatch_log" in s,'cron/claim safety missing')
need("sendLocalizedUsers" in s and "postOneSignal" in s,'push delivery path missing')
if errors:
    print('Notification Inbox global v18 verification: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('Notification Inbox global v18 verification: PASS')
print(' - scheduled/broadcast Inbox fanout reduced to 3 language rows')
print(' - Push, cron authorization, dispatch claims and admin paths retained')
