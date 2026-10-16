/* Presentation only. No telemetry, API, storage, timer, permission or playback ownership. */
(()=>{'use strict';
if(window.NH7AudioCostWave75)return;
const copy={fa:'تحلیل شنیدن عمداً غیرفعال است تا هزینهٔ اضافی ذخیره‌سازی و درخواست‌های بک‌اند ایجاد نشود.',en:'Listening analytics are intentionally disabled to avoid additional backend storage and request costs.',hr:'Analitika slušanja namjerno je onemogućena kako bi se izbjegli dodatni troškovi pohrane i pozadinskih zahtjeva.'};
const text=language=>copy[language]||copy.en;
window.NH7AudioCostWave75=Object.freeze({decision:'REJECTED_COST',text,isAudio:value=>['sermon','audio_bible','school'].includes(String(value)),notice:language=>'<p class="notice small" data-audio-cost-wave75 role="note">'+text(language)+'</p>'});
})();
