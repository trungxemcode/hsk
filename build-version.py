"""Run after modifying site files; optional --version bumps all worker/client revisions."""
import argparse, hashlib, json, re
from pathlib import Path
root=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--version');args=parser.parse_args()
if args.version:
 if not re.fullmatch(r'hsk-offline-[a-zA-Z0-9-]+',args.version):raise SystemExit('Invalid version')
 for name in ('offline.js','offline-worker.js','OneSignalSDKWorker.js'):
  p=root/name;s=p.read_text();s=re.sub(r'hsk-offline-[a-zA-Z0-9-]+',args.version,s)
  if name=='OneSignalSDKWorker.js':s=re.sub(r'(?<=v=)[a-zA-Z0-9-]+',args.version.removeprefix('hsk-offline-'),s)
  p.write_text(s)
worker=(root/'offline-worker.js').read_text();version=re.search(r"OFFLINE_VERSION='([^']+)'",worker).group(1)
files=json.loads(re.search(r'const OFFLINE_FILES=(\[.*?\]);',worker).group(1))
def asset_metadata(name):
 data=(root/name).read_bytes().replace(b'\r\n',b'\n')
 return {'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
assets={n:asset_metadata(n) for n in files}
(root/'app-version.json').write_text(json.dumps({'version':version,'label':version.removeprefix('hsk-offline-'),'assets':assets},ensure_ascii=False))
print(f'{version}: {len(assets)} assets')
