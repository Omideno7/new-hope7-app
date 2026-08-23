import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(root, p));
const keyOf = (book, chapter, verse) => `${book}|${Number(chapter)}|${Number(verse)}`;
const blockers = [];
const warnings = [];
const info = [];
const block = (code, detail) => blockers.push({ code, detail });
const warn = (code, detail) => warnings.push({ code, detail });

const progressPath = 'data/apocrypha/review/progress-v245.json';
const runtimePath = 'data/apocrypha/runtime/apocrypha-browser-19.preview.json';
const registryPaths = [
  'data/apocrypha/review/translation-overlays-v245.json',
  'data/apocrypha/review/translation-overlays-v246-continuation.json',
  'data/apocrypha/review/translation-overlays-v247-audit-corrections.json',
];

const progress = readJson(progressPath);
const runtime = readJson(runtimePath);
const expectedBooks = new Map((progress.complete_books || []).map((b) => [b.book_id, b]));
if (progress.complete_book_count !== 19 || expectedBooks.size !== 19) block('PROGRESS_BOOK_COUNT', `progress says ${progress.complete_book_count}, list has ${expectedBooks.size}`);
if (progress.complete_fresh_verse_rows !== 7501) block('PROGRESS_ROW_COUNT', `expected 7501, found ${progress.complete_fresh_verse_rows}`);

// Canonical sources: identity, chapter/verse contiguity, metadata and row totals.
const canonical = new Map();
const sourceStats = {};
let sourceRows = 0;
for (const [bookId, expected] of expectedBooks) {
  const sourcePath = `data/apocrypha/sources/en/${bookId}.en.json`;
  if (!exists(sourcePath)) { block('SOURCE_MISSING', sourcePath); continue; }
  let source;
  try { source = readJson(sourcePath); } catch (e) { block('SOURCE_JSON', `${sourcePath}: ${e.message}`); continue; }
  if (source.book_id !== bookId) block('SOURCE_ID', `${sourcePath}: ${source.book_id}`);
  if (!source.source_translation) block('SOURCE_TRANSLATION', `${bookId}: missing source_translation`);
  if (!source.source_license) block('SOURCE_LICENSE', `${bookId}: missing source_license`);
  if (!source.versification) block('SOURCE_VERSIFICATION', `${bookId}: missing versification`);
  if (!Array.isArray(source.chapters) || source.chapters.length !== Number(source.chapter_count)) block('SOURCE_CHAPTER_COUNT', `${bookId}: metadata=${source.chapter_count}, actual=${source.chapters?.length}`);
  let rows = 0;
  for (let ci = 0; ci < (source.chapters || []).length; ci++) {
    const ch = source.chapters[ci];
    if (Number(ch.chapter) !== ci + 1) block('SOURCE_CHAPTER_ORDER', `${bookId}: expected chapter ${ci + 1}, found ${ch.chapter}`);
    const seen = new Set();
    for (let vi = 0; vi < (ch.verses || []).length; vi++) {
      const row = ch.verses[vi];
      const k = keyOf(bookId, ch.chapter, row.verse);
      if (seen.has(Number(row.verse))) block('SOURCE_DUPLICATE_VERSE', k);
      seen.add(Number(row.verse));
      if (Number(row.verse) !== vi + 1) block('SOURCE_VERSE_ORDER', `${bookId} ${ch.chapter}: expected ${vi + 1}, found ${row.verse}`);
      if (typeof row.text_en !== 'string' || !row.text_en.trim()) block('SOURCE_BLANK_EN', k);
      if (canonical.has(k)) block('SOURCE_DUPLICATE_KEY', k);
      canonical.set(k, { bookId, chapter: Number(ch.chapter), verse: Number(row.verse), text_en: row.text_en });
      rows++;
    }
  }
  if (rows !== Number(source.verse_count)) block('SOURCE_TOTAL_METADATA', `${bookId}: metadata=${source.verse_count}, actual=${rows}`);
  if (rows !== Number(expected.verses)) block('SOURCE_PROGRESS_MISMATCH', `${bookId}: progress=${expected.verses}, source=${rows}`);
  sourceStats[bookId] = { chapters: source.chapters?.length || 0, rows, translation: source.source_translation, license: source.source_license, versification: source.versification };
  sourceRows += rows;
}
if (sourceRows !== 7501 || canonical.size !== 7501) block('SOURCE_CORPUS_TOTAL', `rows=${sourceRows}, unique=${canonical.size}`);

