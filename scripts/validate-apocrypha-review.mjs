import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDir, "..");
const dataDir = join(
  repositoryRoot,
  "data",
  "apocrypha",
  "review",
  "4_maccabees",
);

const expectedVerseCounts = {
  4: 26,
  5: 38,
  6: 35,
  7: 25,
  8: 28,
  9: 32,
  10: 21,
  11: 27,
  12: 20,
  13: 27,
  14: 20,
  15: 32,
  16: 25,
  17: 24,
  18: 24,
};

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function loadJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function isNonBlank(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function assertCleanText(value, label) {
  assert(isNonBlank(value), `${label} must be a non-empty string`);
  assert(
    !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value),
    `${label} contains a control character`,
  );
  assert(!/\\[nr]/u.test(value), `${label} contains a literal escaped line break`);
}

function englishChecksum(verses) {
  const canonical = verses
    .map(({ verse, text_en: textEn }) => `${verse}\t${textEn}`)
    .join("\n");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

const manifest = loadJson(join(dataDir, "manifest.in-review.json"));

assert(manifest.book_id === "4_maccabees", "Unexpected manifest book_id");
assert(manifest.status === "in_review", "Manifest status must be in_review");
assert(manifest.source_translation === "WEBC", "Source translation must be WEBC");
assert(manifest.versification === "WEBC", "Versification must be WEBC");
assert(
  JSON.stringify(manifest.included_ranges?.fa) === JSON.stringify([[5, 18]]),
  "Persian continuation range must be chapters 5–18",
);
assert(
  JSON.stringify(manifest.included_ranges?.hr) === JSON.stringify([[4, 18]]),
  "Croatian continuation range must be chapters 4–18",
);

let sourceVerseTotal = 0;
let persianVerseTotal = 0;
let croatianVerseTotal = 0;

for (let chapter = 4; chapter <= 18; chapter += 1) {
  const fileName = `chapter-${String(chapter).padStart(2, "0")}.in-review.json`;
  const chapterData = loadJson(join(dataDir, "chapters", fileName));
  const expectedCount = expectedVerseCounts[chapter];

  assert(chapterData.book_id === "4_maccabees", `${fileName}: invalid book_id`);
  assert(chapterData.chapter === chapter, `${fileName}: invalid chapter number`);
  assert(chapterData.status === "in_review", `${fileName}: status must be in_review`);
  assert(Array.isArray(chapterData.verses), `${fileName}: verses must be an array`);
  assert(
    chapterData.verses.length === expectedCount,
    `${fileName}: expected ${expectedCount} verses, found ${chapterData.verses.length}`,
  );

  for (let index = 0; index < chapterData.verses.length; index += 1) {
    const row = chapterData.verses[index];
    const expectedVerse = index + 1;
    const label = `4MA ${chapter}:${expectedVerse}`;

    assert(row.verse === expectedVerse, `${label}: non-contiguous verse number`);
    assertCleanText(row.text_en, `${label} English`);
    assertCleanText(row.text_hr, `${label} Croatian`);
    assert(row.status_hr === "in_review", `${label}: Croatian status must be in_review`);

    if (chapter === 4) {
      assert(row.text_fa === null, `${label}: Persian must be null outside this scope`);
      assert(row.status_fa === "out_of_scope", `${label}: invalid Persian scope status`);
    } else {
      assertCleanText(row.text_fa, `${label} Persian`);
      assert(row.status_fa === "in_review", `${label}: Persian status must be in_review`);
      persianVerseTotal += 1;
    }

    sourceVerseTotal += 1;
    croatianVerseTotal += 1;
  }

  assert(
    chapterData.source_english_sha256 === englishChecksum(chapterData.verses),
    `${fileName}: English source checksum mismatch`,
  );
  assert(
    manifest.chapter_qa?.[String(chapter)]?.verse_count === expectedCount,
    `${fileName}: manifest verse count mismatch`,
  );
  assert(
    manifest.chapter_qa?.[String(chapter)]?.source_english_sha256 ===
      chapterData.source_english_sha256,
    `${fileName}: manifest checksum mismatch`,
  );
}

assert(sourceVerseTotal === 404, `Expected 404 aligned source verses, found ${sourceVerseTotal}`);
assert(persianVerseTotal === 378, `Expected 378 Persian verses, found ${persianVerseTotal}`);
assert(croatianVerseTotal === 404, `Expected 404 Croatian verses, found ${croatianVerseTotal}`);
assert(manifest.totals?.aligned_source_verses === sourceVerseTotal, "Manifest source total mismatch");
assert(manifest.totals?.persian_in_review_verses === persianVerseTotal, "Manifest Persian total mismatch");
assert(manifest.totals?.croatian_in_review_verses === croatianVerseTotal, "Manifest Croatian total mismatch");

console.log(
  `Validated Fourth Maccabees review continuation: ${sourceVerseTotal} aligned verses, ` +
    `${persianVerseTotal} Persian in_review, ${croatianVerseTotal} Croatian in_review.`,
);
