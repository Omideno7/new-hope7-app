/* Dependency-free print-only contracts; real gestures/no-op fallbacks use browser tests. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const parent=fs.readFileSync('js/nh7-admin-print-native-v120.js','utf8');
const child=fs.readFileSync('js/nh7-school-report-print-page-v121.js','utf8');
const html=fs.readFileSync('school-report-print.html','utf8');
assert.match(parent,/school-report-print\.html/);assert.doesNotMatch(parent,/about:blank|document\.write|\.print\(/);
assert.match(parent,/event\.origin!==location\.origin/);assert.match(parent,/event\.source!==entry\.win/);
assert.match(child,/event\.source!==parent/);assert.match(child,/data\.ticket!==ticket/);
assert.doesNotMatch(parent+child,/adminRpc|authFetch|XMLHttpRequest|\bfetch\(|localStorage|sessionStorage|https:\/\//);
assert.match(html,/nh7-school-report-print-page-v121\.js\?v=1\.2\.1/);
assert.match(fs.readFileSync('admin-v239-stable.html','utf8'),/nh7-admin-print-native-v120\.js\?v=1\.2\.1/);
assert.match(parent,/data-print-help121/);assert.match(html,/id="help121"/);
// Exercise the page's own synchronous print handler with no-op and throwing browsers.
const elements=Object.fromEntries(['print121','back121','status121','help121','controls121'].map(id=>[id,{setAttribute(){},addEventListener(type,handler){this[type]=handler}}]));
let calls=0;
const context=vm.createContext({document:{documentElement:{},getElementById:id=>elements[id]},window:{opener:null,addEventListener(){},print(){calls++;assert.ok(elements.status121.textContent.includes('PDF'))}},location:{hash:'#lang=en',origin:'http://localhost'},history:{length:1},URLSearchParams,setTimeout:()=>1,clearTimeout(){}});
vm.runInContext(child,context);assert.equal(calls,0,'Never auto-print on load');elements.print121.click();assert.equal(calls,1);assert.ok(elements.help121.textContent.includes('Files'));
context.window.print=()=>{throw Error('blocked')};elements.print121.click();assert.match(elements.status121.textContent,/did not open/);assert.match(elements.help121.textContent,/Share → Print/);
console.log('Print #121 PASS: real local page, validated in-memory handoff, own-realm synchronous tap, no automatic print, explicit no-op/exception recovery, cache wiring and read-only scope.');
