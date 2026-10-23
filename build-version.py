"""Run after modifying site files; optional --version bumps all worker/client revisions."""
import argparse, hashlib, json, re
from tools.pwa_assets import collect_assets, read_catalog
from pathlib import Path
root=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--version');parser.add_argument('--release');parser.add_argument('--note');args=parser.parse_args()
previous=json.loads((root/'app-version.json').read_text(encoding='utf-8')) if (root/'app-version.json').exists() else {}
if args.release and not re.fullmatch(r'\d+\.\d+\.\d+',args.release):raise SystemExit('Release must look like 3.1.1')
if bool(args.release)!=bool(args.note):raise SystemExit('Provide --release and --note together')
if args.note and (len(args.note)>100 or '\n' in args.note):raise SystemExit('Release note must be one short line')
if args.version and args.version!=previous.get('version') and previous.get('release') and not args.release:raise SystemExit('New releases require --release 3.1.2 --note "Nội dung cập nhật"')
if args.version:
 if not re.fullmatch(r'hsk-offline-[a-zA-Z0-9-]+',args.version):raise SystemExit('Invalid version')
 for name in ('offline.js','offline-worker.js','OneSignalSDKWorker.js'):
  p=root/name;s=p.read_text(encoding='utf-8');s=re.sub(r'hsk-offline-[a-zA-Z0-9-]+',args.version,s)
  if name=='OneSignalSDKWorker.js':s=re.sub(r'(?<=v=)[a-zA-Z0-9-]+',args.version.removeprefix('hsk-offline-'),s)
  p.write_text(s,encoding='utf-8',newline='')
worker=(root/'offline-worker.js').read_text(encoding='utf-8');version=re.search(r"OFFLINE_VERSION='([^']+)'",worker).group(1)
files=collect_assets(root)
aliases=read_catalog(root)['aliases']
worker=re.sub(r'const OFFLINE_FILES=\[.*?\];','const OFFLINE_FILES='+json.dumps(files,ensure_ascii=False)+';',worker,count=1)
alias_line='const OFFLINE_ALIASES='+json.dumps(aliases,ensure_ascii=False,separators=(',',':'))+';'
if re.search(r'^const OFFLINE_ALIASES=.*?;$',worker,re.M):
 worker=re.sub(r'^const OFFLINE_ALIASES=.*?;$',lambda _:alias_line,worker,count=1,flags=re.M)
else:
 worker=worker.replace('let download=',alias_line+'\nlet download=',1)
(root/'offline-worker.js').write_text(worker,encoding='utf-8',newline='')
def asset_metadata(name):
 path=root/name;data=path.read_bytes()
 if path.suffix.lower() not in {'.png','.gz','.webp','.mp3','.woff','.woff2'}:data=data.replace(b'\r\n',b'\n')
 return {'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
assets={n:asset_metadata(n) for n in files}
(root/'app-version.json').write_text(json.dumps({'version':version,'release':args.release or previous.get('release',''),'releaseNote':args.note or previous.get('releaseNote',''),'label':('Bản '+(args.release or previous.get('release',''))+' ('+(args.note or previous.get('releaseNote',''))+')') if (args.release or previous.get('release')) else version.removeprefix('hsk-offline-'),'assets':assets},ensure_ascii=False),encoding='utf-8')
print(f'{version}: {len(assets)} assets')
