import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const storage = new Map();
const localStorageMock = {
  get length() { return storage.size; },
  key(index) { return Array.from(storage.keys())[index] ?? null; },
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(String(key), String(value)); },
  removeItem(key) { storage.delete(String(key)); },
  clear() { storage.clear(); }
};
Object.defineProperty(globalThis, 'localStorage', { value:localStorageMock });
Object.defineProperty(globalThis, 'navigator', { value:{ onLine:false } });
globalThis.window = globalThis;
globalThis.window.alert = () => {};
globalThis.window.confirm = () => true;
globalThis.document = { querySelectorAll:() => [], querySelector:() => null };

const {
  renderSpiritualPlansV240,
  renderSpiritualProfileSummaryV240
} = await import('../js/nh7-spiritual-plans-v240.js');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function occurrences(value, token) { return value.split(token).length - 1; }
async function jfetch(path) { return JSON.parse(await readFile(resolve(root, path), 'utf8')); }

let language = 'en';
const view = { innerHTML:'' };
const ctx = {
  view,
  getLang:() => language,
  navigate:() => {},
  localNum:value => language === 'fa' ? String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[digit]) : String(value),
  localizeRef:value => value,
  jfetch,
  addPoints:() => {},
  isLoggedIn:() => false,
  userId:() => '',
  authEmail:() => ''
};

await renderSpiritualPlansV240(ctx, { tab:'spiritual' });
invariant(occurrences(view.innerHTML, 'class="nh7-plan-card ') === 5, 'Landing page did not render five plan cards.');
invariant(view.innerHTML.includes('30 Days of Prayer in the Spirit and Tongues'), 'Prayer-in-tongues title is missing.');

language = 'fa';
await renderSpiritualPlansV240(ctx, { tab:'spiritual' });
invariant(view.innerHTML.includes('۳۰ روز دعا در روح و به زبان‌ها'), 'Persian prayer-in-tongues title is missing.');
invariant(view.innerHTML.includes('زندگی در فیض'), 'Persian Living in Grace card is missing.');

language = 'hr';
await renderSpiritualPlansV240(ctx, { tab:'spiritual', plan:'grace-14', day:1, start:1 });
invariant(view.innerHTML.includes('class="card nh7-plan-reader'), 'Plan reader did not render.');
invariant(occurrences(view.innerHTML, 'data-nh7-plan-day=') === 14, 'Living in Grace did not render 14 day selectors.');
invariant(occurrences(view.innerHTML, 'class="nh7-devotional-block ') === 5, 'Devotional sections are incomplete.');

language = 'en';
await renderSpiritualPlansV240(ctx, { tab:'spiritual', plan:'prayer-30', day:1, start:1 });
invariant(occurrences(view.innerHTML, 'data-nh7-plan-day=') === 30, 'Prayer plan did not render 30 day selectors.');
invariant(view.innerHTML.includes('spirit-practice'), 'Daily prayer-in-the-Spirit practice did not render.');
invariant(view.innerHTML.includes('Pastoral guidance'), 'Pastoral guidance did not render.');
invariant(view.innerHTML.includes('Biblical foundation'), 'Biblical foundations did not render.');

await renderSpiritualPlansV240(ctx, { tab:'fasting' });
invariant(view.innerHTML.includes('id="nh7FastingJourneyForm"'), 'Fasting journey form did not render.');
invariant(view.innerHTML.includes('Health and safety'), 'Fasting safety guidance did not render.');

const profile = { innerHTML:'' };
await renderSpiritualProfileSummaryV240(ctx, profile);
invariant(profile.innerHTML.includes('Spiritual plans activity'), 'Profile summary did not render.');
invariant(!profile.innerHTML.includes('My private note'), 'Profile summary must not expose private-note text.');

console.log('Render verification passed: plan hub, 30-day tongues plan, grace reader, fasting form, and profile summary.');