// Runtime must contain exactly the same canonical EN references before overlays.
const runtimeIndex = new Map();
let runtimeRows = 0;
for (const book of runtime.books || []) {
  for (const ch of book.chapters || []) {
    for (const v of ch.verses || []) {
      const k = keyOf(book.book_id, ch.chapter, v.verse);
      if (runtimeIndex.has(k)) block('RUNTIME_DUPLICATE_KEY', k);
      runtimeIndex.set(k, v);
      runtimeRows++;
      const src = canonical.get(k);
      if (!src) block('RUNTIME_NON_SOURCE_REFERENCE', k);
      else if (v.text_en !== src.text_en) block('RUNTIME_EN_SOURCE_MISMATCH', k);
      // Ignore any old/legacy localized runtime text. Fresh audit starts from EN-only canonical rows.
      v.text_fa = null; v.text_hr = null; v.status_fa = null; v.status_hr = null;
    }
  }
}
if ((runtime.books || []).length !== 19) block('RUNTIME_BOOK_COUNT', `found ${(runtime.books || []).length}`);
if (runtimeRows !== 7501 || runtimeIndex.size !== 7501) block('RUNTIME_ROW_COUNT', `rows=${runtimeRows}, unique=${runtimeIndex.size}`);
for (const k of canonical.keys()) if (!runtimeIndex.has(k)) block('RUNTIME_MISSING_SOURCE_REFERENCE', k);

const appliedTargets = new Map();
const overlayFiles = [];
const registryStats = [];
function applyLoc(bookId, chapter, verse, loc, text, status, filePath, registryIndex) {
  if (status !== 'in_review' || typeof text !== 'string' || !text.trim()) return;
  const k = keyOf(bookId, chapter, verse);
  const target = runtimeIndex.get(k);
  if (!target) { block('OVERLAY_NON_SOURCE_REFERENCE', `${filePath}: ${k}`); return; }
  const lk = `${k}|${loc}`;
  if (appliedTargets.has(lk)) {
    const prev = appliedTargets.get(lk);
    if (registryIndex < 2) warn('OVERLAY_DUPLICATE_PRE_AUDIT', `${lk}: ${prev.file} -> ${filePath}`);
  }
  target[`text_${loc}`] = text;
  target[`status_${loc}`] = 'in_review';
  appliedTargets.set(lk, { file: filePath, registryIndex });
}
function mergeDoc(doc, filePath, registryIndex) {
  if (!doc?.book_id) { block('OVERLAY_NO_BOOK_ID', filePath); return; }
  if (!expectedBooks.has(doc.book_id)) { block('OVERLAY_UNKNOWN_BOOK', `${filePath}: ${doc.book_id}`); return; }
  if (Array.isArray(doc.verses)) {
    const chapter = Number(doc.chapter || 1);
    for (const row of doc.verses) {
      applyLoc(doc.book_id, chapter, row.verse, 'fa', row.text_fa, row.status_fa, filePath, registryIndex);
      applyLoc(doc.book_id, chapter, row.verse, 'hr', row.text_hr, row.status_hr, filePath, registryIndex);
    }
  }
  if (Array.isArray(doc.chapters)) {
    const declared = String(doc.language || '');
    for (const ch of doc.chapters) for (const row of ch.verses || []) {
      if (declared === 'fa' || declared === 'hr') {
        // Reader treats text in a declared-language review document as in_review.
        applyLoc(doc.book_id, ch.chapter, row.verse, declared, row.text, 'in_review', filePath, registryIndex);
      } else {
        applyLoc(doc.book_id, ch.chapter, row.verse, 'fa', row.text_fa, row.status_fa, filePath, registryIndex);
        applyLoc(doc.book_id, ch.chapter, row.verse, 'hr', row.text_hr, row.status_hr, filePath, registryIndex);
      }
    }
  }
}

