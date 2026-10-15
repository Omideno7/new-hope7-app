/* Reuse the proven real-wall-clock intercepted harness; no new runtime code or network endpoints. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const after=process.argv[2]||'http://127.0.0.1:8878',before=process.argv[3]||'http://127.0.0.1:8888',out=process.argv[4]||'/tmp/nh7-wave66/measurements.json';
const raw=out+'.driver.json',run=spawnSync(process.execPath,['scripts/measure-wave65.cjs',after,before,raw],{stdio:'inherit'});assert.equal(run.status,0,'Shared intercepted measurement harness failed');
const data=JSON.parse(fs.readFileSync(raw));data.wave='6.6';data.starting_sha='4f6c702c3f9e996256a5f9410bfd6096b5f3f018';data.measured_head=process.env.GITHUB_SHA||require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();data.measurement_driver='Existing Wave65 harness, both runtime payloads identical; local synthetic purge is regression only';
assert.equal(data.baseline.steps[0].remote_requests,data.current.steps[0].remote_requests,'Frozen-runtime startup counts must match');
fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');console.log('PASS Wave66 real-wall-clock startup/visible/hidden/form/Admin idle measurements',out);
