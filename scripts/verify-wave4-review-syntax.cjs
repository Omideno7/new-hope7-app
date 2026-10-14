/* Parse review TypeScript without importing/serving it. Node24.21 --check does
 * not erase .ts annotations; use the built-in parser, then the JS syntax gate. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module'),{spawnSync}=require('node:child_process');
const directory=path.resolve(__dirname,'../supabase/review/wave4-notifications-2');
for(const name of fs.readdirSync(directory).filter(name=>name.endsWith('.ts')).sort()){
 const file=path.join(directory,name);
 const code=stripTypeScriptTypes(fs.readFileSync(file,'utf8'),{mode:'strip',sourceUrl:file});
 const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:code,encoding:'utf8'});
 assert.equal(result.status,0,`${name}: ${result.stderr||result.error||'syntax check failed'}`);
 console.log('PASS review TypeScript + JavaScript syntax:',name);
}
