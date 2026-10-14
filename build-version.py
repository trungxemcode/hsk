"""Run after modifying site files; optional --version bumps all worker/client revisions."""
import argparse, hashlib, json, re, gzip
from pathlib import Path
root=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--version');args=parser.parse_args()
if args.version:
 if not re.fullmatch(r'hsk-offline-[a-zA-Z0-9-]+',args.version):raise SystemExit('Invalid version')
 for name in ('offline.js','offline-worker.js','OneSignalSDKWorker.js'):
  p=root/name;s=p.read_text(encoding='utf-8');s=re.sub(r'hsk-offline-[a-zA-Z0-9-]+',args.version,s)
  if name=='OneSignalSDKWorker.js':s=re.sub(r'(?<=v=)[a-zA-Z0-9-]+',args.version.removeprefix('hsk-offline-'),s)
  p.write_text(s,encoding='utf-8',newline='')
worker=(root/'offline-worker.js').read_text(encoding='utf-8');version=re.search(r"OFFLINE_VERSION='([^']+)'",worker).group(1)
files=json.loads(re.search(r'const OFFLINE_FILES=(\[.*?\]);',worker).group(1))
for name in ('exam-bank.js','exam-core.js','exam.js','exam.css','lesson-mini.js','lesson-mini-data.json','ai-coach-core.js','ai-coach.js','mobile-dock.js','exam-expansion.js','coach-profile.js','drive-exam.js','drive-exam-data.json.gz'):
 if name not in files:files.append(name)
files=[f for f in files if not f.startswith('content/drive-hsk/') and f not in ('drive-exam-data.json','drive-exam-images.json')]
for name in ('drive-audio.js','drive-audio-data.json'):
 if name not in files:files.append(name)
for question in json.loads((root/'drive-audio-data.json').read_text())['items']:
 if question['audioFile'] not in files:files.append(question['audioFile'])
for code in sorted({p.split('/')[-1].split('-')[0] for p in json.loads(gzip.decompress((root/'drive-exam-data.json.gz').read_bytes()))['report']['images']}):
 path='content/drive-hsk/'+code+'.json'
 if path not in files:files.append(path)
worker=re.sub(r'const OFFLINE_FILES=\[.*?\];','const OFFLINE_FILES='+json.dumps(files,ensure_ascii=False)+';',worker,count=1)
(root/'offline-worker.js').write_text(worker,encoding='utf-8',newline='')
def asset_metadata(name):
 path=root/name;data=path.read_bytes()
 if path.suffix.lower() not in {'.png','.gz','.webp','.mp3'}:data=data.replace(b'\r\n',b'\n')
 return {'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
assets={n:asset_metadata(n) for n in files}
(root/'app-version.json').write_text(json.dumps({'version':version,'label':version.removeprefix('hsk-offline-'),'assets':assets},ensure_ascii=False),encoding='utf-8')
print(f'{version}: {len(assets)} assets')
