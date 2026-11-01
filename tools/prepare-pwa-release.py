"""One-command safe PWA patch release for VS Code / Antigravity / Codex.

Run only after reviewing frontend changes. CI rejects forgotten revisions.
"""
import argparse
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def next_release(current, part):
    if not re.fullmatch(r'\d+\.\d+\.\d+', current):
        raise ValueError('Cannot bump invalid current release')
    major, minor, patch = map(int, current.split('.'))
    if part == 'minor':
        return f'{major}.{minor + 1}.1'
    return f'{major}.{minor}.{patch + 1}'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--note', default='Cập nhật và đồng bộ ứng dụng')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--release', help='Explicit new semantic release, e.g. 4.1.1')
    mode.add_argument('--keep-release', action='store_true', help='Small UI fix: keep public release, advance internal PWA revision')
    parser.add_argument('--bump', choices=('patch', 'minor'), default='patch')
    args = parser.parse_args()
    if len(args.note) > 100 or '\n' in args.note:
        parser.error('Release note must be one short line.')
    branch = subprocess.check_output(
        ['git', '-C', str(ROOT), 'branch', '--show-current'],
        encoding='utf-8', text=True
    ).strip()
    if branch in ('main', 'master', ''):
        parser.error('Create a feature branch before preparing a release.')
    manifest = json.loads((ROOT / 'app-version.json').read_text(encoding='utf-8'))
    release = args.release or (manifest['release'] if args.keep_release else next_release(manifest['release'], args.bump))
    if not re.fullmatch(r'\d+\.\d+\.\d+', release):
        parser.error('Invalid semantic release')
    version = 'hsk-offline-' + release.replace('.', '-')
    if args.keep_release:
        match = re.fullmatch(re.escape(version) + r'-r(\d+)', manifest['version'])
        version += '-r' + str(int(match[1]) + 1 if match else 1)
    cmd = [sys.executable, str(ROOT / 'build-version.py'),
           '--version', version, '--release', release, '--note', args.note]
    subprocess.run(cmd, cwd=ROOT, check=True)
    subprocess.run([sys.executable, str(ROOT / 'tools' / 'check-pwa-release.py')],
                   cwd=ROOT, check=True)
    print('Release prepared:', release, '- stage app-version.json, offline.js,'
          ' offline-worker.js, OneSignalSDKWorker.js with your UI changes.')


if __name__ == '__main__':
    main()
