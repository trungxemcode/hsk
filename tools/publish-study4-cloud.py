#!/usr/bin/env python3
"""Publish a new Study4 catalog to R2: immutable gzip first, manifest last.

Changes take effect the next time the app checks the manifest; no app release needed.
Requires a Wrangler login with R2 object write permission on the VPS.
"""
import argparse
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BUCKET = 'hsk-exam-bank'
PUBLIC_BASE = 'https://pub-af2cf92bdb964826afb5fa13cb332892.r2.dev'


def build_catalog(input_path, audio_map=None):
    data = gzip.decompress(input_path.read_bytes()) if input_path.suffix == '.gz' else input_path.read_bytes()
    catalog = json.loads(data)
    tests = catalog.get('tests')
    if not isinstance(tests, list) or not tests:
        raise ValueError('Không có đề HSK hợp lệ.')
    ids = set()
    for t in tests:
        if str(t.get('id', '')) in ids or int(t.get('level', 0)) not in range(1, 7) or not isinstance(t.get('parts'), list):
            raise ValueError('Đề trùng ID hoặc thiếu cấp độ/parts.')
        ids.add(str(t['id']))
    replaced = 0
    if audio_map:
        def visit(v):
            nonlocal replaced
            if isinstance(v, dict):
                for k, value in list(v.items()):
                    if k == 'audio' and isinstance(value, str) and value in audio_map:
                        v[k] = audio_map[value]
                        replaced += 1
                    else:
                        visit(value)
            elif isinstance(v, list):
                for item in v:
                    visit(item)
        visit(catalog)
    packed = gzip.compress(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')).encode('utf-8'), compresslevel=7, mtime=0)
    sha = hashlib.sha256(packed).hexdigest()
    manifest = {'schema': 1, 'version': sha, 'sha256': sha, 'tests': len(tests), 'updatedAt': datetime.now(timezone.utc).isoformat(),
                'data': '/v1/data/' + sha + '.json.gz', 'audioMirrored': len(audio_map or {})}
    return packed, manifest, replaced


def put(key, path, content_type, encoding=None, cache='no-store'):
    cmd = ['npx', 'wrangler', 'r2', 'object', 'put', f'{BUCKET}/{key}', '--remote', '--file', str(path), '--content-type', content_type, '--cache-control', cache]
    if encoding:
        cmd += ['--content-encoding', encoding]
    subprocess.run(cmd, check=True, cwd=ROOT, stdout=subprocess.DEVNULL)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--data', type=Path, default=ROOT / 'study4-tests-data.json.gz')
    ap.add_argument('--audio-map', type=Path, help='JSON: original audio URL -> published Cloudflare audio URL')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    mapping = json.loads(args.audio_map.read_text()) if args.audio_map and args.audio_map.exists() else {}
    for src, target in mapping.items():
        if not src.startswith('https://s4-media1.study4.com/') or not target.startswith(PUBLIC_BASE + '/study4/audio/') or not re.search(r'/[a-f0-9]{64}\.(mp3|m4a)$', target):
            raise ValueError('Audio map không hợp lệ: ' + src[:70])
    packed, manifest, replaced = build_catalog(args.data, mapping)
    print('HSK exams:', manifest['tests'], 'compressed bytes:', len(packed), 'SHA256:', manifest['sha256'], 'audio references rewritten:', replaced, flush=True)
    if args.dry_run:
        return
    with tempfile.TemporaryDirectory(prefix='hsk-exam-release-') as tmp:
        datafile = Path(tmp) / 'catalog.gz'
        manifestfile = Path(tmp) / 'manifest.json'
        datafile.write_bytes(packed)
        manifestfile.write_text(json.dumps(manifest, ensure_ascii=False), encoding='utf-8')
        put('study4/data/' + manifest['sha256'] + '.json.gz', datafile, 'application/json; charset=utf-8', 'gzip', 'public, max-age=31536000, immutable')
        # The pointer changes only after the complete data asset exists.
        put('study4/manifest.json', manifestfile, 'application/json; charset=utf-8')
    print('PUBLISHED', PUBLIC_BASE + '/study4/manifest.json', flush=True)


if __name__ == '__main__':
    main()
