"""Import licensed Tomoe stroke prototypes using the app's exact rasterizer.

Usage: python tools/import-tomoe-handwriting.py handwriting-zh_CN.xml output.json
No network requests; source and license must accompany redistributed derivatives.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
source, output = map(Path, sys.argv[1:3])
raw = source.read_bytes()
allowed = set(json.loads((root / 'handwriting-data.json').read_text())['characters'])
rows = []
for entry in ET.fromstring(raw).findall('character'):
    label = entry.findtext('utf8')
    if label not in allowed:
        continue
    strokes = [[[float(p.attrib['x']), float(p.attrib['y'])]
                for p in stroke.findall('point')]
               for stroke in entry.findall('./strokes/stroke')]
    if strokes and all(strokes):
        rows.append({'label': label, 'strokes': strokes})
script = """
const fs=require('node:fs'),core=require('./src/modules/handwriting/handwriting-core.js'),learning=require('./src/modules/handwriting/handwriting-learning.js');
const seen=new Set(),samples=[];
for(const row of JSON.parse(fs.readFileSync(0,'utf8'))){
 const bitmap=learning.pack(core.rasterize(row.strokes));
 try{learning.unpack(bitmap);}catch{continue;}
 const key=row.label+'|'+bitmap;if(seen.has(key))continue;seen.add(key);
 samples.push({label:row.label,bitmap});
}
process.stdout.write(JSON.stringify(samples));
"""
samples = json.loads(subprocess.check_output(['node', '-e', script], cwd=root,
                    input=json.dumps(rows).encode()))
release = {
    'schema': 1, 'revision': 'tomoe-zh-cn-20261012-1', 'samples': samples,
    'source': {
        'name': 'Tomoe Chinese handwriting dictionary', 'license': 'LGPL-2.1',
        'url': 'https://github.com/l4u/tomoe/blob/9d054a1f490368e0d45e0aff6430ce3598ab92c5/data/handwriting-zh_CN.xml',
        'sha256': hashlib.sha256(raw).hexdigest(),
        'modification': '2026-10-12: HSK character filter; order-independent 32x32 bitmap rasterization and packing.',
    },
    'note': 'Curated stroke prototypes, not a multi-writer handwriting training set. No user samples or identifiers.'
}
output.write_text(json.dumps(release, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(json.dumps({'characters': len(set(s['label'] for s in samples)),
                  'samples': len(samples), 'bytes': output.stat().st_size}))
