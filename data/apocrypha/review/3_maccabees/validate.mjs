import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const baseDir = dirname(fileURLToPath(import.meta.url));
const canonicalPath = resolve(
  baseDir,
  "../../../../../apocrypha_sources/canonical/3_maccabees.webc.json"
);
const expectedCounts = [29, 33, 30, 21, 51, 41, 23];
const expectedTotal = 228;
const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const englishChecksum = (verses) =>
  sha256(verses.map(({ verse, text_en: textEn }) => `${verse}\t${textEn}`).join("\n"));

const source = await readJson(canonicalPath);
const manifest = await readJson(join(baseDir, "manifest.in-review.json"));

if (
  source.schema_version !== 1 ||
  source.book_id !== "3_maccabees" ||
  source.source_translation !== "WEBC" ||
  source.versification !== "WEBC" ||
  source.chapter_count !== 7 ||
  source.verse_count !== expectedTotal ||
  source.chapters.length !== 7
) {
  throw new Error("Canonical Third Maccabees metadata is invalid");
}

if (
  manifest.schema_version !== 1 ||
  manifest.book_id !== "3_maccabees" ||
  manifest.title_fa !== "سوم مکابیان" ||
  manifest.title_en !== "Third Maccabees" ||
  manifest.title_hr !== "Treća knjiga o Makabejcima" ||
  manifest.status !== "in_review" ||
  manifest.source_translation !== "WEBC" ||
  manifest.versification !== "WEBC" ||
  JSON.stringify(manifest.locales_in_scope) !== JSON.stringify(["hr"])
) {
  throw new Error("Third Maccabees manifest metadata is invalid");
}

let total = 0;
for (let chapter = 1; chapter <= expectedCounts.length; chapter += 1) {
  const fileName = `chapter-${String(chapter).padStart(2, "0")}.in-review.json`;
  const data = await readJson(join(baseDir, "chapters", fileName));
  const sourceChapter = source.chapters[chapter - 1];
  const expectedCount = expectedCounts[chapter - 1];

  if (
    sourceChapter.chapter !== chapter ||
    sourceChapter.verses.length !== expectedCount ||
    data.schema_version !== 1 ||
    data.book_id !== "3_maccabees" ||
    data.title_fa !== "سوم مکابیان" ||
    data.title_en !== "Third Maccabees" ||
    data.title_hr !== "Treća knjiga o Makabejcima" ||
    data.chapter !== chapter ||
    data.status !== "in_review" ||
    data.source_translation !== "WEBC" ||
    data.versification !== "WEBC" ||
    JSON.stringify(data.locales_in_scope) !== JSON.stringify(["hr"]) ||
    !Array.isArray(data.verses) ||
    data.verses.length !== expectedCount
  ) {
    throw new Error(`Invalid chapter metadata or count in ${fileName}`);
  }

  for (let index = 0; index < expectedCount; index += 1) {
    const sourceVerse = sourceChapter.verses[index];
    const verse = data.verses[index];
    const reference = `${chapter}:${index + 1}`;
    if (sourceVerse.verse !== index + 1 || verse.verse !== index + 1) {
      throw new Error(`Non-contiguous verse at Third Maccabees ${reference}`);
    }
    if (verse.text_en !== sourceVerse.text_en) {
      throw new Error(`English alignment mismatch at Third Maccabees ${reference}`);
    }
    if (typeof verse.text_hr !== "string" || !verse.text_hr.trim()) {
      throw new Error(`Blank Croatian at Third Maccabees ${reference}`);
    }
    if (
      verse.text_fa !== null ||
      verse.status_fa !== "out_of_scope" ||
      verse.status_hr !== "in_review"
    ) {
      throw new Error(`Invalid locale state at Third Maccabees ${reference}`);
    }
    if (
      /\[\[(?:C\d+V\d+|V\d+)\]\]|\b(?:TRANSLATE|TODO|TBD|PLACEHOLDER|undefined|null)\b|\/n\/n|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/iu.test(
        verse.text_hr
      ) ||
      /[А-Яа-яЁё\u0600-\u06FF]/u.test(verse.text_hr) ||
      /\b(?:the|this|that|with|from|shall|were|their|them|those)\b/iu.test(verse.text_hr) ||
      !/[A-Za-zČĆŽŠĐčćžšđ]/u.test(verse.text_hr)
    ) {
      throw new Error(`Placeholder or foreign-script artifact at Third Maccabees ${reference}`);
    }
    const lengthRatio = verse.text_hr.length / verse.text_en.length;
    if (lengthRatio < 0.5 || lengthRatio > 1.9) {
      throw new Error(`Suspicious translation-length ratio at Third Maccabees ${reference}`);
    }
  }

  const checksum = englishChecksum(data.verses);
  if (data.source_english_sha256 !== checksum) {
    throw new Error(`English checksum mismatch in ${fileName}`);
  }
  const qa = manifest.chapter_qa?.[String(chapter)];
  if (
    qa?.verse_count !== expectedCount ||
    qa?.persian_out_of_scope_count !== expectedCount ||
    qa?.croatian_in_review_count !== expectedCount ||
    qa?.source_english_sha256 !== checksum
  ) {
    throw new Error(`Manifest QA mismatch for Third Maccabees chapter ${chapter}`);
  }
  total += expectedCount;
}

if (
  total !== expectedTotal ||
  manifest.totals?.chapters !== 7 ||
  manifest.totals?.aligned_source_verses !== expectedTotal ||
  manifest.totals?.persian_out_of_scope_verses !== expectedTotal ||
  manifest.totals?.croatian_in_review_verses !== expectedTotal
) {
  throw new Error("Third Maccabees totals are invalid");
}

console.log(
  `Third Maccabees review validation passed: 7 chapters, ${total} contiguous Croatian verses, byte-exact WEBC English.`
);
