const fs=require('node:fs'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),manifest=require('./fixtures/wave6-approved-ui.json');
const files=[...Object.keys(manifest.existing_ui_files),...Object.keys(manifest.new_ui_files),...fs.readdirSync('scripts').filter(x=>/wave6.*\.cjs$/.test(x)).map(x=>'scripts/'+x),'scripts/fixtures/wave6-user.cjs'];
for(const file of files.filter(x=>/\.(?:js|mjs|cjs)$/.test(x))){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(r.status,0,file+': '+r.stderr);console.log('PASS syntax',file)}
