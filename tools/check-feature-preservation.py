"""HSK Feature Preservation Gate: existing capabilities are append-only by default.

A removal requires a distinct *previously merged and owner-reviewed* approval PR,
then a separate code PR. An approval file added in the same code PR cannot bypass.
This gate complements, not replaces, browser functional regression tests.
"""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = 'tools/feature-contract.json'
APPROVALS = 'tools/approved-feature-removals.json'
MINIMUM_CONTRACTS = 1
ALLOWED_KINDS = {'contains', 'file', 'id', 'data_go', 'lessons'}


def git(*args):
    return subprocess.check_output(
        ['git', '-C', str(ROOT), *args], text=True, encoding='utf-8'
    ).strip()


def from_base(base, filename):
    try:
        return json.loads(git('show', base + ':' + filename))
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        return None


def changed_files(base):
    return git('diff', '--name-only', '--diff-filter=ACMRTD', base, 'HEAD').splitlines()


def validate_contract(data):
    if not isinstance(data, dict) or data.get('schema') != 1:
        raise ValueError('Feature contract schema invalid or missing')
    features = data.get('features')
    if not isinstance(features, list) or len(features) < MINIMUM_CONTRACTS:
        raise ValueError('Baseline feature inventory truncated (expected 38+ features)')
    ids = set()
    for item in features:
        if not isinstance(item, dict) or set(item) != {'id', 'name', 'checks'}:
            raise ValueError('Malformed feature record')
        key = item['id']
        if not isinstance(key, str) or not re.fullmatch(r'[a-z0-9-]{3,60}', key) or key in ids:
            raise ValueError('Duplicated/invalid feature ID ' + str(key))
        ids.add(key)
        checks = item['checks']
        if not isinstance(checks, list) or not checks:
            raise ValueError('Missing implementation checks: ' + key)
        for check in checks:
            if not isinstance(check, dict) or set(check) != {'kind', 'file', 'value'}:
                raise ValueError('Malformed feature check: ' + key)
            if check['kind'] not in ALLOWED_KINDS:
                raise ValueError('Unsupported check kind: ' + str(check['kind']))
            file = check['file']
            if not isinstance(file, str) or not file or file.startswith('/') or '\\' in file or '..' in Path(file).parts:
                raise ValueError('Unsafe source file: ' + str(file))
            if not isinstance(check['value'], str):
                raise ValueError('Invalid expected content')
    return {entry['id']: entry for entry in features}


