#!/usr/bin/env python3
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]

def text(path): return (ROOT/path).read_text(encoding='utf-8')
def check(ok,msg):
    if not ok:
        print('FAIL:',msg); return False
    print('PASS:',msg); return True

admin=text('admin.html'); core=text('js/admin-v2.2.0.js'); public=text('certificate.html'); runtime=text('js/admin-v2.3.9-document-runtime-fix4.js'); ux=text('js/nh7-document-ux-v520.js'); css=text('css/nh7-document-ux-v520.css'); stable=text('admin-v239-stable.html')
old=[f'nh7-document-ux-v{v}' for v in ('509','510','511','512','513')]
checks=[]
checks += [check('nh7-document-ux-v520.css?v=5.2.0' in admin and 'nh7-document-ux-v520.js?v=5.2.0' in admin,'Admin loads canonical v5.2.0 CSS/JS')]
checks += [check(all(x not in admin for x in old),'Admin no longer stacks v509-v513 document UX patches')]
checks += [check('nh7-document-ux-v520.css?v=5.2.0' in public and 'nh7-document-ux-v520.js?v=5.2.0' in public,'Public document loads canonical v5.2.0 CSS/JS')]
checks += [check(all(x not in public for x in old),'Public page no longer stacks older document UX patches')]
checks += [check("VERSION='2.3.9-document-runtime-fix9'" in runtime,'Full Studio runtime version is fix9')]
checks += [check('if(!saved.logo.source)saved.logo.source=rowLogo' in runtime and 'if(!saved.photo.source&&rowPhoto)saved.photo.source=rowPhoto' in runtime,'Saved Studio design reconciles logo/photo from current issued row')]
checks += [check("node.nodeType===Node.TEXT_NODE" in runtime and "heading.insertBefore(document.createTextNode(value),heading.firstChild)" in runtime,'Modern certificate heading update preserves image children')]
checks += [check("window.NH7CurrentDocumentV508?.renderNow?.()" in runtime,'Full Studio forces modern document renderer before cloning')]
checks += [check('copyCanvasPixels' not in runtime and "drawImage(a,0,0)" in runtime,'Full Studio clone preserves QR canvas bitmap')]
checks += [check('nh7-doc-photo-frame-v520' in runtime and "church:'.doc-church'" in runtime,'Runtime uses canonical photo frame and single church style target')]
checks += [check('NH7DocumentUXV520?.downloadAdminPdf' in runtime,'Full Studio PDF action uses canonical v5.2.0 exporter')]
checks += [check('pointer-events:none!important' in css and 'No direct drag' in css,'Direct image dragging is disabled; sliders remain authoritative')]
checks += [check('The page itself is the coordinate system' in css and '>.doc-letterhead{position:static!important' in css,'Logo/photo coordinates resolve against the full page')]
checks += [check('doc-footer-church-v520' in css and 'bottom:34px!important' in css,'Footer and QR are bounded inside canonical A4 page')]
checks += [check("adminRpc('nh7_admin_send_inbox_v360'" in ux,'Inbox delivery uses existing secure admin RPC')]
checks += [check('sanitizeClone' in ux and 'colorFallback' in ux and 'html2canvas' in ux,'Flattened PDF includes Safari-safe color sanitization')]
checks += [check('copyCanvasPixels' in ux and 'nh7-v520-capture' in ux,'PDF capture preserves QR canvas and uses fixed A4 staging')]
checks += [check("certificate.html?token='+encodeURIComponent(row.public_token||'')+'&v=520" in core,'Copy Link URL cache-busts to v5.2.0')]
checks += [check('NH7DocumentUXV520.printPublic()' in public and 'NH7DocumentUXV520.downloadPublicPdf()' in public,'Public Print/PDF buttons use canonical runtime')]
checks += [check("size:88,x:50,y:9" in public and "size:110,x:9,y:18" in public,'Public default asset coordinates match Full Studio defaults')]
checks += [check("BUILD='2.3.9.68-admin-v520'" in stable and 'document-runtime-fix4\\.js\\?v=' in stable,'Stable Admin cache key and runtime cache rewrite are updated')]
if not all(checks): sys.exit(1)
print('Document v5.2.0 verification passed.')
