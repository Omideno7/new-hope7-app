from pathlib import Path
js=Path('js/nh7-document-ux-v511.js').read_text(); css=Path('css/nh7-document-ux-v511.css').read_text(); admin=Path('admin.html').read_text(); cert=Path('certificate.html').read_text(); idx=Path('index.html').read_text(); core=Path('js/admin-v2.2.0.js').read_text()
checks={
 'smooth drag avoids per-move storage': 'pointermove' in js and "write(drag.d)" not in js,
 'studio logo hydration': 'ensureAssets' in js and "logo.source" in js,
 'Safari color() sanitizer': 'colorFallback' in js and 'sanitizeClone' in js and 'onclone' in js,
 'PDF v511 public path': 'NH7DocumentUXV511.downloadPublicPdf()' in cert,
 'footer/QR bounded': 'bottom:32px' in css and 'width:72px' in css,
 'iOS top safe area': 'safe-area-inset-top' in css and 'nh7-document-ux-v511.css?v=5.1.1' in idx,
 'fresh recipient reset': "certificate_type:'custom',user_name:'',user_email:'',photo_url:''" in core,
 'share saves selected design': 'saveSelectedDesign' in js,
 'admin v511 loaded': 'nh7-document-ux-v511.js?v=5.1.1' in admin,
 'public v511 loaded': 'nh7-document-ux-v511.js?v=5.1.1' in cert,
}
bad=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL'),k)
if bad: raise SystemExit(1)