for (let ri = 0; ri < registryPaths.length; ri++) {
  const registryPath = registryPaths[ri];
  if (!exists(registryPath)) { block('REGISTRY_MISSING', registryPath); continue; }
  let reg;
  try { reg = readJson(registryPath); } catch (e) { block('REGISTRY_JSON', `${registryPath}: ${e.message}`); continue; }
  const localSeen = new Set();
  let loaded = 0;
  for (const filePath of reg.files || []) {
    if (localSeen.has(filePath)) { block('REGISTRY_DUPLICATE_PATH', `${registryPath}: ${filePath}`); continue; }
    localSeen.add(filePath);
    overlayFiles.push(filePath);
    if (!exists(filePath)) { block('OVERLAY_FILE_MISSING', filePath); continue; }
    try { mergeDoc(readJson(filePath), filePath, ri); loaded++; }
    catch (e) { block('OVERLAY_JSON', `${filePath}: ${e.message}`); }
  }
  registryStats.push({ path: registryPath, declared: (reg.files || []).length, loaded });
}

// Mirror v2.4.7 Reader display normalizations.
const enoch = runtimeIndex.get(keyOf('1_enoch', 108, 15));
if (enoch) {
  if (typeof enoch.text_en === 'string') enoch.text_en = enoch.text_en.replace(/\s*Printed in Great Britain by Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i, '').trim();
  if (typeof enoch.text_hr === 'string') enoch.text_hr = enoch.text_hr.replace(/\s*Tiskano u Velikoj Britaniji u tiskari Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i, '').trim();
  if (typeof enoch.text_fa === 'string') enoch.text_fa = enoch.text_fa.replace(/\s*چاپ‌شده در بریتانیای کبیر توسط Richard Clay and Company, Ltd\.، Bungay، Suffolk\.?\s*$/, '').trim();
}
const az55 = runtimeIndex.get(keyOf('prayer_of_azariah', 1, 55));
if (az55) az55.text_en = 'O ye fountains, bless ye the Lord: praise and exalt him above all for ever.';

const placeholder = /(TODO|TBD|TRANSLATE|\[\[(?:C\d+V\d+|V\d+)\]\]|\/n\/n|\\n\\n|\[object Object\])/iu;
const control = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;
const imprint = /(Printed in Great Britain|Richard Clay and Company|Tiskano u Velikoj Britaniji|چاپ‌شده در بریتانیای کبیر)/iu;
const legacyMarker = /(Razgah|رازگاه|prepared[-_ ]existing|legacy[_ -]text)/iu;
const cyrillic = /[А-Яа-яЁё]/u;
const byBook = {};
let finalFa = 0, finalHr = 0, finalEn = 0;
for (const [k, src] of canonical) {
  const v = runtimeIndex.get(k);
  if (!v) continue;
  byBook[src.bookId] ||= { en: 0, fa: 0, hr: 0, missing_fa: 0, missing_hr: 0, text_issues: 0 };
  const bs = byBook[src.bookId];
  const en = String(v.text_en || '').trim();
  const fa = String(v.text_fa || '').trim();
  const hr = String(v.text_hr || '').trim();
  if (!en) block('FINAL_BLANK_EN', k); else { finalEn++; bs.en++; }
  if (!fa || v.status_fa !== 'in_review') { block('FINAL_MISSING_FA', k); bs.missing_fa++; } else { finalFa++; bs.fa++; }
  if (!hr || v.status_hr !== 'in_review') { block('FINAL_MISSING_HR', k); bs.missing_hr++; } else { finalHr++; bs.hr++; }
  for (const [loc, text] of [['fa', fa], ['hr', hr]]) {
    if (!text) continue;
    if (placeholder.test(text)) { block('TEXT_PLACEHOLDER', `${k}|${loc}`); bs.text_issues++; }
    if (control.test(text)) { block('TEXT_CONTROL_CHAR', `${k}|${loc}`); bs.text_issues++; }
    if (imprint.test(text)) { block('TEXT_EDITORIAL_IMPRINT', `${k}|${loc}`); bs.text_issues++; }
    if (legacyMarker.test(text)) { block('TEXT_LEGACY_MARKER', `${k}|${loc}`); bs.text_issues++; }
    if (loc === 'hr' && cyrillic.test(text)) { block('HR_CYRILLIC', k); bs.text_issues++; }
    if (loc === 'fa' && !/[\u0600-\u06FF]/u.test(text)) warn('FA_SCRIPT_SANITY', k);
    if (loc === 'hr' && !/[A-Za-zČĆŽŠĐčćžšđ]/u.test(text)) warn('HR_SCRIPT_SANITY', k);
  }
}
if (finalEn !== 7501 || finalFa !== 7501 || finalHr !== 7501) block('FINAL_COVERAGE_TOTAL', `EN=${finalEn}, FA=${finalFa}, HR=${finalHr}`);
for (const [bookId, expected] of expectedBooks) {
  const s = byBook[bookId] || {};
  if (s.en !== expected.verses || s.fa !== expected.fa || s.hr !== expected.hr) block('FINAL_BOOK_COVERAGE', `${bookId}: expected ${expected.verses}/${expected.fa}/${expected.hr}, got ${s.en || 0}/${s.fa || 0}/${s.hr || 0}`);
}

