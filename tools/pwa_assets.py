"""Build-time PWA asset catalog. The browser keeps using a generated inline list."""
import gzip
import json
from pathlib import Path
import re


def safe_path(name):
    if (not isinstance(name, str) or not name or '\\' in name or
            name.startswith('/') or '?' in name or '#' in name or ':' in name or
            any(part in ('', '.', '..') for part in name.split('/'))):
        raise ValueError('Unsafe PWA asset path: ' + str(name))
    return name


def read_catalog(root):
    data = json.loads((root / 'tools/pwa-assets.json').read_text(encoding='utf-8'))
    if not isinstance(data, dict) or set(data) != {'schema', 'files', 'aliases'} or data['schema'] != 1:
        raise ValueError('Invalid PWA catalog schema')
    files, aliases = data['files'], data['aliases']
    if not isinstance(files, list) or not files:
        raise ValueError('PWA catalog must contain assets')
    for name in files:
        safe_path(name)
    if len(files) != len(set(files)):
        raise ValueError('Duplicate PWA catalog asset')
    if not isinstance(aliases, dict):
        raise ValueError('Invalid PWA aliases')
    for old, new in aliases.items():
        safe_path(old); safe_path(new)
        if old in files or new not in files or old == new or new in aliases:
            raise ValueError('PWA alias must map a retired URL directly to a listed asset')
    return data


def collect_assets(root):
    root = Path(root)
    files = list(read_catalog(root)['files'])
    # Keep the existing derived Drive audio/exam policy; do not cache its entire corpus.
    audio = json.loads((root / 'drive-audio-data.json').read_text(encoding='utf-8'))
    derived = [q['audioFile'] for q in audio['items']]
    exams = json.loads(gzip.decompress((root / 'drive-exam-data.json.gz').read_bytes()))
    codes = sorted({p.split('/')[-1].split('-')[0] for p in exams['report']['images']})
    derived.extend('content/drive-hsk/' + code + '.json' for code in codes)
    for name in derived:
        safe_path(name)
        if name not in files:
            files.append(name)
    for name in files:
        path = root / name
        if not path.is_file() or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError('Missing or unsafe PWA asset: ' + name)
    # Loader fallback and compressed variants must stay available together.
    loader = (root / 'loader.js').read_text(encoding='utf-8')
    match = re.search(r'const names=(\[.*?\]);', loader)
    if not match:
        raise ValueError('Cannot verify loader data names')
    # Existing loader uses single-quoted identifiers, not arbitrary JS expressions.
    names = json.loads(match[1].replace("'", '"'))
    for name in names:
        for suffix in ('.js', '.js.gz'):
            if name + suffix not in files:
                raise ValueError('Missing loader data variant: ' + name + suffix)
        if gzip.decompress((root / (name + '.js.gz')).read_bytes()) != (root / (name + '.js')).read_bytes():
            raise ValueError('Compressed loader data differs: ' + name)
    return files
