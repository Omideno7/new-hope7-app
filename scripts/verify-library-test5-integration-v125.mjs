/** Build an isolated QA copy from the exact user-supplied Test5 commit and reviewed patch; no deploy/merge. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '..',
  ),
  base = '82efc731c64f76c051528ae01189521bee0ee8b9';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'nh7-test5-library-')),
  target = path.join(temp, 'qa'),
  archive = path.join(temp, 'reference.tar');
fs.mkdirSync(target);
// Fetch this exact reference separately if absent. Never automatically fetch/deploy a Supabase project.
fs.writeFileSync(
  archive,
  execFileSync('git', ['archive', base], {
    cwd: root,
    maxBuffer: 128 * 1024 * 1024,
  }),
);
execFileSync('tar', ['-xf', archive, '-C', target]);
const patch = path.join(
  root,
  'docs/security/ISSUE_125_TEST5_INTEGRATION.patch',
);
execFileSync('git', ['apply', '--check', patch], { cwd: target });
execFileSync('git', ['apply', patch], { cwd: target });
const before = (file) =>
    execFileSync('git', ['show', base + ':' + file], {
      cwd: root,
      maxBuffer: 8 * 1024 * 1024,
    }).toString(),
  after = (file) => fs.readFileSync(path.join(target, file), 'utf8');
const allowed = new Set([
  'index.html',
  'js/app.js',
  'js/nh7-access-bootstrap-v230.js',
  'js/nh7-book-reader-v283.js',
  'js/nh7-library-collections-v322.js',
  'js/nh7-library-language-v321.js',
  'js/nh7-library-security-v125.js',
  'js/nh7-offline-persistence-v323.js',
  'sw-offline-v329.js',
  'sw-release-core-v403.js',
  'service-worker.js',
]);
const files = execFileSync('git', ['ls-tree', '-r', '--name-only', base], {
  cwd: root,
})
  .toString()
  .trim()
  .split('\n');
for (const file of files)
  if (!allowed.has(file))
    assert(
      fs
        .readFileSync(path.join(target, file))
        .equals(
          execFileSync('git', ['show', base + ':' + file], {
            cwd: root,
            maxBuffer: 128 * 1024 * 1024,
          }),
        ),
      file + ' changed',
    );
const cut = (s) => {
  const a = s.indexOf('let nh7LibraryTab='),
    b = s.indexOf('async function more()', a);
  return s.slice(0, a) + s.slice(b);
};
const originalApp = cut(before('js/app.js')),
  preservedApp = cut(after('js/app.js'))
    .replaceAll(
      '[data-offline-download]:not([data-library-offline])',
      '[data-offline-download]',
    )
    .replace(
      "  $$('[data-library-offline]').forEach(el=>el.onclick=()=>nh7DownloadPublicLibraryV125(el));\n  nh7RefreshLibraryOfflineControlsV125();\n",
      '',
    )
    .replace(
      '  // querySelectorAll ($$) keeps routes with zero verse-note controls safe in Safari.\n',
      '',
    )
    .replace(
      "  $$('[data-save-verse-note]').forEach",
      "  $('[data-save-verse-note]').forEach",
    );
assert.equal(
  preservedApp,
  originalApp,
  'Test5 non-Library app behavior changed beyond exact typo and Library-control exclusions',
);
const scripts = (s) =>
  Array.from(s.matchAll(/<script[^>]+src="([^"?]+)/g), (x) => x[1]);
assert.deepEqual(
  scripts(after('index.html')).filter(
    (x) => x !== 'js/nh7-library-security-v125.js',
  ),
  scripts(before('index.html')),
  'Existing Test5 module order/imports changed',
);
// Keep all Test5 release-cache assets and routed module paths, including Calendar/Community/themes/player.
for(const pattern of [/const NH7_RELEASE_ASSETS=\[([\s\S]*?)\];/, /const NH7_READER_RELEASE_PATHS_V452=new Set\(\[([\s\S]*?)\]\);/]){
  const original=before('sw-release-core-v403.js').match(pattern),updated=after('sw-release-core-v403.js').match(pattern);
  assert(original&&updated,'Missing Test5 release asset declaration');
  const paths=text=>Array.from(text.matchAll(/["']([^"']+)["']/g),x=>x[1]),existing=new Set(paths(updated[1]));
  for(const asset of paths(original[1]))assert(existing.has(asset),'Test5 release asset removed: '+asset);
}
for (const file of allowed)
  if (file.endsWith('.js'))
    execFileSync(process.execPath, ['--check', path.join(target, file)]);
for (const file of [
  'js/nh7-library-security-v125.js',
  'js/nh7-access-bootstrap-v230.js',
  'js/nh7-library-collections-v322.js',
  'js/nh7-library-language-v321.js',
  'js/nh7-offline-persistence-v323.js',
  'sw-offline-v329.js',
])
  assert.equal(
    after(file),
    fs.readFileSync(path.join(root, file), 'utf8'),
    'Test5 patch drifted from current reviewed Library source: ' + file,
  );
const evidence = {
  reference: base,
  qa_copy: target,
  total_reference_files: files.length,
  unchanged_non_library_files: files.filter((x) => !allowed.has(x)).length,
  existing_module_import_order_preserved: true,
  non_library_app_source_preserved_sha256: crypto
    .createHash('sha256')
    .update(originalApp)
    .digest('hex'),
  exact_test5_verse_note_typo_fixed: true,
};
fs.writeFileSync(
  path.join(temp, 'preservation.json'),
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(
  'PASS Test5: existing modules/files/import order and non-Library app bytes preserved; exact note typo + scoped Library hardening applied.',
);
console.log(JSON.stringify(evidence));
