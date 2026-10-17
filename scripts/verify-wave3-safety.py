#!/usr/bin/env python3
"""Wave 3 scope guard, in addition to behavioral browser/contract regressions."""
from pathlib import Path
from school_accepted_source_v580 import school_additions,protected_diff
import subprocess,re
import sys
sys.dont_write_bytecode=True
from wave6_accepted_source import accepted_bytes
BASE='177d196f8fdb2b641156b0e7b28d03e8bd98b7cc'
def before(path):return subprocess.check_output(['git','show',f'{BASE}:{path}'])
# Authorized Wave4 notification-only exceptions are guarded byte-for-byte below.
subprocess.run(['python3','scripts/verify-wave4-safety.py'],check=True)
# Product data/engines/security and all backend executable contracts must remain exact.
protected=['js/nh7-admin-ai-v490.js','js/nh7-local-first-wave2.js','js/nh7-performance-wave1.js','js/nh7-library-security-v125.js','js/nh7-book-reader-v283.js','js/nh7-profile-photo-v563.js','js/nh7-profile-photo-v564.js','js/nh7-audio-classic-v484.js','js/nh7-media-player-v500.js','js/nh7-admin-storage-orphan-guard-v510.js','js/nh7-admin-sermon-metadata-v452.js','js/nh7-admin-storage-orphan-v509.js','js/nh7-admin-community-storage-v504.js','js/nh7-document-ux-v520.js','js/nh7-admin-report-print-v117.js']
for p in protected:assert accepted_bytes(p)==before(p),f'Protected source changed: {p}'
assert not protected_diff(BASE,['supabase/migrations','supabase/functions','data']), 'Backend/data change not permitted'
for p,old,new in [('js/nh7-admin-community-fixes-v503.js','if(P.countLoading||!auth())','if(document.hidden||P.countLoading||!auth())'),('js/nh7-admin-testimony-core-v565.js',"if(S.countLoading||typeof token==='undefined'||!token)","if(document.hidden||S.countLoading||typeof token==='undefined'||!token)")]:
 assert Path(p).read_text()==before(p).decode().replace(old,new,1),f'Only background count gating permitted: {p}'
core=Path('js/nh7-admin-workspace-wave3.js').read_text();rbac=Path('js/nh7-admin-rbac-v350.js').read_text();msg=Path('js/nh7-admin-message-center-v416.js').read_text()
assert 'nh7_admin_my_access_v350' in core and 'nh7_admin_my_access_v350' in rbac
assert 'localStorage.getItem(\'nh7_admin_access_v350\')' not in core+rbac
assert not re.search(r'(?:OWNER|ADMIN)_EMAIL\s*=',core+rbac+msg), 'Client email authority forbidden'
assert 'SERVICE_ROLE' not in core+rbac+msg and 'sb_secret_' not in core+rbac+msg
assert 'setInterval(' not in core+msg, 'New core/composer cannot add recurring polling'
assert "'DELETE'" not in core and "'PATCH'" not in core and 'createSignedUrl' not in core, 'Storage core is read/list only'
assert "limit:100" in core and "offset:storage.offset" in core
assert "APPROVED" not in core, 'No client approval model'
assert "nh7-release-core-v571-wave4-notifications" in Path('sw-release-core-v403.js').read_text()
assert "nh7-data-stable-v329" in Path('sw-release-core-v403.js').read_text()
for f in ['index.html','admin.html']:assert 'js/nh7-admin-workspace-wave3.js?v=3' in Path(f).read_text()
assert 'where m.user_id = auth.uid()' in before('supabase/migrations/20260821174931_admin_rbac_recovery_v350.sql').decode()
print('Wave3 safety PASS: protected user/engine/backend/source bytes, only two read-count visibility guards, server role authority, no new polling/destructive Storage path')
