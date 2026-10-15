const assert=require('node:assert/strict'),v=require('../js/nh7-security-registration-wave65.js');
for(const lang of ['fa','en','hr']){
 for(const value of ['+989121234567','+385912345678','+98 (912) 123-4567','+۹۸۹۱۲۱۲۳۴۵۶۷','+٣٨٥٩١٢٣٤٥٦٧٨','+12345678','+123456789012345'])assert(v.phone(value).ok,lang+': '+value);
 for(const value of ['00000000000','11111111111','12345678','09121234567','00385912345678','abc','+11111111111','+00000000','+1234567','+1234567890123456','+98abc912','+98.912.1234567'])assert(!v.phone(value).ok,lang+': '+value);
 assert(v.message('phone',lang).includes('+'));assert(v.message('captcha',lang).length>20);
}
assert.equal(v.phone('+۹۸ (۹۱۲) ۱۲۳-۴۵۶۷').canonical,'+989121234567');
for(const good of ['Sara','محمد','Čedomir','Li','O’Connor'])assert(v.human(good),good);
for(const bad of ['','   ','!!!','aaaa','؟؟؟'])assert(!v.human(bad),bad);
assert(v.dob('2000-02-29'));for(const bad of ['0000-01-01','2001-02-29','2000-13-01','2000-02-30','3000-01-01'])assert(!v.dob(bad));
assert(v.password('CorrectPass123!'));for(const bad of ['short1A!','LongPassword!','longpassword1!','LONGPASSWORD1!','LongPassword1','Long Pass123!'])assert(!v.password(bad));
(async()=>{assert.deepEqual(await v.captcha('signup','fa'),{});console.log('PASS Wave65 FA/EN/HR local E.164/missing+/junk/format/digits, Unicode human/DOB, new password policy, disabled CAPTCHA zero network')})().catch(e=>{console.error(e);process.exitCode=1});