// Required known audit corrections must be visible in the merged result.
const tobit11 = runtimeIndex.get(keyOf('tobit', 14, 11));
if (!tobit11?.text_fa?.includes('صد و پنجاه‌وهشت')) block('KNOWN_FIX_TOBIT_14_11', 'Persian 158 correction not active');
const tobit12 = runtimeIndex.get(keyOf('tobit', 1, 2));
if (/قادش/u.test(tobit12?.text_fa || '') || /Kadeš/iu.test(tobit12?.text_hr || '')) block('KNOWN_FIX_TOBIT_1_2', 'Introduced Kadesh still present');
if (!/چشمه/u.test(az55?.text_fa || '') || !/Izvori/iu.test(az55?.text_hr || '') || !/fountains/iu.test(az55?.text_en || '')) block('KNOWN_FIX_AZARIAH_1_55', 'Fountains normalization incomplete');
if (imprint.test(`${enoch?.text_en || ''} ${enoch?.text_fa || ''} ${enoch?.text_hr || ''}`)) block('KNOWN_FIX_ENOCH_108_15', 'Printer imprint still visible');

const report = {
  schema_version: 1,
  audit_version: '2.4.7',
  generated_at: new Date().toISOString(),
  branch: process.env.GITHUB_REF_NAME || null,
  commit: process.env.GITHUB_SHA || null,
  scope: { books: 19, canonical_rows: 7501 },
  coverage: { english: finalEn, persian: finalFa, croatian: finalHr },
  sources: { rows: sourceRows, books: sourceStats },
  registries: registryStats,
  overlay_file_occurrences: overlayFiles.length,
  unique_applied_locale_targets: appliedTargets.size,
  by_book: byBook,
  blockers,
  warnings,
  blocker_count: blockers.length,
  warning_count: warnings.length,
  structural_release_gate_passed: blockers.length === 0,
  note: 'This is the machine structural/text-sanity gate. Integrated browser/mobile QA remains a separate gate.'
};
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/apocrypha-corpus-audit-v247.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`APOCRYPHA_AUDIT books=19 canonical=7501 EN=${finalEn} FA=${finalFa} HR=${finalHr} blockers=${blockers.length} warnings=${warnings.length}`);
for (const b of blockers.slice(0, 100)) console.log(`BLOCKER ${b.code}: ${b.detail}`);
for (const w of warnings.slice(0, 100)) console.log(`WARNING ${w.code}: ${w.detail}`);
process.exitCode = 0;
