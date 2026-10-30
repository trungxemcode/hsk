"""Verify the deployed editor's release and exact source assets without changing design data."""
import argparse
import hashlib
import json
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://hsk-ui-designer.trung-hsk668.workers.dev'

def verify(fetch):
    release = json.loads((ROOT / 'app-version.json').read_text())['release']
    state = json.loads(fetch('/__designer/state'))
    if state.get('release') != release:
        raise ValueError('Live editor release differs from checkout: ' + str(state.get('release')))
    assets = [p for p in (ROOT / 'tools/home-designer').glob('*') if p.is_file()]
    assets.append(ROOT / 'app-version.json')
    for path in assets:
        name = '/' + path.relative_to(ROOT).as_posix()
        if hashlib.sha256(fetch(name)).digest() != hashlib.sha256(path.read_bytes()).digest():
            raise ValueError('Live asset differs: ' + name)
    return release, len(assets)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--attempts', type=int, default=8)
    parser.add_argument('--delay', type=int, default=5)
    args = parser.parse_args()
    def fetch(path):
        request = urllib.request.Request(URL + path + '?verify=' + str(time.time_ns()), headers={'Cache-Control': 'no-cache', 'User-Agent': 'Mozilla/5.0 (compatible; HSK-Editor-Deploy/1.0)'})
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read()
    for attempt in range(args.attempts):
        try:
            release, count = verify(fetch)
            print('PASS live editor', release, ':', count, 'matching assets;', URL)
            return
        except Exception as error:
            print('Verification attempt', attempt + 1, 'failed:', error, flush=True)
            if attempt + 1 == args.attempts:
                raise SystemExit('Editor deployment could not be verified.') from None
            time.sleep(args.delay)

if __name__ == '__main__':
    main()
