#!/usr/bin/env python3
"""Mirror bounded batches of verified Study4 audio to R2; never replace failed-source URLs.

Publish the updated catalog after mirroring: python3 tools/publish-study4-cloud.py --audio-map ~/.hsk-study4-audio-map.json
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
from urllib.parse import urlparse
import importlib.util
_spec=importlib.util.spec_from_file_location("publisher",Path(__file__).with_name("publish-study4-cloud.py"))
_publisher=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_publisher)
PUBLIC_BASE, put=_publisher.PUBLIC_BASE, _publisher.put

DEFAULT_MAP = Path.home() / '.hsk-study4-audio-map.json'
ROOT = Path(__file__).resolve().parents[1]


def urls(catalog):
    ordered=[]
    def add(u):
        if isinstance(u,str) and u.startswith('https://s4-media1.study4.com/') and u not in seen:
            seen.add(u);ordered.append(u)
    seen=set()
    for t in catalog['tests']:
        add(t.get('audio'))
        for part in t.get('parts',[]):add(part.get('audio'))
    def walk(v):
        if isinstance(v,dict):
            for k,x in v.items():
                if k=='audio':add(x)
                else:walk(x)
        elif isinstance(v,list):
            for x in v:walk(x)
    walk(catalog)
    return ordered


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--data',type=Path,default=ROOT/'study4-tests-data.json.gz')
    ap.add_argument('--map',type=Path,default=DEFAULT_MAP)
    ap.add_argument('--limit',type=int,default=10,help='Maximum successful uploads this run')
    ap.add_argument('--max-mib',type=int,default=12,help='Maximum size per audio file')
    ap.add_argument('--budget-mib',type=int,default=100,help='Maximum total transferred this run')
    ap.add_argument('--dry-run',action='store_true')
    args=ap.parse_args()
    if args.limit<1 or args.max_mib<1 or args.budget_mib<1:ap.error('limits must be positive')
    payload=json.loads(gzip.decompress(args.data.read_bytes()))
    mapping=json.loads(args.map.read_text()) if args.map.exists() else {}
    pending=[u for u in urls(payload) if u not in mapping]
    print(f'Audio references: {len(urls(payload))}, already mirrored: {len(mapping)}, pending: {len(pending)}',flush=True)
    if args.dry_run:return
    completed,total=0,0
    args.map.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='hsk-audio-mirror-') as tmp:
        target=Path(tmp)/'audio.bin'
        for url in pending:
            if completed>=args.limit or total>=args.budget_mib*1024*1024:break
            ext=Path(urlparse(url).path).suffix.lower().lstrip('.')
            if ext not in ('mp3','m4a'):continue
            key=hashlib.sha256(url.encode('utf-8')).hexdigest()+'.'+ext
            target.unlink(missing_ok=True)
            try:
                subprocess.run(['curl','-fLsS','--retry','1','--connect-timeout','8','--max-time','75','--max-filesize',str(min(args.max_mib*1024*1024,args.budget_mib*1024*1024-total)),'-A','Mozilla/5.0','-o',str(target),url],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
                raw=target.read_bytes()
                if len(raw)<256 or len(raw)>args.max_mib*1024*1024:raise ValueError('Unexpected file size')
                if ext=='mp3' and not (raw[:3]==b'ID3' or raw[0]==255 and raw[1]&224==224):raise ValueError('Not an MP3 stream')
                if ext=='m4a' and b'ftyp' not in raw[:32]:raise ValueError('Not an M4A stream')
                put('study4/audio/'+key,target,'audio/mpeg' if ext=='mp3' else 'audio/mp4',cache='public, max-age=86400')
                mapping[url]=PUBLIC_BASE+'/study4/audio/'+key
                args.map.write_text(json.dumps(mapping,ensure_ascii=False),encoding='utf-8')
                completed+=1;total+=len(raw)
                print(f'OK {completed}/{args.limit} {key[:12]}... {len(raw)} bytes',flush=True)
            except (subprocess.CalledProcessError,ValueError,OSError) as error:
                print(f'SKIP {key[:12]}... {str(error)[:130]}',flush=True)
    print(f'Uploaded this run: {completed}; bytes: {total}; map: {args.map}',flush=True)

if __name__=='__main__':main()
