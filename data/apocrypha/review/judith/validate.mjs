import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const baseDir = dirname(fileURLToPath(import.meta.url));
const expectedCounts = [16, 28, 10, 15, 24, 21, 32, 36, 14, 23, 23, 20, 20, 19, 13, 25];
const expectedTotal = expectedCounts.reduce((sum, count) => sum + count, 0);
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const englishChecksum = (verses) =>
  sha256(verses.map(({ verse, text_en: textEn }) => `${verse}\t${textEn}`).join("\n"));

const manifest = await readJson(join(baseDir, "manifest.in-review.json"));
if (
  manifest.schema_version !== 1 ||
  manifest.book_id !== "judith" ||
  manifest.title_fa !== "یهودیت" ||
  manifest.title_en !== "Judith" ||
  manifest.title_hr !== "Judita" ||
  manifest.status !== "in_review" ||
  manifest.source_translation !== "KJVA" ||
  manifest.versification !== "KJVA" ||
  JSON.stringify(manifest.locales_in_scope) !== JSON.stringify(["fa"])
) {
  throw new Error("Judith manifest metadata is invalid");
}

let total = 0;
for (let chapter = 1; chapter <= expectedCounts.length; chapter += 1) {
  const fileName = `chapter-${String(chapter).padStart(2, "0")}.in-review.json`;
  const data = await readJson(join(baseDir, "chapters", fileName));
  const expectedCount = expectedCounts[chapter - 1];
  if (
    data.schema_version !== 1 ||
    data.book_id !== "judith" ||
    data.title_fa !== "یهودیت" ||
    data.title_en !== "Judith" ||
    data.title_hr !== "Judita" ||
    data.chapter !== chapter ||
    data.status !== "in_review" ||
    data.source_translation !== "KJVA" ||
    data.versification !== "KJVA" ||
    JSON.stringify(data.locales_in_scope) !== JSON.stringify(["fa"])
  ) {
    throw new Error(`Invalid chapter metadata in ${fileName}`);
  }
  if (!Array.isArray(data.verses) || data.verses.length !== expectedCount) {
    throw new Error(`Verse-count mismatch in ${fileName}`);
  }
  for (let index = 0; index < data.verses.length; index += 1) {
    const verse = data.verses[index];
    if (verse.verse !== index + 1) {
      throw new Error(`Non-contiguous verse at Judith ${chapter}:${verse.verse}`);
    }
    if (!verse.text_en?.trim() || !verse.text_fa?.trim()) {
      throw new Error(`Blank source or Persian text at Judith ${chapter}:${verse.verse}`);
    }
    if (
      verse.text_hr !== null ||
      verse.status_fa !== "in_review" ||
      verse.status_hr !== "out_of_scope"
    ) {
      throw new Error(`Invalid locale state at Judith ${chapter}:${verse.verse}`);
    }
    if (/ـ|\\n\\n|\/n\/n|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(verse.text_fa)) {
      throw new Error(`Extraction artifact found at Judith ${chapter}:${verse.verse}`);
    }
  }
  const checksum = englishChecksum(data.verses);
  if (data.source_english_sha256 !== checksum) {
    throw new Error(`English checksum mismatch in ${fileName}`);
  }
  const qa = manifest.chapter_qa?.[String(chapter)];
  if (
    qa?.verse_count !== expectedCount ||
    qa?.persian_in_review_count !== expectedCount ||
    qa?.croatian_out_of_scope_count !== expectedCount ||
    qa?.source_english_sha256 !== checksum
  ) {
    throw new Error(`Manifest QA mismatch for Judith chapter ${chapter}`);
  }
  total += data.verses.length;
}

if (total !== expectedTotal || expectedTotal !== 339) {
  throw new Error(`Unexpected Judith total: ${total}`);
}
if (
  manifest.totals?.chapters !== 16 ||
  manifest.totals?.aligned_source_verses !== total ||
  manifest.totals?.persian_in_review_verses !== total ||
  manifest.totals?.croatian_out_of_scope_verses !== total
) {
  throw new Error("Judith manifest totals are invalid");
}

console.log(`Judith review validation passed: 16 chapters, ${total} contiguous Persian verses.`);
