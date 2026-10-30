"""Pack reviewed static app assets plus the editor; never copy secrets or repository metadata."""
import argparse
import json
from pathlib import Path
import shutil
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--out', type=Path, default=ROOT / 'server/design/.assets')
args = parser.parse_args()
out = args.out.resolve()
if out == ROOT or out in ROOT.parents:
    raise SystemExit('Output must be a separate asset directory.')
out.mkdir(parents=True, exist_ok=True)
catalog = json.loads((ROOT / 'tools/pwa-assets.json').read_text())
files = set(catalog['files']) | set(json.loads((ROOT / 'app-version.json').read_text())['assets']) | {str(p.relative_to(ROOT)) for p in (ROOT / 'tools/home-designer').glob('*') if p.is_file()}
files |= {'app-version.json'}
for name in sorted(files):
    source = (ROOT / name).resolve()
    if not source.is_relative_to(ROOT) or not source.is_file() or any(p.startswith('.') for p in Path(name).parts):
        raise SystemExit('Invalid asset: ' + name)
    destination = out / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
print('Packed', len(files), 'public files into', out)
