"""Build lazy CC-CEDICT shards from the official downloadable .txt.gz."""
import gzip, hashlib, json, re, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]); out=root/'content/open-dictionary';out.mkdir(parents=True,exist_ok=True)
shards=[{} for _ in range(32)]
for line in gzip.decompress(source.read_bytes()).decode('utf-8').splitlines():
 m=re.match(r'^(\S+) (\S+) \[([^]]+)\] /(.+)/$',line)
 if not m:continue
 trad,han,pin,meaning=m.groups(); row=[han,trad,pin,meaning.split('/')]
 for bucket in {ord(han[0])%32,ord(trad[0])%32}:shards[bucket][(han,trad,pin)]=row
files={}
for i,rows in enumerate(shards):
 data=gzip.compress(json.dumps(list(rows.values()),ensure_ascii=False,separators=(',',':')).encode(),mtime=0)
 name=f'{i:02}.json.gz';(out/name).write_bytes(data);files[name]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
report={'source':'CC-CEDICT / MDBG','url':'https://www.mdbg.net/chinese/dictionary?page=cc-cedict','license':'CC BY-SA 4.0','licenseUrl':'https://creativecommons.org/licenses/by-sa/4.0/','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'entries':len({k for rows in shards for k in rows}),'shards':32,'files':files}
(out/'manifest.json').write_text(json.dumps(report,ensure_ascii=False))
print(report['entries'],'entries;',sum(f['bytes'] for f in files.values()),'compressed bytes')
