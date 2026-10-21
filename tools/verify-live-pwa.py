"""Verify that GitHub Pages actually serves the committed PWA release.

The update/push workflow alone cannot guarantee a live deployment. Use this on
all main pushes, including server-only pushes. No credentials required.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import time
import urllib.parse
import urllib.request
from pwa_assets import read_catalog

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SITE = 'https://trungxemcode.github.io/hsk/'
CRITICAL_FILES = (
    'index.html', 'offline.js', 'offline-worker.js',
    'OneSignalSDKWorker.js', 'src/modules/reading/real-reading.js', 'push.js',
)


def fetch(url, timeout=15):
    request = urllib.request.Request(url, headers={
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'HSK-PWA-Release-Verification/1.0'
    })
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise ValueError('Unexpected HTTP ' + str(response.status))
        return response.read()


def inspect(site, manifest, fetch_fn=fetch):
    site = site.rstrip('/') + '/'
    nonce = str(int(time.time() * 1000))
    remote = json.loads(fetch_fn(urllib.parse.urljoin(site, 'app-version.json') + '?check=' + nonce))
    if remote.get('version') != manifest.get('version'):
        raise ValueError('Stale public PWA version: ' + str(remote.get('version')))
    if remote.get('release') != manifest.get('release'):
        raise ValueError('Public semantic version does not match')
    for name in dict.fromkeys((*CRITICAL_FILES, *read_catalog(ROOT)['aliases'].values())):
        local = (ROOT / name).read_bytes()
        if Path(name).suffix.lower() not in ('.png', '.gz', '.webp', '.mp3'):
            local = local.replace(b'\r\n', b'\n')
        public = fetch_fn(urllib.parse.urljoin(site, name) + '?check=' + nonce)
        if Path(name).suffix.lower() not in ('.png', '.gz', '.webp', '.mp3'):
            public = public.replace(b'\r\n', b'\n')
        if hashlib.sha256(public).digest() != hashlib.sha256(local).digest():
            raise ValueError('Public Pages asset out of sync: ' + name)
    return manifest['version']


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--site', default=DEFAULT_SITE)
    p.add_argument('--attempts', type=int, default=20)
    p.add_argument('--delay', type=int, default=20)
    p.add_argument('--timeout', type=int, default=15)
    args = p.parse_args()
    local = json.loads((ROOT / 'app-version.json').read_text(encoding='utf-8'))
    error = None
    for attempt in range(1, args.attempts + 1):
        try:
            result = inspect(args.site, local, lambda url: fetch(url, args.timeout))
            print('PASS: LIVE PWA', result, '- all critical Pages assets match main')
            return
        except (ValueError, OSError, urllib.error.URLError, json.JSONDecodeError) as exc:
            error = exc
            print('Waiting for Pages deployment (' + str(attempt) + '/'
                  + str(args.attempts) + '): ' + str(exc), flush=True)
            if attempt < args.attempts:
                time.sleep(args.delay)
    print('FAIL: live site not synchronized with main: ' + str(error), file=sys.stderr)
    sys.exit(1)


if __name__ == '__main__':
    main()
