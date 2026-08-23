import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(root, p));
const refKey = (b, c, v) => `${b}|${Number(c)}|${Number(v)}`;
const blockers = [];
const warnings = [];
const block = (code, detail) => blockers.push({ code, detail });
const warn = (code, detail) => warnings.push({ code, detail });

const progress = read('data/apocrypha/review/progress-v245.json');
const expected = new Map((progress.complete_books || []).map((x) => [x.book_id, x]));
const canonical = new Map();
let sourceRows = 0;

for (const [bookId, expectedBook] of expected) {
  const sourcePath = `data/apocrypha/sources/en/${bookId}.en.json`;
  if (!exists(sourcePath)) { block('SOURCE_MISSING', sourcePath); continue; }
  const source = read(sourcePath);
  if (source.book_id !== bookId) block('SOURCE_ID', `${bookId}: ${source.book_id}`);
  if (!source.source_translation || !source.source_license || !source.versification) block('SOURCE_METADATA', bookId);
  if (!Array.isArray(source.chapters) || source.chapters.length !== Number(source.chapter_count)) block('SOURCE_CHAPTER_COUNT', bookId);
  let rows = 0;
  for (let ci = 0; ci < (source.chapters || []).length; ci++) {
    const chapter = source.chapters[ci];
    if (Number(chapter.chapter) !== ci + 1) block('SOURCE_CHAPTER_ORDER', `${bookId}:${chapter.chapter}`);
    let previous = null;
    const seen = new Set();
    for (const verse of chapter.verses || []) {
      const no = Number(verse.verse);
      const ref = refKey(bookId, chapter.chapter, no);
      if (!Number.isInteger(no) || no < 1) block('SOURCE_VERSE_NUMBER', ref);
      if (seen.has(no)) block('SOURCE_DUPLICATE_VERSE', ref);
      seen.add(no);
      if (previous !== null && no !== previous + 1) block('SOURCE_VERSE_GAP', `${bookId} ${chapter.chapter}: ${previous}->${no}`);
      previous = no;
      if (!String(verse.text_en || '').trim()) block('SOURCE_BLANK_EN', ref);
      if (canonical.has(ref)) block('SOURCE_DUPLICATE_KEY', ref);
      canonical.set(ref, { bookId, chapter: Number(chapter.chapter), verse: no, text_en: verse.text_en });
      rows++;
    }
  }
  if (rows !== Number(source.verse_count) || rows !== Number(expectedBook.verses)) {
    block('SOURCE_TOTAL', `${bookId}: actual=${rows}, metadata=${source.verse_count}, progress=${expectedBook.verses}`);
  }
  sourceRows += rows;
}
if (expected.size !== 19 || progress.complete_book_count !== 19) block('PROGRESS_BOOK_COUNT', `${expected.size}/${progress.complete_book_count}`);
if (sourceRows !== 7501 || canonical.size !== 7501) block('SOURCE_CORPUS_TOTAL', `${sourceRows}/${canonical.size}`);

// Mirror the real Reader's fresh-filter: keep only localized runtime text explicitly marked in_review.
const runtime = read('data/apocrypha/runtime/apocrypha-browser-19.preview.json');
const runtimeIndex = new Map();
let runtimeRows = 0;
for (const book of runtime.books || []) {
  for (const chapter of book.chapters || []) {
    for (const verse of chapter.verses || []) {
      const ref = refKey(book.book_id, chapter.chapter, verse.verse);
      if (runtimeIndex.has(ref)) block('RUNTIME_DUPLICATE_KEY', ref);
      runtimeIndex.set(ref, verse);
      runtimeRows++;
      const source = canonical.get(ref);
      if (!source) block('RUNTIME_NON_SOURCE', ref);
      else if (verse.text_en !== source.text_en) block('RUNTIME_EN_SOURCE_MISMATCH', ref);
      if (verse.status_fa !== 'in_review' || !String(verse.text_fa || '').trim()) { verse.text_fa = null; verse.status_fa = null; }
      if (verse.status_hr !== 'in_review' || !String(verse.text_hr || '').trim()) { verse.text_hr = null; verse.status_hr = null; }
    }
  }
}
if ((runtime.books || []).length !== 19 || runtimeRows !== 7501 || runtimeIndex.size !== 7501) {
  block('RUNTIME_TOTAL', `books=${runtime.books?.length}, rows=${runtimeRows}, unique=${runtimeIndex.size}`);
}
for (const ref of canonical.keys()) if (!runtimeIndex.has(ref)) block('RUNTIME_MISSING_SOURCE', ref);

const registries = [
  'data/apocrypha/review/translation-overlays-v245.json',
  'data/apocrypha/review/translation-overlays-v246-continuation.json',
  'data/apocrypha/review/translation-overlays-v247-audit-corrections.json'
];
const registryStats = [];
const applied = new Map();

