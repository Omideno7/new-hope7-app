import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDir, "..");
const dataDir = join(repositoryRoot, "data", "apocrypha", "review", "1_enoch");
const canonicalPath = resolve(
  repositoryRoot,
  "..",
  "apocrypha_sources",
  "canonical",
  "1_enoch.rh_charles.en.json",
);

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function assertCleanText(value, label) {
  assert(typeof value === "string" && value.trim(), `${label} must be nonblank`);
  assert(
    !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value),
    `${label} contains a control character`,
  );
  assert(
    !/(?:\bTODO\b|\bTBD\b|\bTRANSLATE\b|\bPLACEHOLDER\b|\[hr\])/iu.test(value),
    `${label} is a placeholder`,
  );
}

function englishChecksum(verses) {
  return createHash("sha256")
    .update(verses.map(({ verse, text_en: textEn }) => `${verse}\t${textEn}`).join("\n"), "utf8")
    .digest("hex");
}

const canonicalRaw = readFileSync(canonicalPath, "utf8");
const canonical = JSON.parse(canonicalRaw);
const manifest = loadJson(join(dataDir, "manifest.in-review.json"));
const canonicalByChapter = new Map(
  canonical.chapters.map((chapter) => [chapter.chapter, chapter]),
);

assert(canonical.book_id === "1_enoch", "Unexpected canonical book_id");
assert(canonical.chapter_count === 108, "Canonical chapter_count must be 108");
assert(canonical.verse_count === 1062, "Canonical verse_count must be 1062");
assert(manifest.book_id === "1_enoch", "Unexpected manifest book_id");
assert(manifest.status === "in_review", "Manifest status must be in_review");
assert(manifest.status_hr === "in_review", "Manifest status_hr must be in_review");
assert(manifest.source_translation === canonical.source_translation, "Source translation mismatch");
assert(manifest.source_sha256 === canonical.source_sha256, "Source SHA-256 mismatch");
assert(
  manifest.canonical_payload_sha256 ===
    createHash("sha256").update(canonicalRaw, "utf8").digest("hex"),
  "Canonical payload SHA-256 mismatch",
);
assert(manifest.versification === canonical.versification, "Versification mismatch");
assert(
  manifest.editorial_material?.heading_count === canonical.editorial_heading_count &&
    JSON.stringify(manifest.editorial_material?.headings) ===
      JSON.stringify(canonical.editorial_headings),
  "Editorial headings were not preserved exactly",
);
assert(
  manifest.editorial_material?.note_count === canonical.editorial_note_count &&
    JSON.stringify(manifest.editorial_material?.notes) ===
      JSON.stringify(canonical.editorial_notes),
  "Editorial notes were not preserved exactly",
);
assert(
  JSON.stringify(manifest.included_ranges?.hr) === JSON.stringify([[1, 108]]),
  "Croatian range must be chapters 1-108",
);
assert(
  Array.isArray(manifest.included_ranges?.fa) && manifest.included_ranges.fa.length === 0,
  "Persian range must be empty for this package",
);

const expectedFiles = Array.from(
  { length: 108 },
  (_, index) => `chapter-${String(index + 1).padStart(3, "0")}.in-review.json`,
);
const actualFiles = readdirSync(join(dataDir, "chapters"))
  .filter((name) => name.endsWith(".in-review.json"))
  .sort();
assert(
  JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
  "Chapter directory must contain exactly the 108 expected in-review files",
);

let sourceVerseTotal = 0;
let croatianVerseTotal = 0;
let sourceSegmentTotal = 0;

