import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "data", "apocrypha");
const catalog = JSON.parse(fs.readFileSync(path.join(dataDir, "catalog.in-review.json"), "utf8"));
const expectedIds = [
  "1_esdras",
  "2_esdras",
  "tobit",
  "judith",
  "additions_to_esther",
  "wisdom_of_solomon",
  "sirach",
  "baruch",
  "letter_of_jeremiah",
  "prayer_of_azariah",
  "susanna",
  "bel_and_the_dragon",
  "prayer_of_manasseh",
  "1_maccabees",
  "2_maccabees",
  "1_enoch",
  "3_maccabees",
  "4_maccabees",
  "psalm_151",
];

const fail = (message) => {
  throw new Error(message);
};
const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const englishChecksum = (verses) =>
  sha256(verses.map(({ verse, text_en }) => `${verse}\t${text_en}`).join("\n"));

const catalogIds = catalog.books.map(({ book_id }) => book_id);
if (JSON.stringify(catalogIds) !== JSON.stringify(expectedIds)) {
  fail("Catalog does not contain the exact ordered 19-book set");
}
if (
  catalog.locale_coverage.en.covered_books !== 19 ||
  catalog.locale_coverage.fa.covered_books !== 19 ||
  catalog.locale_coverage.hr.covered_books !== 19
) {
  fail("Catalog locale coverage is not 19/19/19");
}
if (
  catalog.locale_coverage.en.reference_ready !== 19 ||
  catalog.locale_coverage.fa.draft_existing !== 14 ||
  catalog.locale_coverage.fa.in_review !== 5 ||
  catalog.locale_coverage.hr.prepared_existing !== 13 ||
  catalog.locale_coverage.hr.in_review !== 6
) {
  fail("Catalog locale coverage split does not match the 19-book completion plan");
}

const sources = new Map();
let allPersianReviewRows = 0;
let allCroatianReviewRows = 0;
for (const book of catalog.books) {
  const sourcePath = path.join(dataDir, book.english.source_file.replace(/^sources\/en\//, "sources/en/"));
  if (!fs.existsSync(sourcePath)) fail(`${book.book_id}: English source file missing`);
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  if (source.book_id !== book.book_id) fail(`${book.book_id}: English source identity mismatch`);
  if (!Array.isArray(source.chapters) || source.chapters.length !== source.chapter_count) {
    fail(`${book.book_id}: English chapter count mismatch`);
  }
  let verseCount = 0;
  source.chapters.forEach((chapter, chapterIndex) => {
    if (chapter.chapter !== chapterIndex + 1 || !chapter.verses.length) {
      fail(`${book.book_id}: invalid English chapter ${chapterIndex + 1}`);
    }
    chapter.verses.forEach((verse, index) => {
      const prior = index ? chapter.verses[index - 1].verse : null;
      if (
        !Number.isInteger(verse.verse) ||
        (prior !== null && verse.verse !== prior + 1) ||
        typeof verse.text_en !== "string" ||
        !verse.text_en.trim() ||
        verse.text_en.includes("[object Object]")
      ) {
        fail(`${book.book_id} ${chapter.chapter}:${verse.verse}: invalid English verse`);
      }
    });
    verseCount += chapter.verses.length;
  });
  if (verseCount !== source.verse_count) fail(`${book.book_id}: English verse/segment total mismatch`);
  sources.set(book.book_id, source);
}

for (const book of catalog.books) {
  const needsReview = book.persian.review_path || book.croatian.review_path;
  if (!needsReview) continue;
  const reviewPath = book.persian.review_path || book.croatian.review_path;
  if (
    book.persian.review_path &&
    book.croatian.review_path &&
    book.croatian.review_path !== book.persian.review_path
  ) {
    fail(`${book.book_id}: locale review paths disagree`);
  }
  const manifestPath = path.join(dataDir, reviewPath, "manifest.in-review.json");
  const chaptersDir = path.join(dataDir, reviewPath, "chapters");
  if (!fs.existsSync(manifestPath) || !fs.existsSync(chaptersDir)) {
    fail(`${book.book_id}: review package missing`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.book_id !== book.book_id || manifest.status !== "in_review") {
    fail(`${book.book_id}: invalid review manifest`);
  }
  const source = sources.get(book.book_id);
  let aligned = 0;
  let fa = 0;
  let hr = 0;
  for (const filename of fs.readdirSync(chaptersDir).filter((name) => name.endsWith(".in-review.json")).sort()) {
    const chapter = JSON.parse(fs.readFileSync(path.join(chaptersDir, filename), "utf8"));
    const sourceChapter = source.chapters.find(({ chapter: number }) => number === chapter.chapter);
    if (!sourceChapter || sourceChapter.verses.length !== chapter.verses.length) {
      fail(`${book.book_id} ${chapter.chapter}: source/review row count mismatch`);
    }
    if (englishChecksum(chapter.verses) !== chapter.source_english_sha256) {
      fail(`${book.book_id} ${chapter.chapter}: checksum mismatch`);
    }
    if (
      manifest.chapter_qa?.[String(chapter.chapter)]?.source_english_sha256 !==
      chapter.source_english_sha256
    ) {
      fail(`${book.book_id} ${chapter.chapter}: manifest checksum mismatch`);
    }
    chapter.verses.forEach((verse, index) => {
      const expected = sourceChapter.verses[index];
      if (verse.verse !== expected.verse || verse.text_en !== expected.text_en) {
        fail(`${book.book_id} ${chapter.chapter}:${verse.verse}: English alignment mismatch`);
      }
      for (const locale of ["fa", "hr"]) {
        const text = verse[`text_${locale}`];
        const status = verse[`status_${locale}`];
        if (text === null && status !== "out_of_scope") {
          fail(`${book.book_id} ${chapter.chapter}:${verse.verse}: ${locale} null/status mismatch`);
        }
        if (
          text !== null &&
          (typeof text !== "string" ||
            !text.trim() ||
            status !== "in_review" ||
            /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(text) ||
            text.includes("[object Object]") ||
            text.includes("ـ"))
        ) {
          fail(`${book.book_id} ${chapter.chapter}:${verse.verse}: invalid ${locale} translation`);
        }
        if (
          text !== null &&
          ((locale === "fa" && !/[\u0600-\u06FF]/u.test(text)) ||
            (locale === "hr" && (!/[A-Za-zČĆŽŠĐčćžšđ]/u.test(text) || text === verse.text_en)))
        ) {
          fail(`${book.book_id} ${chapter.chapter}:${verse.verse}: ${locale} language sanity check failed`);
        }
      }
      if (verse.status_fa === "in_review") fa += 1;
      if (verse.status_hr === "in_review") hr += 1;
    });
    aligned += chapter.verses.length;
  }
  if (
    aligned !== manifest.totals.aligned_source_verses ||
    fa !== (manifest.totals.persian_in_review_verses ?? 0) ||
    hr !== (manifest.totals.croatian_in_review_verses ?? 0)
  ) {
    fail(`${book.book_id}: manifest totals mismatch`);
  }
  allPersianReviewRows += fa;
  allCroatianReviewRows += hr;
}

if (
  allPersianReviewRows !== catalog.locale_coverage.fa.in_review_rows ||
  allCroatianReviewRows !== catalog.locale_coverage.hr.in_review_rows
) {
  fail("Catalog review-row totals mismatch");
}

console.log(
  `PASS: exact 19-book set; EN ${catalog.locale_coverage.en.covered_books}, FA ${catalog.locale_coverage.fa.covered_books}, HR ${catalog.locale_coverage.hr.covered_books}; all new translations remain in_review.`,
);