function applyLocale(bookId, chapter, verse, locale, text, status, file, registryIndex) {
  if (status !== 'in_review' || !String(text || '').trim()) return;
  const ref = refKey(bookId, chapter, verse);
  const target = runtimeIndex.get(ref);
  if (!target) {
    // The hardened Reader now rejects these rows instead of creating artificial verses.
    warn('OVERLAY_NON_SOURCE_SKIPPED', `${file}: ${ref}`);
    return;
  }
  const localeKey = `${ref}|${locale}`;
  if (applied.has(localeKey) && registryIndex < 2) warn('OVERLAY_OVERRIDE', `${localeKey}: ${applied.get(localeKey)} -> ${file}`);
  target[`text_${locale}`] = text;
  target[`status_${locale}`] = 'in_review';
  applied.set(localeKey, file);
}

function mergeDocument(doc, file, registryIndex) {
  if (!doc?.book_id || !expected.has(doc.book_id)) { block('OVERLAY_BOOK', file); return; }
  const declared = ['fa', 'hr'].includes(String(doc.language || '')) ? String(doc.language) : '';
  const mergeRows = (chapter, rows) => {
    for (const row of rows || []) {
      if (declared) applyLocale(doc.book_id, chapter, row.verse, declared, row.text, 'in_review', file, registryIndex);
      else {
        applyLocale(doc.book_id, chapter, row.verse, 'fa', row.text_fa, row.status_fa, file, registryIndex);
        applyLocale(doc.book_id, chapter, row.verse, 'hr', row.text_hr, row.status_hr, file, registryIndex);
      }
    }
  };
  if (Array.isArray(doc.verses)) mergeRows(Number(doc.chapter || 1), doc.verses);
  if (Array.isArray(doc.chapters)) for (const chapter of doc.chapters) mergeRows(chapter.chapter, chapter.verses);
}

for (let ri = 0; ri < registries.length; ri++) {
  const registryPath = registries[ri];
  if (!exists(registryPath)) { block('REGISTRY_MISSING', registryPath); continue; }
  const registry = read(registryPath);
  const seen = new Set();
  let loaded = 0;
  for (const file of registry.files || []) {
    if (seen.has(file)) { block('REGISTRY_DUPLICATE_PATH', `${registryPath}: ${file}`); continue; }
    seen.add(file);
    if (!exists(file)) { block('OVERLAY_FILE_MISSING', file); continue; }
    try { mergeDocument(read(file), file, ri); loaded++; }
    catch (error) { block('OVERLAY_JSON', `${file}: ${error.message}`); }
  }
  registryStats.push({ path: registryPath, declared: (registry.files || []).length, loaded });
}

// Reader-only source/display normalizations documented by the audit.
const enoch10815 = runtimeIndex.get(refKey('1_enoch', 108, 15));
if (enoch10815) {
  enoch10815.text_en = String(enoch10815.text_en || '').replace(/\s*Printed in Great Britain by Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i, '').trim();
  enoch10815.text_hr = String(enoch10815.text_hr || '').replace(/\s*Tiskano u Velikoj Britaniji u tiskari Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i, '').trim();
  enoch10815.text_fa = String(enoch10815.text_fa || '').replace(/\s*چاپ‌شده در بریتانیای کبیر توسط Richard Clay and Company, Ltd\.، Bungay، Suffolk\.?\s*$/, '').trim();
}
const azariah155 = runtimeIndex.get(refKey('prayer_of_azariah', 1, 55));
if (azariah155) azariah155.text_en = 'O ye fountains, bless ye the Lord: praise and exalt him above all for ever.';

const placeholder = /(TODO|TBD|TRANSLATE|\[\[(?:C\d+V\d+|V\d+)\]\]|\/n\/n|\\n\\n|\[object Object\])/iu;
const control = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;
const imprint = /(Printed in Great Britain|Richard Clay and Company|Tiskano u Velikoj Britaniji|چاپ‌شده در بریتانیای کبیر)/iu;
const legacy = /(Razgah|رازگاه|prepared[-_ ]existing|legacy[_ -]text)/iu;
const cyrillic = /[А-Яа-яЁё]/u;
let english = 0, persian = 0, croatian = 0;
const byBook = {};
const missing = {};