for (let chapter = 1; chapter <= 108; chapter += 1) {
  const fileName = `chapter-${String(chapter).padStart(3, "0")}.in-review.json`;
  const chapterData = loadJson(join(dataDir, "chapters", fileName));
  const sourceChapter = canonicalByChapter.get(chapter);
  const expectedCount = sourceChapter.verses.length;

  assert(chapterData.schema_version === 1, `${fileName}: unexpected schema version`);
  assert(chapterData.book_id === "1_enoch", `${fileName}: invalid book_id`);
  assert(chapterData.chapter === chapter, `${fileName}: invalid chapter number`);
  assert(chapterData.status === "in_review", `${fileName}: status must be in_review`);
  assert(chapterData.status_hr === "in_review", `${fileName}: status_hr must be in_review`);
  assert(chapterData.source_translation === canonical.source_translation, `${fileName}: source mismatch`);
  assert(chapterData.versification === canonical.versification, `${fileName}: versification mismatch`);
  assert(
    JSON.stringify(chapterData.locales_in_scope) === JSON.stringify(["hr"]),
    `${fileName}: locales_in_scope must be [\"hr\"]`,
  );
  assert(Array.isArray(chapterData.verses), `${fileName}: verses must be an array`);
  assert(
    chapterData.verses.length === expectedCount,
    `${fileName}: expected ${expectedCount} verses, found ${chapterData.verses.length}`,
  );

  for (let index = 0; index < expectedCount; index += 1) {
    const row = chapterData.verses[index];
    const sourceVerse = sourceChapter.verses[index];
    const label = `1 Enoch ${chapter}:${sourceVerse.verse}`;

    assert(row.verse === sourceVerse.verse, `${label}: non-contiguous verse number`);
    assert(
      row.text_en === sourceVerse.text_en,
      `${label}: English differs byte-for-byte from canonical`,
    );
    assertCleanText(row.text_en, `${label} English`);
    assertCleanText(row.text_hr, `${label} Croatian`);
    assert(row.text_hr !== row.text_en, `${label}: Croatian duplicates English`);
    assert(row.status_hr === "in_review", `${label}: Croatian status must be in_review`);
    assert(row.text_fa === null, `${label}: Persian must be null outside scope`);
    assert(row.status_fa === "out_of_scope", `${label}: Persian status must be out_of_scope`);

    sourceVerseTotal += 1;
    croatianVerseTotal += 1;
  }

  const checksum = englishChecksum(chapterData.verses);
  assert(chapterData.source_english_sha256 === checksum, `${fileName}: English checksum mismatch`);
  assert(
    manifest.chapter_qa?.[String(chapter)]?.verse_count === expectedCount,
    `${fileName}: manifest verse count mismatch`,
  );
  assert(
    manifest.chapter_qa?.[String(chapter)]?.croatian_in_review_count === expectedCount,
    `${fileName}: manifest Croatian count mismatch`,
  );
  assert(
    manifest.chapter_qa?.[String(chapter)]?.persian_in_review_count === 0,
    `${fileName}: manifest Persian count must be zero`,
  );
  assert(
    manifest.chapter_qa?.[String(chapter)]?.source_english_sha256 === checksum,
    `${fileName}: manifest English checksum mismatch`,
  );
  assert(
    manifest.chapter_qa?.[String(chapter)]?.source_segment_count === sourceChapter.source_segment_count,
    `${fileName}: manifest source-segment count mismatch`,
  );
  sourceSegmentTotal += sourceChapter.source_segment_count;
}

assert(sourceVerseTotal === 1062, `Expected 1062 source verses, found ${sourceVerseTotal}`);
assert(croatianVerseTotal === 1062, `Expected 1062 Croatian verses, found ${croatianVerseTotal}`);
assert(
  sourceSegmentTotal === canonical.source_segment_count,
  `Expected ${canonical.source_segment_count} source segments, found ${sourceSegmentTotal}`,
);
assert(manifest.totals?.chapters === 108, "Manifest chapter total mismatch");
assert(manifest.totals?.aligned_source_verses === sourceVerseTotal, "Manifest source total mismatch");
assert(manifest.totals?.croatian_in_review_verses === croatianVerseTotal, "Manifest Croatian total mismatch");
assert(manifest.totals?.persian_in_review_verses === 0, "Manifest Persian total must be zero");
assert(manifest.totals?.source_segments === sourceSegmentTotal, "Manifest source-segment total mismatch");

console.log(
  `Validated 1 Enoch Croatian review package: 108 chapters, ${sourceVerseTotal} exact ` +
    `English/Croatian aligned verses, ${sourceSegmentTotal} preserved source segments.`,
);
