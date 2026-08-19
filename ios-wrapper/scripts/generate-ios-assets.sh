#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SOURCE_LOGO="../assets/logo.png"
ASSET_WORK="assets"
SPLASH_DIR="ios/App/App/Assets.xcassets/Splash.imageset"

if [[ ! -f "$SOURCE_LOGO" ]]; then
  echo "Missing New Hope 7 logo: $SOURCE_LOGO" >&2
  exit 1
fi

if [[ ! -d "ios/App/App/Assets.xcassets" ]]; then
  echo "Generate the Capacitor iOS project before generating iOS assets." >&2
  exit 1
fi

mkdir -p "$ASSET_WORK"
cp "$SOURCE_LOGO" "$ASSET_WORK/icon-only.png"
cp "$SOURCE_LOGO" "$ASSET_WORK/splash.png"

# App icon: preserve the church logo proportions and place it on an opaque white canvas.
sips -Z 860 "$ASSET_WORK/icon-only.png" >/dev/null
sips --padToHeightWidth 1024 1024 --padColor FFFFFF "$ASSET_WORK/icon-only.png" >/dev/null

# Launch image: large white canvas with a centered New Hope 7 logo.
sips -Z 1500 "$ASSET_WORK/splash.png" >/dev/null
sips --padToHeightWidth 2732 2732 --padColor FFFFFF "$ASSET_WORK/splash.png" >/dev/null

# Generate the normal Capacitor asset catalog (notably the complete AppIcon set).
npx capacitor-assets generate --ios

# capacitor-assets can retain the stock Capacitor splash for some generated iOS projects.
# Replace every image referenced by the Splash image set with the branded launch artwork.
if [[ ! -d "$SPLASH_DIR" ]]; then
  echo "Missing generated Splash.imageset: $SPLASH_DIR" >&2
  exit 1
fi

python3 - <<'PY'
import json
from pathlib import Path
import shutil

root = Path('ios/App/App/Assets.xcassets/Splash.imageset')
source = Path('assets/splash.png')
manifest = json.loads((root / 'Contents.json').read_text(encoding='utf-8'))
files = sorted({row.get('filename') for row in manifest.get('images', []) if row.get('filename')})
if not files:
    raise SystemExit('Splash Contents.json has no image filenames')
for name in files:
    shutil.copyfile(source, root / name)
print('Branded splash files:', ', '.join(files))
PY

# Make the build fail if the generated launch artwork is not exactly our branded source.
python3 - <<'PY'
import hashlib
import json
from pathlib import Path

root = Path('ios/App/App/Assets.xcassets/Splash.imageset')
source = Path('assets/splash.png')
manifest = json.loads((root / 'Contents.json').read_text(encoding='utf-8'))
files = sorted({row.get('filename') for row in manifest.get('images', []) if row.get('filename')})
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
expected = sha(source)
for name in files:
    actual = sha(root / name)
    if actual != expected:
        raise SystemExit(f'Splash branding verification failed for {name}')
print('Splash branding verified:', expected)
PY
