/* Dependency-free structural PDF, local-vendor and read-only contracts for CI. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const source=fs.readFileSync('js/nh7-admin-report-print-v117.js','utf8');
const context=vm.createContext({window:{addEventListener(){}},document:{documentElement:{lang:'en'}},setInterval:()=>0,clearInterval(){},Blob,TextEncoder,Uint8Array,console});
vm.runInContext(source,context);
const jpeg=Uint8Array.from([255,216,0,255,217]);
const blob=context.window.NH7AdminReportPrintV117.pdfBlob([{width:1280,height:800,bytes:jpeg},{width:1280,height:700,bytes:jpeg}]);
assert.equal(blob.type,'application/pdf');const bytes=Buffer.from(await blob.arrayBuffer()),text=bytes.toString('latin1');
assert.ok(text.startsWith('%PDF-1.4'));assert.match(text,/\/Count 2/);assert.match(text,/\/Filter \/DCTDecode/);
const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(bytes.subarray(xref,xref+4).toString(),'xref');
const entries=text.slice(xref).split('\n').slice(3,11);for(let i=0;i<entries.length;i++){const offset=Number(entries[i].slice(0,10));assert.ok(text.slice(offset).startsWith((i+1)+' 0 obj'),'object offset '+(i+1))}
assert.doesNotMatch(source,/adminRpc|authFetch|XMLHttpRequest|\bfetch\(|https:\/\/(?:cdn|unpkg)/);
assert.match(source,/frame\.contentWindow\.print\(\)/);assert.match(source,/navigator\.share\(/);assert.match(source,/new File\(/);
assert.match(source,/data-close/);assert.match(source,/data-pdf/);assert.match(source,/data-print/);assert.match(source,/data-csv/);
const vendor=fs.readFileSync('js/vendor/html2canvas-1.4.1.min.js');
const expected=JSON.parse(fs.readFileSync('js/vendor/report-pdf-dependencies.json','utf8'));
assert.equal(crypto.createHash('sha256').update(vendor).digest('hex'),expected.sha256);
assert.ok(fs.readFileSync('js/vendor/html2canvas-LICENSE.txt','utf8').includes('MIT'));
console.log('Report PDF #119 PASS: PDF byte offsets/pages/MIME, direct print, File/Share, persistent controls, read-only local runtime and pinned MIT renderer.');
