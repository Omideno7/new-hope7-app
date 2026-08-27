from pathlib import Path

# prayer pastoral guidance
p=Path('data/spiritual-plans/prayer-30.json')
text=p.read_text(encoding='utf-8')
replacements={
"این پلن برای ایماندارانی است که عطای زبان‌ها را تجربه کرده‌اند یا با آرامش آن را از خدا می‌طلبند. هیچ واژه‌ای را با فشار تولید نکن و خودت را با دیگری مقایسه نکن. ارزش و نجات تو به این عطا وابسته نیست. دعای شخصی به زبان‌ها جای کلام، محبت و دعای قابل‌فهم را نمی‌گیرد؛ و کاربرد عمومی آن باید مطابق نظم و تفسیرِ اول قرنتیان ۱۴ باشد.":"این پلن برای ایماندارانی است که عطای زبان‌ها را دریافت کرده‌اند یا آن را از خدا می‌طلبند. در دعای شخصی به زبان‌ها، روح انسان به‌وسیلهٔ روح‌القدس دعا می‌کند و خود را بنا می‌نماید (اول قرنتیان ۱۴:۲، ۴، ۱۴؛ یهودا ۲۰). در تعلیم ما، دعا به زبان‌ها جایگاهی برتر و بسیار مؤثر در زندگی دعایی دارد؛ زیرا ما را فراتر از محدودیت فهم انسانی وارد دعای در روح می‌کند. کلام و محبت همواره اساس زندگی مسیحی‌اند؛ و کاربرد عمومی زبان‌ها در اجتماع کلیسا باید مطابق نظم کتاب‌مقدسی اول قرنتیان ۱۴ باشد.",
"This plan is for believers who practice the gift of tongues or are peacefully asking God for it. Do not force sounds or compare yourself with anyone. Your salvation and worth do not depend on this gift. Private prayer in tongues does not replace Scripture, love, or prayer with understanding; public use should follow the order and interpretation taught in 1 Corinthians 14.":"This plan is for believers who have received the gift of tongues or are asking God for it. In personal prayer in tongues, the human spirit prays by the Holy Spirit and is built up (1 Corinthians 14:2, 4, 14; Jude 20). In our teaching, prayer in tongues has a higher and especially powerful place in the life of prayer because it carries us beyond the limitation of human understanding into prayer in the Spirit. Scripture and love remain foundational to Christian life, and the public use of tongues in the church gathering should follow the biblical order of 1 Corinthians 14.",
"Ovaj je plan za vjernike koji prakticiraju dar jezika ili ga mirno traže od Boga. Nemoj prisiljavati glasove niti se uspoređivati s drugima. Tvoje spasenje i vrijednost ne ovise o ovom daru. Osobna molitva u jezicima ne zamjenjuje Pismo, ljubav ni molitvu s razumijevanjem; javna uporaba treba slijediti red i tumačenje iz 1. Korinćanima 14.":"Ovaj je plan za vjernike koji su primili dar jezika ili ga traže od Boga. U osobnoj molitvi u jezicima ljudski duh moli po Duhu Svetome i izgrađuje se (1. Korinćanima 14:2, 4, 14; Juda 20). U našem nauku molitva u jezicima ima više i osobito snažno mjesto u molitvenom životu jer nas vodi iznad ograničenja ljudskog razumijevanja u molitvu u Duhu. Pismo i ljubav ostaju temelj kršćanskog života, a javna uporaba jezika na crkvenom okupljanju treba slijediti biblijski red iz 1. Korinćanima 14."
}
for old,new in replacements.items():
    if old not in text:
        raise SystemExit('Prayer pastoral note marker not found')
    text=text.replace(old,new,1)
p.write_text(text,encoding='utf-8')

