"""Fail closed when a frontend push forgets to ship a matching PWA release.

Backend-only pushes deliberately do NOT trigger an offline download: live Worker
changes are consumed the next time the app calls the server.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlparse
from pwa_assets import collect_assets, read_catalog

ROOT = Path(__file__).resolve().parents[1]
IGNORE_PREFIXES = ('server/', 'tools/', 'docs/', '.github/', '.serena/', '.git/')
CLIENT_SUFFIXES = ('.js', '.css', '.html', '.json', '.webmanifest', '.png', '.svg', '.webp', '.mp3', '.gz')
CLIENT_SHELL = ('offline.js', 'offline-worker.js', 'OneSignalSDKWorker.js', 'app-version.json')
RELEASE_RE = re.compile(r'^\d+\.\d+\.\d+$')
VERSION_RE = re.compile(r'^hsk-offline-[A-Za-z0-9-]+$')


def _run(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], text=True, encoding='utf-8').strip()


def source_assets():
    worker = (ROOT / 'offline-worker.js').read_text(encoding='utf-8')
    match = re.search(r'const OFFLINE_FILES=(\[.*?\]);', worker)
    if not match:
        raise ValueError('offline-worker.js lacks OFFLINE_FILES')
    entries = json.loads(match.group(1))
    if not isinstance(entries, list) or len(entries) != len(set(entries)):
        raise ValueError('OFFLINE_FILES missing or duplicate entries')
    return entries


def is_client_change(name, assets):
    name = name.replace('\\', '/')
    if name.startswith(IGNORE_PREFIXES):
        return False
    if name in assets or name in CLIENT_SHELL:
        return True
    # Catch new frontend files omitted from OFFLINE_FILES, too. Exclude
    # repository administration and development files.
    return name.endswith(CLIENT_SUFFIXES)


def ensure_release_integrity(root=ROOT):
    manifest = json.loads((root / 'app-version.json').read_text(encoding='utf-8'))
    version, release = manifest.get('version'), manifest.get('release')
    if not isinstance(version, str) or not VERSION_RE.fullmatch(version):
        raise ValueError('Invalid PWA version')
    if not isinstance(release, str) or not RELEASE_RE.fullmatch(release):
        raise ValueError('Invalid semantic release number')
    if version != 'hsk-offline-' + release.replace('.', '-'):
        raise ValueError('PWA version must match semantic release')
    assets = source_assets() if root == ROOT else read_asset_list(root)
    expected = collect_assets(root)
    if assets != expected:
        raise ValueError('OFFLINE_FILES differs from tools/pwa-assets.json and derived assets')
    worker_text = (root / 'offline-worker.js').read_text(encoding='utf-8')
    alias_match = re.search(r'^const OFFLINE_ALIASES=(.*?);$', worker_text, re.M)
    if not alias_match or json.loads(alias_match[1]) != read_catalog(root)['aliases']:
        raise ValueError('Worker aliases differ from PWA catalog')
    catalog = manifest.get('assets')
    if not isinstance(catalog, dict) or set(catalog) != set(assets):
        raise ValueError('Manifest assets do not match OFFLINE_FILES')
    for name in assets:
        data = (root / name).read_bytes()
        if Path(name).suffix.lower() not in ('.png', '.gz', '.webp', '.mp3'):
            data = data.replace(b'\r\n', b'\n')
        recorded = catalog[name]
        if recorded.get('sha256') != hashlib.sha256(data).hexdigest() or recorded.get('bytes') != len(data):
            raise ValueError('Stale asset hash for ' + name)
    offline = (root / 'offline.js').read_text(encoding='utf-8')
    worker = (root / 'offline-worker.js').read_text(encoding='utf-8')
    onesignal = (root / 'OneSignalSDKWorker.js').read_text(encoding='utf-8')
    if "BUILD='" + version + "'" not in offline:
        raise ValueError('offline.js BUILD does not match app-version.json')
    if "OFFLINE_VERSION='" + version + "'" not in worker:
        raise ValueError('offline-worker.js version does not match app-version.json')
    if version not in onesignal or 'offline-worker.js?v=' + version.removeprefix('hsk-offline-') not in onesignal:
        raise ValueError('OneSignal SDK worker imports a stale offline revision')
    # Ensure all local script and stylesheet references are in the offline
    # catalog. External CDNs and hash/query suffixes are never required.
    index = (root / 'index.html').read_text(encoding='utf-8')
    refs = re.findall(r'<(?:script|link)\b[^>]*(?:src|href)=[\'"]([^\'"]+)[\'"]', index, re.I)
    for ref in refs:
        parsed = urlparse(ref)
        if parsed.scheme or parsed.netloc or ref.startswith('/'):
            continue
        name = parsed.path.removeprefix('./')
        if name and (name.endswith('.js') or name.endswith('.css')) and name not in catalog:
            raise ValueError('Missing referenced asset from offline catalog: ' + name)
    return manifest


def read_asset_list(root):
    worker = (root / 'offline-worker.js').read_text(encoding='utf-8')
    return json.loads(re.search(r'const OFFLINE_FILES=(\[.*?\]);', worker).group(1))


def compare_with_base(base, manifest):
    if not base:
        print('No base reference supplied; integrity check only.')
        return []
    try:
        old = json.loads(_run('show', base + ':app-version.json'))
        changed = _run('diff', '--name-only', '--diff-filter=ACMRTD', base, 'HEAD').splitlines()
    except subprocess.CalledProcessError as exc:
        raise ValueError('Cannot compare release to base reference: ' + base) from exc
    all_assets = set(manifest['assets']) | set(old.get('assets') or {})
    frontend = [f for f in changed if is_client_change(f, all_assets)]
    if frontend and old.get('version') == manifest['version']:
        raise ValueError(
            'FRONTEND CHANGED WITHOUT PWA VERSION BUMP: ' + ', '.join(frontend[:9])
            + '. Run: python build-version.py --version hsk-offline-X-Y-Z'
            + ' --release X.Y.Z --note "Mô tả ngắn".'
        )
    if frontend:
        if old.get('release') == manifest.get('release') or old.get('version') == manifest['version']:
            raise ValueError('Frontend update requires a new release and PWA version')
        previous_release = old.get('release', '')
        if not RELEASE_RE.fullmatch(previous_release) or tuple(map(int, manifest['release'].split('.'))) <= tuple(map(int, previous_release.split('.'))):
            raise ValueError('Frontend update must increase to a newer semantic release')
        print('FRONTEND RELEASE OK: ' + old.get('version', '?') + ' -> ' + manifest['version'])
    else:
        print('BACKEND/DOCS-ONLY PUSH: no iPhone app download needed (server changes are live).')
    return frontend


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', help='Git reference before the push/PR')
    args = parser.parse_args()
    try:
        manifest = ensure_release_integrity()
        changed = compare_with_base(args.base, manifest)
        print('PASS: verified', len(manifest['assets']), 'PWA files;',
              'client changes:', len(changed), '; release:', manifest['release'])
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as exc:
        print('FAIL: PWA release guard:', exc, file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