for (const [ref, source] of canonical) {
  const row = runtimeIndex.get(ref);
  if (!row) continue;
  byBook[source.bookId] ||= { en: 0, fa: 0, hr: 0, text_issues: 0 };
  missing[source.bookId] ||= { fa: [], hr: [] };
  const stats = byBook[source.bookId];
  const en = String(row.text_en || '').trim();
  const fa = String(row.text_fa || '').trim();
  const hr = String(row.text_hr || '').trim();
  if (en) { english++; stats.en++; } else block('FINAL_BLANK_EN', ref);
  if (fa && row.status_fa === 'in_review') { persian++; stats.fa++; } else { block('FINAL_MISSING_FA', ref); missing[source.bookId].fa.push(`${source.chapter}:${source.verse}`); }
  if (hr && row.status_hr === 'in_review') { croatian++; stats.hr++; } else { block('FINAL_MISSING_HR', ref); missing[source.bookId].hr.push(`${source.chapter}:${source.verse}`); }
  for (const [locale, text] of [['fa', fa], ['hr', hr]]) {
    if (!text) continue;
    if (placeholder.test(text)) { block('TEXT_PLACEHOLDER', `${ref}|${locale}`); stats.text_issues++; }
    if (control.test(text)) { block('TEXT_CONTROL', `${ref}|${locale}`); stats.text_issues++; }
    if (imprint.test(text)) { block('TEXT_IMPRINT', `${ref}|${locale}`); stats.text_issues++; }
    if (legacy.test(text)) { block('TEXT_LEGACY', `${ref}|${locale}`); stats.text_issues++; }
    if (locale === 'hr' && cyrillic.test(text)) { block('HR_CYRILLIC', ref); stats.text_issues++; }
  }
}

if (english !== 7501 || persian !== 7501 || croatian !== 7501) block('FINAL_TOTAL', `EN=${english}, FA=${persian}, HR=${croatian}`);
for (const [bookId, exp] of expected) {
  const stats = byBook[bookId] || {};
  if (stats.en !== exp.verses || stats.fa !== exp.fa || stats.hr !== exp.hr) {
    block('FINAL_BOOK_TOTAL', `${bookId}: ${stats.en || 0}/${stats.fa || 0}/${stats.hr || 0} expected ${exp.verses}/${exp.fa}/${exp.hr}`);
  }
}

// Explicit regression assertions for verified audit corrections.
const tobit1411 = runtimeIndex.get(refKey('tobit', 14, 11));
const tobit12 = runtimeIndex.get(refKey('tobit', 1, 2));
const macc2115 = runtimeIndex.get(refKey('2_maccabees', 11, 5));
if (!tobit1411?.text_fa?.includes('صد و پنجاه‌وهشت')) block('KNOWN_TOBIT_14_11', '158 correction inactive');
if (/قادش/u.test(tobit12?.text_fa || '') || /Kadeš/iu.test(tobit12?.text_hr || '')) block('KNOWN_TOBIT_1_2', 'Kadesh correction inactive');
if (!/چشمه/u.test(azariah155?.text_fa || '') || !/Izvori/iu.test(azariah155?.text_hr || '') || !/fountains/iu.test(azariah155?.text_en || '')) block('KNOWN_AZARIAH_1_55', 'fountains normalization incomplete');
if (imprint.test(`${enoch10815?.text_en || ''} ${enoch10815?.text_fa || ''} ${enoch10815?.text_hr || ''}`)) block('KNOWN_ENOCH_108_15', 'printer imprint visible');
if (/بیست\s*فرسنگ/u.test(macc2115?.text_fa || '') || !/پنج\s*فرلانگ/u.test(macc2115?.text_fa || '')) block('KNOWN_2MACC_11_5', 'five-furlong Persian correction inactive');

const blockerSummary = {};
const warningSummary = {};
for (const item of blockers) blockerSummary[item.code] = (blockerSummary[item.code] || 0) + 1;
for (const item of warnings) warningSummary[item.code] = (warningSummary[item.code] || 0) + 1;
const report = {
  schema_version: 1,
  audit_version: '2.5.0',
  generated_at: new Date().toISOString(),
  branch: process.env.GITHUB_REF_NAME || null,
  commit: process.env.GITHUB_SHA || null,
  scope: { books: 19, canonical_rows: 7501 },
  coverage: { english, persian, croatian },
  source_rows: sourceRows,
  registries: registryStats,
  by_book: byBook,
  missing_refs: missing,
  blocker_summary: blockerSummary,
  warning_summary: warningSummary,
  blocker_count: blockers.length,
  warning_count: warnings.length,
  blockers,
  warnings,
  structural_release_gate_passed: blockers.length === 0,
  note: 'Machine corpus gate mirrors fresh-filter + hardened Reader overlay. Integrated browser/mobile QA remains a separate final gate.'
};
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/apocrypha-corpus-audit-v250.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`AUDIT250 EN=${english} FA=${persian} HR=${croatian} BLOCKERS=${blockers.length} WARNINGS=${warnings.length}`);
console.log('BLOCKERS ' + JSON.stringify(blockerSummary));
console.log('WARNINGS ' + JSON.stringify(warningSummary));
for (const [bookId, refs] of Object.entries(missing)) if (refs.fa.length || refs.hr.length) console.log(`MISSING ${bookId} FA=${refs.fa.join(',')} HR=${refs.hr.join(',')}`);
for (const item of blockers.slice(0, 100)) console.log(`BLOCKER ${item.code}: ${item.detail}`);
process.exitCode = 0;
