import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const page=read('verify-certificate.html');
const page508=read('verify-certificate-v508.html');
const full=read('certificate.html');
const full239=read('certificate-v239.html');
const v220=read('js/admin-v2.2.0.js');
const v222=read('js/admin-v2.2.2.js');
const studio=read('js/admin-v2.3.9-document-studio.js');
const need=(s,x,m)=>{if(!s.includes(x))throw new Error(m)};
const forbid=(s,re,m)=>{if(re.test(s))throw new Error(m)};
for(const [name,s] of [['verify-certificate.html',page],['verify-certificate-v508.html',page508]]){
  need(s,'nh7_public_certificate_verify_v127',`${name} must call privacy-minimal verifier`);
  forbid(s,/nh7_public_(?:document|certificate)_lookup/i,`${name} must not call legacy full-document lookup`);
  forbid(s,/\b(?:user_name|user_email|photo_url|photo_path|student_code|final_score|content_hash|body_fa|body_en|body_hr|custom_fields|church_info|signature_url)\b/i,`${name} contains a forbidden private certificate field`);
}
need(full,"verify-certificate-v508.html?token=",'certificate.html QR must point to the privacy verification v508 page');
need(full239,"verify-certificate.html?token=",'certificate-v239.html QR must retain the legacy privacy verification page');
need(v220,'function publicDocUrl(row){return new URL(\'certificate.html?token=','full-document delivery link must remain unchanged');
need(v220,"function verifyDocUrl(row){return row?.public_token?new URL('verify-certificate-v508.html?token=",'v220 QR verifier v508 URL missing');
need(v222,'./verify-certificate.html?token=${encodeURIComponent(row.public_token)}','v222 QR must use verification page');
need(studio,"new URL('certificate-v239.html',location.href)",'full v239 document link must remain unchanged');
console.log('Public Certificate Verification Page v127 verifier: PASS');
console.log('Scope: QR verification privacy only; full-document delivery links remain backward-compatible');