class Markup(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.routes = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        if a.get('data-studio-go'):
            self.routes.add(a['data-studio-go'])


def inspect_implementation(data, root=ROOT):
    ids = validate_contract(data)
    html = Markup()
    html.feed((root / 'index.html').read_text(encoding='utf-8'))
    text_cache = {}
    failures = []
    for feature in ids.values():
        for check in feature['checks']:
            kind, name, value = check['kind'], check['file'], check['value']
            source = root / name
            if not source.exists():
                failures.append(feature['id'] + ': source missing: ' + name)
                continue
            if kind == 'file':
                continue
            if kind == 'id':
                passed = value in html.ids
            elif kind == 'data_go':
                passed = value in html.routes
            elif kind == 'lessons':
                contents = json.loads(source.read_text(encoding='utf-8'))
                expected = dict(pair.split(':') for pair in value.split(','))
                counts = {str(c['hsk']): len(c['lessons']) for c in contents['courses']}
                passed = all(counts.get(k, 0) >= int(minimum) for k, minimum in expected.items())
            else:
                if name not in text_cache:
                    text_cache[name] = source.read_text(encoding='utf-8')
                passed = value in text_cache[name]
            if not passed:
                failures.append(feature['id'] + ': missing ' + kind + ' ' + value[:70] + ' in ' + name)
    # All current and future menu entries/practice modes must be represented
    # by contracts. An AI cannot add an untested mode that is lost next release.
    covered_routes = {check['value'] for feat in ids.values()
                      for check in feat['checks'] if check['kind'] == 'data_go'}
    for route in sorted(html.routes - covered_routes):
        failures.append('New/unprotected navigation route: ' + route)
    chooser = (root / 'src/modules/practice/practice-selector.js').read_text(encoding='utf-8')
    match = re.search(r'const MODES=\[(.*?)\];', chooser, re.S)
    if not match:
        failures.append('Practice mode registry MODES has disappeared')
    else:
        mode_names = set(re.findall(r"\['([^']+)'", match.group(1)))
        guarded_modes = {check['value'][2:-1] for feat in ids.values()
                         for check in feat['checks']
                         if check['kind'] == 'contains' and check['file'] == 'src/modules/practice/practice-selector.js'
                         and check['value'].startswith("['")}
        for mode in sorted(mode_names - guarded_modes):
            failures.append('New/unprotected practice mode: ' + mode)
    if failures:
        raise ValueError('Existing feature damaged:\n - ' + '\n - '.join(failures))
    return len(ids), sum(len(x['checks']) for x in ids.values())


def parse_approvals(data):
    if not isinstance(data, dict) or data.get('schema') != 1 or not isinstance(data.get('approved'), list):
        raise ValueError('Invalid removal authorization format')
    result = {}
    for item in data['approved']:
        if not isinstance(item, dict) or set(item) != {'id', 'approvedBy', 'approvalUrl', 'reason'}:
            raise ValueError('Invalid removal authorization record')
        if item['approvedBy'] != 'trungxemcode' or not re.fullmatch(r'https://github\.com/trungxemcode/hsk/(?:issues|pull)/\d+', item['approvalUrl']):
            raise ValueError('Removal authorization must link a user-reviewed HSK issue or PR')
        if not item['reason'] or item['id'] in result:
            raise ValueError('Removal authorization missing reason or duplicated')
        result[item['id']] = item
    return result


def exact_relocation(base_ref, old, new, root=ROOT):
    """Only an unmodified, deleted-source move to a fresh tracked path qualifies.

    No manifest/flag can authorize a weaker check. Read the old bytes from Git,
    not from a caller-supplied hash, and compare against the actual destination.
    """
    if not base_ref or old == new:
        return False
    root = root.resolve()
    source, target = root / old, root / new
    if source.exists() or source.is_symlink() or target.is_symlink() or not target.is_file():
        return False
    if not target.resolve().is_relative_to(root):
        return False
    prefix = ['git', '-C', str(root)]
    # A pre-existing destination is a replacement, not a relocation.
    exists = subprocess.run(prefix + ['cat-file', '-e', base_ref + ':' + new],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if exists.returncode == 0:
        return False
    try:
        old_bytes = subprocess.check_output(prefix + ['show', base_ref + ':' + old],
                                            stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        return False
    # Git may check text out with CRLF on Windows. No other changes are allowed.
    return old_bytes.replace(b'\r\n', b'\n') == target.read_bytes().replace(b'\r\n', b'\n')


def ensure_no_unapproved_removals(current, base, old_approvals, changed, base_ref=None, root=ROOT):
    old = validate_contract(base)
    now = validate_contract(current)
    # A separate first PR must add a documented authorization to main. The
    # subsequent change checks ONLY approvals already present in its base.
    permissions = parse_approvals(old_approvals)
    for fid, prev in old.items():
        if fid not in now:
            if fid not in permissions:
                raise ValueError('FEATURE DELETION BLOCKED: ' + fid +
                                 '. First get a separately merged, owner-approved removal authorization.')
            continue
        curr = now[fid]
        removed_checks = []
        for check in prev['checks']:
            if check in curr['checks']:
                continue
            candidates = [candidate for candidate in curr['checks']
                          if candidate['kind'] == check['kind']
                          and candidate['value'] == check['value']
                          and exact_relocation(base_ref, check['file'], candidate['file'], root)]
            if len(candidates) != 1:
                removed_checks.append(check)
        if removed_checks or curr['name'] != prev['name']:
            if fid not in permissions:
                raise ValueError('FEATURE CONTRACT WEAKENED: ' + fid + '. Removal approval required.')
    if APPROVALS in changed:
        # Never allow approval + code deletion in the same PR.
        allowed = {APPROVALS}
        if any(name not in allowed for name in changed):
            raise ValueError('Removal approvals must be submitted in a SEPARATE approval-only PR')
    return len(old)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--base', help='Full git SHA of the PR base or pre-push commit')
    opts = p.parse_args()
    try:
        current = json.loads((ROOT / REGISTRY).read_text(encoding='utf-8'))
        a, checks = inspect_implementation(current)
        approvals = json.loads((ROOT / APPROVALS).read_text(encoding='utf-8'))
        parse_approvals(approvals)
        if opts.base:
            earlier = from_base(opts.base, REGISTRY)
            if earlier is None:
                raise ValueError('Unable to read feature registry from base: ' + opts.base)
            previous_approvals = from_base(opts.base, APPROVALS)
            if previous_approvals is None:
                raise ValueError('Unable to read approved removals from base')
            kept = ensure_no_unapproved_removals(current, earlier, previous_approvals, changed_files(opts.base), base_ref=opts.base)
            print('PASS append-only feature contract:', kept, 'existing features preserved')
        print('PASS feature preservation:', a, 'capabilities;', checks, 'implementation guards')
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print('FAIL Feature Preservation Gate:', exc, file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
