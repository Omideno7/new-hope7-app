import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const baseDir = dirname(fileURLToPath(import.meta.url));
const expectedCounts = [40, 48, 36, 52, 56, 59, 70, 63, 47, 59, 46, 51, 58, 48, 63, 78];
const expectedTotal = expectedCounts.reduce((sum, count) => sum + count, 0);
const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const englishChecksum = (verses) =>
  sha256(verses.map(({ verse, text_en: textEn }) => `${verse}\t${textEn}`).join("\n"));

const manifest = await readJson(join(baseDir, "manifest.in-review.json"));
if (
  manifest.schema_version !== 1 ||
  manifest.book_id !== "2_esdras" ||
  manifest.title_fa !== "دوم اِسدراس" ||
  manifest.title_en !== "Second Esdras" ||
  manifest.title_hr !== "Druga Ezdrina" ||
  manifest.status !== "in_review" ||
  manifest.source_translation !== "KJVA" ||
  manifest.versification !== "KJVA" ||
  JSON.stringify(manifest.locales_in_scope) !== JSON.stringify(["hr"])
) {
  throw new Error("2 Esdras manifest metadata is invalid");
}

let total = 0;
const seenEnglish = new Set();
for (let chapter = 1; chapter <= expectedCounts.length; chapter += 1) {
  const fileName = `chapter-${String(chapter).padStart(2, "0")}.in-review.json`;
  const data = await readJson(join(baseDir, "chapters", fileName));
  const expectedCount = expectedCounts[chapter - 1];
  if (
    data.schema_version !== 1 ||
    data.book_id !== "2_esdras" ||
    data.title_fa !== "دوم اِسدراس" ||
    data.title_en !== "Second Esdras" ||
    data.title_hr !== "Druga Ezdrina" ||
    data.chapter !== chapter ||
    data.status !== "in_review" ||
    data.source_translation !== "KJVA" ||
    data.versification !== "KJVA" ||
    JSON.stringify(data.locales_in_scope) !== JSON.stringify(["hr"])
  ) {
    throw new Error(`Invalid chapter metadata in ${fileName}`);
  }
  if (!Array.isArray(data.verses) || data.verses.length !== expectedCount) {
    throw new Error(`Verse-count mismatch in ${fileName}`);
  }
  for (let index = 0; index < data.verses.length; index += 1) {
    const verse = data.verses[index];
    const reference = `${chapter}:${index + 1}`;
    if (verse.verse !== index + 1) {
      throw new Error(`Non-contiguous verse at 2 Esdras ${reference}`);
    }
    if (!verse.text_en?.trim() || !verse.text_hr?.trim()) {
      throw new Error(`Blank source or Croatian text at 2 Esdras ${reference}`);
    }
    if (
      verse.text_fa !== null ||
      verse.status_fa !== "out_of_scope" ||
      verse.status_hr !== "in_review"
    ) {
      throw new Error(`Invalid locale state at 2 Esdras ${reference}`);
    }
    if (/\[\[(?:C\d+V\d+|V\d+)\]\]|TRANSLATE|TODO|TBD|\/n\/n|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/iu.test(verse.text_hr)) {
      throw new Error(`Placeholder or control artifact at 2 Esdras ${reference}`);
    }
    if (/[А-Яа-яЁё]/u.test(verse.text_hr)) {
      throw new Error(`Cyrillic artifact at 2 Esdras ${reference}`);
    }
    const englishKey = `${reference}\t${verse.text_en}`;
    if (seenEnglish.has(englishKey)) throw new Error(`Duplicate reference at ${reference}`);
    seenEnglish.add(englishKey);
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
    throw new Error(`Manifest QA mismatch for 2 Esdras chapter ${chapter}`);
  }
  total += data.verses.length;
}

if (total !== expectedTotal || expectedTotal !== 874) {
  throw new Error(`Unexpected 2 Esdras total: ${total}`);
}
if (
  manifest.totals?.chapters !== 16 ||
  manifest.totals?.aligned_source_verses !== total ||
  manifest.totals?.persian_out_of_scope_verses !== total ||
  manifest.totals?.croatian_in_review_verses !== total
) {
  throw new Error("2 Esdras manifest totals are invalid");
}

console.log(`2 Esdras review validation passed: 16 chapters, ${total} contiguous Croatian verses.`);