# fasting content note
p=Path('data/spiritual-plans/fasting-7.json')
text=p.read_text(encoding='utf-8')
replacements={
"روزهٔ غذایی برای همه مناسب نیست. اگر دیابت، بارداری یا شیردهی، سابقهٔ اختلال خوردن، بیماری مزمن، داروی منظم یا هر نگرانی پزشکی داری، پیش از تغییر غذا با پزشک مشورت کن. بدون راهنمایی تخصصی وارد روزهٔ طولانی یا روزهٔ فقط آب نشو. می‌توانی روزهٔ غیرغذایی انتخاب کنی.":"روزه را با حکمت و توجه به شرایط بدنی و مسئولیت‌های روزانهٔ خود انتخاب کن. اگر شرایط جسمی ویژه یا داروی منظم داری، از راهنمایی حرفه‌ای مناسب استفاده کن.",
"Food fasting is not suitable for everyone. If you have diabetes, are pregnant or breastfeeding, have an eating-disorder history, chronic illness, regular medication, or any medical concern, consult a clinician before changing food intake. Do not attempt extended or water-only fasting without professional guidance. A non-food fast is a valid option.":"Choose your fast with wisdom and with attention to your physical condition and daily responsibilities. If you have a special health circumstance or take regular medication, use appropriate professional guidance.",
"Post od hrane nije prikladan za svakoga. Ako imaš dijabetes, trudna si ili dojiš, imaš povijest poremećaja hranjenja, kroničnu bolest, redovitu terapiju ili zdravstvenu dvojbu, prije promjene prehrane razgovaraj s liječnikom. Ne započinji produljeni post ili post samo na vodi bez stručnog vodstva. Možeš izabrati neprehrambeni post.":"Odaberi post mudro, uzimajući u obzir svoje tjelesno stanje i svakodnevne obveze. Ako imaš posebne zdravstvene okolnosti ili redovito uzimaš terapiju, koristi odgovarajuće stručno vodstvo."
}
for old,new in replacements.items():
    if old not in text:
        raise SystemExit('Fasting safety marker not found')
    text=text.replace(old,new,1)
p.write_text(text,encoding='utf-8')

# fasting UI: remove safety checkbox/block and rename any remaining label to practical note, matching approved Wave 2 behavior.
p=Path('js/nh7-spiritual-plans-v240.js')
text=p.read_text(encoding='utf-8')
text=text.replace("safety: 'Health and safety', safetyAck: 'I have read the safety note and will choose a medically appropriate fast.',", "safety: 'Practical note',",1)
text=text.replace("safety: 'سلامت و ایمنی', safetyAck: 'یادداشت ایمنی را خوانده‌ام و روزه‌ای متناسب با وضعیت سلامتی‌ام انتخاب می‌کنم.',", "safety: 'یادداشت عملی',",1)
text=text.replace("safety: 'Zdravlje i sigurnost', safetyAck: 'Pročitao/la sam sigurnosnu napomenu i odabrat ću medicinski prikladan post.',", "safety: 'Praktična napomena',",1)
text=text.replace("fastingTeachingIntro: 'Each form below includes its purpose, practice, prayer rhythm, boundaries, and safety guidance.'", "fastingTeachingIntro: 'Each form below includes its purpose, practice, prayer rhythm, and practical guidance.'",1)
text=text.replace("fastingTeachingIntro: 'برای هر نوع روزه، هدف، روش اجرا، برنامهٔ دعا، پرهیزها و نکات ایمنی را بخوان.'", "fastingTeachingIntro: 'برای هر نوع روزه، هدف، روش اجرا، برنامهٔ دعا و راهنمای عملی را بخوان.'",1)
text=text.replace("fastingTeachingIntro: 'Za svaki oblik posta pročitaj svrhu, način provedbe, ritam molitve, granice i sigurnosne smjernice.'", "fastingTeachingIntro: 'Za svaki oblik posta pročitaj svrhu, način provedbe, ritam molitve i praktične smjernice.'",1)

# remove checkbox state and its required validation if present
import re
text=re.sub(r"\s*const safetyAck\s*=\s*[^;]+;","",text)
text=re.sub(r"\s*if\s*\(\s*!safetyAck\s*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}","",text)
text=text.replace("safetyAck,","")
text=text.replace("safetyAck:","removedSafetyAck:") if False else text
# remove explicit safety checkbox markup and safety-guide blocks used in the approved Wave 2 variant
text=re.sub(r"<label[^>]*class=\"[^\"]*nh7FastingSafety[^\"]*\"[^>]*>[\s\S]*?</label>","",text)
text=re.sub(r"<[^>]+class=\"[^\"]*nh7-fast-guide-safety[^\"]*\"[^>]*>[\s\S]*?</[^>]+>","",text)
text=re.sub(r"<label[^>]*>[\s\S]*?data-fast-safety[^>]*>[\s\S]*?</label>","",text)
text=text.replace("document.getElementById('nh7FastingSafety')?.checked", "true")
p.write_text(text,encoding='utf-8')
