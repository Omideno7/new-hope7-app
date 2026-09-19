import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const base='466badb8a151dbdf02d07606a99e9660da1fe04a';
function palettes(source){const start=source.indexOf('const LABELS='),end=source.indexOf('const FONT_FA=');assert(start>=0&&end>start);return new Function(source.slice(start,end)+';return {LABELS,PRESETS};')()}
const old=palettes(execFileSync('git',['show',base+':js/nh7-theme-studio-v453.js'],{encoding:'utf8'})),next=palettes(fs.readFileSync('js/nh7-theme-studio-v453.js','utf8'));
assert.equal(Object.keys(old.PRESETS).length,8);assert.equal(Object.keys(next.PRESETS).length,14);
for(const key of Object.keys(old.PRESETS)){assert.deepEqual(next.PRESETS[key],old.PRESETS[key]);assert.deepEqual(next.LABELS[key],old.LABELS[key])}
const lum=hex=>{const a=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]},ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
const rows=[];for(const [id,c] of Object.entries(next.PRESETS)){
 for(const [fg,bg] of [['text','bg'],['text','card'],['muted','bg'],['muted','card'],['verse','card']]){const contrast=ratio(c[fg],c[bg]);assert(contrast>=4.5,{id,fg,bg,contrast});rows.push({id,foreground:fg,background:bg,contrast})}
 assert(Math.max(ratio('#ffffff',c.accent),ratio('#000000',c.accent))>=4.5);
}
fs.mkdirSync('qa-theme457',{recursive:true});fs.writeFileSync('qa-theme457/palette-report.json',JSON.stringify({status:'passed',oldPalettesUnchanged:8,totalPalettes:14,contrastThreshold:4.5,pairs:rows},null,2));console.log('PASS: all 8 original palettes are identical; 14 palettes pass 70 text contrast pairs and button contrast.');
