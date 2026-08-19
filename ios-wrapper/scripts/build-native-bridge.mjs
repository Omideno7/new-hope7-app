import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'www', 'native');
await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [path.join(root, 'src', 'native-bridge.js')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['safari15'],
  minify: false,
  sourcemap: true,
  outfile: path.join(outDir, 'nh7-native-bridge.js')
});
await copyFile(path.join(root, 'src', 'native-ios.css'), path.join(outDir, 'nh7-native-ios.css'));
console.log('Native bridge built:', outDir);
