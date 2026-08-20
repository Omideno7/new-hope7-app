import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const languages = ['fa', 'en', 'hr'];
const metaFields = ['title', 'subtitle', 'description', 'goal'];
const dayFields = ['title', 'devotional', 'reflection', 'action', 'prayer', 'declaration'];
const expected = new Map([
  ['prayer-30', 30], ['grace-14', 14], ['fasting-7', 7], ['obedience-10', 10], ['salvation-10', 10]
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
async function json(path) {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'));
}

const catalog = await json('data/spiritual-plans/catalog.json');
const biblePlanData = await json('data/bible/plans/reading_plans_1yr_2yr.json');
const bibleBookNames = new Set((biblePlanData.books || []).flatMap(book => [book.names?.en, book.id]).filter(Boolean));
for (const alias of ['Psalm', 'Ps', 'Song of Solomon', 'First Samuel', 'Second Samuel', 'First Kings', 'Second Kings', 'First Corinthians', 'Second Corinthians', 'First Thessalonians', 'Second Thessalonians', 'First Timothy', 'Second Timothy', 'First Peter', 'Second Peter', 'First John', 'Second John', 'Third John']) bibleBookNames.add(alias);
function validateReference(reference, location) {
  const match = String(reference).match(/^(.+?)\s+(\d+):(\d+)/);
  invariant(match && bibleBookNames.has(match[1]), `${location}: Scripture reference does not map to Bible metadata (${reference}).`);
}
invariant(Array.isArray(catalog.plans), 'Catalog must contain a plans array.');
invariant(catalog.plans.length === expected.size, `Expected ${expected.size} catalog entries.`);
invariant(new Set(catalog.plans.map(item => item.id)).size === catalog.plans.length, 'Catalog IDs must be unique.');

let totalDays = 0;
for (const entry of catalog.plans) {
  const plan = await json(entry.file);
  invariant(plan.id === entry.id, `${entry.file}: ID does not match catalog.`);
  invariant(expected.get(plan.id) === plan.durationDays, `${plan.id}: unexpected duration.`);
  invariant(plan.days.length === plan.durationDays, `${plan.id}: day count does not match duration.`);
  invariant(plan.days.every((day, index) => day.day === index + 1), `${plan.id}: days must be sequential.`);
  for (const language of languages) {
    for (const field of metaFields) invariant(String(plan.localized?.[language]?.[field] || '').trim().length >= 8, `${plan.id}.${language}.${field} is incomplete.`);
    const uniqueContent = new Map(dayFields.map(field => [field, new Set()]));
    for (const day of plan.days) {
      invariant(Array.isArray(day.scriptures) && day.scriptures.length >= 1, `${plan.id} day ${day.day}: Scripture reference required.`);
      for (const reference of day.scriptures) validateReference(reference, `${plan.id} day ${day.day}`);
      for (const field of dayFields) {
        const value = String(day.content?.[language]?.[field] || '').trim();
        const minimum = field === 'devotional' ? 120 : field === 'title' ? 4 : 12;
        invariant(value.length >= minimum, `${plan.id} day ${day.day}.${language}.${field} is too short.`);
      }
      for (const field of dayFields) uniqueContent.get(field).add(day.content[language][field].trim());
    }
    for (const [field, values] of uniqueContent) invariant(values.size === plan.durationDays, `${plan.id}.${language}: ${field} content must be unique.`);
  }
  if (plan.requiresJourney) {
    for (const language of languages) invariant(String(plan.localized?.[language]?.safety || '').length >= 180, `${plan.id}.${language}: safety note is incomplete.`);
  }
  if (plan.id === 'prayer-30') {
    invariant(Array.isArray(plan.foundationalScriptures) && plan.foundationalScriptures.length >= 6, 'Prayer-in-tongues plan needs biblical foundations.');
    for (const reference of plan.foundationalScriptures) validateReference(reference, 'prayer-30 foundation');
    for (const language of languages) {
      const practices = plan.spiritPractices?.[language] || [];
      invariant(practices.length === 30, `prayer-30.${language}: expected 30 Spirit-prayer practices.`);
      invariant(new Set(practices).size === 30, `prayer-30.${language}: Spirit-prayer practices must be unique.`);
      invariant(String(plan.localized?.[language]?.pastoralNote || '').length >= 180, `prayer-30.${language}: pastoral guidance is incomplete.`);
    }
  }
  totalDays += plan.days.length;
}

invariant(totalDays === 71, `Expected 71 complete devotional days, found ${totalDays}.`);
for (const path of [
  'js/nh7-spiritual-plans-v240.js', 'css/nh7-spiritual-plans-v240.css',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-maskable-512.png', 'assets/apple-touch-icon.png',
  'supabase/migrations/20260820214030_spiritual_plans_v240.sql',
  'supabase/migrations/20260820215500_spiritual_plans_v240_fk_index.sql'
]) await access(resolve(root, path));

for (const [path, width, height] of [
  ['assets/icon-192.png', 192, 192], ['assets/icon-512.png', 512, 512],
  ['assets/icon-maskable-512.png', 512, 512], ['assets/apple-touch-icon.png', 180, 180]
]) {
  const image = await readFile(resolve(root, path));
  invariant(image.subarray(1, 4).toString() === 'PNG', `${path} is not a PNG.`);
  invariant(image.readUInt32BE(16) === width && image.readUInt32BE(20) === height, `${path} has the wrong dimensions.`);
}

const manifest = await json('manifest.json');
invariant(manifest.icons?.some(icon => icon.src === 'assets/icon-192.png' && icon.sizes === '192x192' && icon.purpose === 'any'), 'Manifest 192 icon is incomplete.');
invariant(manifest.icons?.some(icon => icon.src === 'assets/icon-512.png' && icon.sizes === '512x512' && icon.purpose === 'any'), 'Manifest 512 icon is incomplete.');
invariant(manifest.icons?.some(icon => icon.src === 'assets/icon-maskable-512.png' && icon.purpose === 'maskable'), 'Manifest maskable icon is incomplete.');

const migration = await readFile(resolve(root, 'supabase/migrations/20260820214030_spiritual_plans_v240.sql'), 'utf8');
for (const table of ['spiritual_plan_progress', 'fasting_journeys', 'fasting_daily_logs']) {
  invariant(migration.includes(`create table if not exists public.${table}`), `${table} migration is missing.`);
  invariant(migration.includes(`alter table public.${table} enable row level security`), `${table} RLS is missing.`);
  invariant(migration.includes(`revoke all on table public.${table} from anon, authenticated`), `${table} role reset is missing.`);
  invariant(migration.includes(`grant select, insert, update, delete on table public.${table} to authenticated`), `${table} authenticated grant is missing.`);
}
invariant((migration.match(/create policy /g) || []).length === 12, 'Expected 12 own-row RLS policies.');
invariant(migration.includes('on public.fasting_daily_logs (journey_id, user_id)'), 'Composite fasting-log foreign key index is missing.');
invariant(!/alter table public\.school_/i.test(migration), 'Spiritual plan migration must not alter School tables.');

const offlineWorker = await readFile(resolve(root, 'sw-offline-v329.js'), 'utf8');
for (const entry of catalog.plans) invariant(offlineWorker.includes(`./${entry.file}`), `${entry.file} is missing from the offline cache.`);
invariant(offlineWorker.includes('./js/nh7-spiritual-plans-v240.js'), 'Plans module is missing from the offline cache.');
invariant(offlineWorker.includes('./css/nh7-spiritual-plans-v240.css'), 'Plans stylesheet is missing from the offline cache.');

console.log(`Spiritual plans validation passed: ${catalog.plans.length} plans, ${totalDays} days, ${languages.length} languages.`);
