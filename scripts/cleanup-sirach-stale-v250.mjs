import fs from 'node:fs';

const file = 'data/apocrypha/review/sirach/translations/chapters-31-35.fa-hr.in-review.json';
const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
const chapter32 = (doc.chapters || []).find((chapter) => Number(chapter.chapter) === 32);
if (!chapter32) throw new Error('Sirach chapter 32 not found in review batch');
const before = chapter32.verses.length;
chapter32.verses = chapter32.verses.filter((row) => Number(row.verse) <= 24);
const removed = before - chapter32.verses.length;
if (removed > 0) {
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  console.log(`Removed ${removed} stale non-source Sirach chapter 32 rows.`);
} else {
  console.log('No stale Sirach chapter 32 rows remain.');
}
