export const languages = ["fa", "en", "hr"];
export const fonts = [
  "Vazirmatn",
  "Noto Naskh Arabic",
  "Amiri",
  "Markazi Text",
  "Inter",
  "Lora",
];
export const types = [
  [
    "water_baptism",
    "گواهی تعمید آب",
    "Water Baptism Certificate",
    "Potvrda o krštenju u vodi",
  ],
  [
    "course_completion",
    "گواهی پایان دوره",
    "Course Completion Certificate",
    "Potvrda o završetku tečaja",
  ],
  [
    "foundation_school",
    "گواهی پایان مدرسه پایه",
    "Foundation School Completion",
    "Završetak temeljne škole",
  ],
  [
    "ministry_training",
    "گواهی آموزش خدمت",
    "Ministry Training Certificate",
    "Potvrda o osposobljavanju za službu",
  ],
  [
    "participation",
    "گواهی شرکت",
    "Participation Certificate",
    "Potvrda o sudjelovanju",
  ],
  ["membership", "گواهی عضویت", "Membership Certificate", "Potvrda o članstvu"],
  [
    "active_membership",
    "تأیید عضویت فعال",
    "Active Membership Confirmation",
    "Potvrda o aktivnom članstvu",
  ],
  [
    "ministry_service",
    "گواهی خدمت کلیسایی",
    "Ministry Service Certificate",
    "Potvrda o crkvenoj službi",
  ],
  [
    "volunteer",
    "قدردانی از خدمت داوطلبانه",
    "Volunteer Recognition",
    "Priznanje za volontiranje",
  ],
  [
    "conference",
    "گواهی شرکت در همایش",
    "Conference Participation",
    "Sudjelovanje na konferenciji",
  ],
  [
    "leadership",
    "گواهی آموزش رهبری",
    "Leadership Training",
    "Osposobljavanje za vodstvo",
  ],
  [
    "graduation",
    "گواهی فارغ‌التحصیلی",
    "Graduation Certificate",
    "Potvrda o diplomiranju",
  ],
  [
    "official_letter",
    "نامه رسمی کلیسا",
    "Official Church Letter",
    "Službeno crkveno pismo",
  ],
  [
    "custom_certificate",
    "گواهی سفارشی",
    "Custom Certificate",
    "Prilagođena potvrda",
  ],
  [
    "custom_document",
    "مدرک رسمی سفارشی",
    "Custom Official Document",
    "Prilagođeni službeni dokument",
  ],
].map(([id, fa, en, hr]) => ({
  id,
  titles: { fa, en, hr },
  requiresStudent: [
    "foundation_school",
    "course_completion",
    "ministry_training",
    "leadership",
    "graduation",
  ].includes(id),
}));
export const templates = [
  ["classic", "New Hope Classic", "#fffdf8", "#132c4b", "#b88b36", "double"],
  ["emerald", "New Hope Emerald", "#ffffff", "#174e3c", "#bb923f", "double"],
  ["royal", "Royal Blue", "#ffffff", "#163978", "#946e28", "academic"],
  ["gold", "Elegant Gold", "#fffaf0", "#352d26", "#a57f2c", "classic"],
  ["minimal", "Minimal Modern", "#ffffff", "#20323c", "#286c66", "minimal"],
  ["prestige", "Dark Prestige", "#132238", "#fff7e4", "#dbb861", "double"],
  ["celebration", "Celebration", "#fffdfb", "#194853", "#ac4355", "modern"],
  ["official", "Clean Official", "#ffffff", "#222f3c", "#536476", "minimal"],
].map(([id, name, background, ink, accent, frame]) => ({
  id,
  name,
  background,
  ink,
  accent,
  frame,
}));
export const palettes = [
  ["navyGold", "#132c4b", "#b88b36"],
  ["green", "#174e3c", "#b88b36"],
  ["royal", "#163978", "#5279ae"],
  ["burgundy", "#652b3a", "#b88b36"],
  ["charcoal", "#30383f", "#a7b1b9"],
  ["cream", "#5a452c", "#a57f2c"],
  ["minimal", "#222222", "#777777"],
];
const general = {
  fa: [
    "کلیسای امیدنو۷ با احترام تأیید می‌کند که شخص نامبرده شرایط مربوط به این مدرک را برآورده کرده است. این گواهی با تأیید مسئول کلیسا صادر می‌شود.",
    "با سپاس از وفاداری، تلاش و رشد شخص نامبرده، کلیسای امیدنو۷ این گواهی را اهدا می‌کند. دعا می‌کنیم مسیر او همراه با حکمت و محبت مسیح باشد.",
    "کلیسای امیدنو۷ این گواهی را به شخص نامبرده اهدا می‌کند.",
  ],
  en: [
    "New Hope 7 Church hereby confirms that the named recipient has fulfilled the requirements associated with this document. This certificate is issued with the approval of the church representative.",
    "In appreciation of the recipient’s faithfulness, dedication and growth, New Hope 7 Church presents this certificate. May their journey continue in the wisdom and love of Christ.",
    "New Hope 7 Church presents this certificate to the named recipient.",
  ],
  hr: [
    "Crkva New Hope 7 potvrđuje da je navedeni primatelj ispunio uvjete povezane s ovim dokumentom. Potvrda se izdaje uz odobrenje predstavnika crkve.",
    "U znak zahvalnosti za vjernost, predanost i rast primatelja, crkva New Hope 7 dodjeljuje ovu potvrdu. Neka njegov put bude vođen Kristovom mudrošću i ljubavlju.",
    "Crkva New Hope 7 dodjeljuje ovu potvrdu navedenom primatelju.",
  ],
};
const families = {
  completion: {
    fa: [
      "این گواهی تأیید می‌کند که شخص نامبرده دوره آموزشی تعیین‌شده را با موفقیت به پایان رسانده و شرایط لازم برای دریافت این مدرک را برآورده کرده است.",
      "کلیسای امیدنو۷ پایان موفقیت‌آمیز آموزش شخص نامبرده را گرامی می‌دارد. باشد که آموخته‌های او در خدمت مسیح و دیگران ثمر بیاورد.",
      "این مدرک به پاس پایان موفقیت‌آمیز دوره آموزشی به شخص نامبرده اهدا می‌شود.",
    ],
    en: [
      "This certifies that the named recipient has successfully completed the designated course of study and fulfilled the requirements for this award.",
      "New Hope 7 Church celebrates the recipient’s successful completion of training. May this learning bear fruit in service to Christ and others.",
      "Awarded to the named recipient in recognition of successful completion of the designated course.",
    ],
    hr: [
      "Ovim se potvrđuje da je navedeni primatelj uspješno završio određeni program obrazovanja i ispunio uvjete za ovu potvrdu.",
      "Crkva New Hope 7 slavi uspješan završetak obrazovanja primatelja. Neka stečeno znanje donese plod u služenju Kristu i drugima.",
      "Dodjeljuje se navedenom primatelju kao priznanje za uspješan završetak određenog programa.",
    ],
  },
  participation: {
    fa: [
      "این گواهی حضور و مشارکت شخص نامبرده در برنامه تعیین‌شده کلیسای امیدنو۷ را تأیید می‌کند.",
      "با سپاس از حضور، همراهی و مشارکت ارزشمند شخص نامبرده، کلیسای امیدنو۷ این گواهی را اهدا می‌کند.",
      "این گواهی به پاس شرکت در برنامه تعیین‌شده اهدا می‌شود.",
    ],
    en: [
      "This certificate confirms the recipient’s attendance and participation in the designated New Hope 7 Church program.",
      "With gratitude for the recipient’s presence, fellowship and valued participation, New Hope 7 Church presents this certificate.",
      "Awarded in recognition of participation in the designated program.",
    ],
    hr: [
      "Ova potvrda potvrđuje prisustvovanje i sudjelovanje primatelja u određenom programu crkve New Hope 7.",
      "Uz zahvalnost za prisutnost, zajedništvo i vrijedan doprinos primatelja, crkva New Hope 7 dodjeljuje ovu potvrdu.",
      "Dodjeljuje se kao priznanje za sudjelovanje u određenom programu.",
    ],
  },
  membership: {
    fa: [
      "کلیسای امیدنو۷ عضویت شخص نامبرده را مطابق سوابق و تأیید مسئول کلیسا گواهی می‌کند.",
      "با شادی از همراهی شخص نامبرده در خانواده کلیسای امیدنو۷ قدردانی می‌کنیم. باشد که در ایمان، محبت و مشارکت رشد کند.",
      "عضویت شخص نامبرده در کلیسای امیدنو۷ تأیید می‌شود.",
    ],
    en: [
      "New Hope 7 Church certifies the named recipient’s membership in accordance with church records and the approval of its representative.",
      "With joy, we recognize the recipient’s place in the New Hope 7 Church family. May they grow in faith, love and fellowship.",
      "The named recipient’s membership in New Hope 7 Church is confirmed.",
    ],
    hr: [
      "Crkva New Hope 7 potvrđuje članstvo navedenog primatelja prema crkvenim evidencijama i odobrenju predstavnika crkve.",
      "S radošću prepoznajemo mjesto primatelja u obitelji crkve New Hope 7. Neka raste u vjeri, ljubavi i zajedništvu.",
      "Potvrđuje se članstvo navedenog primatelja u crkvi New Hope 7.",
    ],
  },
  service: {
    fa: [
      "این گواهی به پاس خدمت وفادارانه و مشارکت ارزشمند شخص نامبرده در خدمت کلیسای امیدنو۷ صادر می‌شود.",
      "با سپاس از وقت، محبت و استعدادهایی که شخص نامبرده برای خدمت به دیگران به کار گرفته است، این گواهی قدردانی اهدا می‌شود.",
      "به پاس خدمت و مشارکت ارزشمند شخص نامبرده اهدا می‌شود.",
    ],
    en: [
      "This certificate recognizes the recipient’s faithful service and valued contribution to the ministry of New Hope 7 Church.",
      "With gratitude for the time, care and gifts the recipient has devoted to serving others, we present this recognition.",
      "Awarded in appreciation of the recipient’s service and valued contribution.",
    ],
    hr: [
      "Ova potvrda prepoznaje vjernu službu primatelja i njegov vrijedan doprinos službi crkve New Hope 7.",
      "Sa zahvalnošću za vrijeme, brigu i darove koje je primatelj posvetio služenju drugima, dodjeljujemo ovo priznanje.",
      "Dodjeljuje se u znak zahvalnosti za službu i vrijedan doprinos primatelja.",
    ],
  },
  letter: {
    fa: [
      "بدین‌وسیله کلیسای امیدنو۷ تأییدیه رسمی مربوط به شخص نامبرده را صادر می‌کند. موضوع و جزئیات این نامه باید پیش از صدور توسط مسئول کلیسا تکمیل و تأیید شود.",
      "این نامه با احترام و دعای خیر برای شخص نامبرده از سوی کلیسای امیدنو۷ صادر می‌شود. مسئول کلیسا موضوع و جزئیات مورد تأیید را در این بخش درج می‌کند.",
      "این نامه تأییدیه رسمی کلیسای امیدنو۷ است. لطفاً موضوع مورد تأیید را پیش از صدور درج کنید.",
    ],
    en: [
      "New Hope 7 Church issues this official letter concerning the named recipient. The church representative must complete and approve its subject and details before issuance.",
      "With respect and prayerful support for the named recipient, New Hope 7 Church issues this letter. The church representative records the approved subject and details here.",
      "This is an official New Hope 7 Church letter. Please enter the approved subject before issuance.",
    ],
    hr: [
      "Crkva New Hope 7 izdaje ovo službeno pismo o navedenom primatelju. Predstavnik crkve mora ispuniti i odobriti predmet i pojedinosti prije izdavanja.",
      "Uz poštovanje i molitvenu podršku navedenom primatelju, crkva New Hope 7 izdaje ovo pismo. Predstavnik crkve ovdje upisuje odobreni predmet i pojedinosti.",
      "Ovo je službeno pismo crkve New Hope 7. Prije izdavanja unesite odobreni predmet.",
    ],
  },
};
export function presets(type, language) {
  const item = types.find((t) => t.id === type) || types.at(-1),
    names = {
      fa: ["رسمی", "شبانانه", "کوتاه"],
      en: ["Formal", "Pastoral", "Concise"],
      hr: ["Službeni", "Pastoralni", "Sažeti"],
    };
  const body =
    type === "water_baptism"
      ? {
          fa: [
            "این گواهی تأیید می‌کند که شخص نامبرده ایمان خود را به عیسی مسیح علناً اقرار کرده و در آب تعمید یافته است.",
            "با شادی، تعمید شخص نامبرده را در آب و اقرار ایمان او به عیسی مسیح گرامی می‌داریم.",
            "شخص نامبرده در کلیسای امیدنو۷ در آب تعمید یافته است.",
          ],
          en: [
            "This certifies that the named recipient has publicly confessed faith in Jesus Christ and has been baptized in water.",
            "With joy, we celebrate the recipient’s baptism in water and public confession of faith in Jesus Christ.",
            "The named recipient was baptized in water at New Hope 7 Church.",
          ],
          hr: [
            "Ovim se potvrđuje da je navedeni primatelj javno ispovjedio vjeru u Isusa Krista i kršten u vodi.",
            "S radošću slavimo krštenje primatelja u vodi i javnu ispovijest vjere u Isusa Krista.",
            "Navedeni primatelj kršten je u vodi u crkvi New Hope 7.",
          ],
        }[language]
      : general[language];
  const family = [
    "course_completion",
    "foundation_school",
    "ministry_training",
    "leadership",
    "graduation",
  ].includes(type)
    ? "completion"
    : ["participation", "conference"].includes(type)
      ? "participation"
      : ["membership", "active_membership"].includes(type)
        ? "membership"
        : ["ministry_service", "volunteer"].includes(type)
          ? "service"
          : type === "official_letter"
            ? "letter"
            : null;
  const selected = family ? families[family][language] : body;
  const labels =
    family === "completion"
      ? {
          fa: ["آموزشی", "خدمتی", "دستاورد"],
          en: ["Academic", "Ministry", "Achievement"],
          hr: ["Obrazovni", "Služba", "Postignuće"],
        }[language]
      : names[language];
  return selected.map((text, i) => ({
    id: i,
    label: labels[i],
    title: item.titles[language],
    body:
      language === "fa"
        ? `${item.titles[language]}\n${text}`
        : `${item.titles[language]}\n${text}`,
  }));
}
