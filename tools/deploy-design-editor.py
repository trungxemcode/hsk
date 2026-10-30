"""Deploy only the dedicated UX/UI Worker through Cloudflare's documented direct-asset API."""
import argparse
import base64
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import tomllib
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
API = 'https://api.cloudflare.com/client/v4'
def multipart(parts):
    boundary = 'hsk-' + uuid.uuid4().hex
    body = bytearray()
    for name, filename, mime, content in parts:
        disposition = 'Content-Disposition: form-data; name="' + name + '"'
        if filename:
            disposition += '; filename="' + filename + '"'
        body.extend(('--' + boundary + '\r\n' + disposition + '\r\nContent-Type: ' + mime + '\r\n\r\n').encode())
        body.extend(content)
        body.extend(b'\r\n')
    body.extend(('--' + boundary + '--\r\n').encode())
    return bytes(body), 'multipart/form-data; boundary=' + boundary

def call(path, token, method='GET', body=None, mime='application/json'):
    headers = {'Authorization': 'Bearer ' + token}
    if body is not None:
        headers['Content-Type'] = mime
    try:
        with urllib.request.urlopen(urllib.request.Request(API + path, method=method, data=body, headers=headers), timeout=120) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try:
            detail = json.load(error).get('errors', [])
        except ValueError:
            detail = []
        raise RuntimeError('Cloudflare returned HTTP ' + str(error.code) + ': ' + str(detail)) from None
    if not result.get('success'):
        raise RuntimeError('Cloudflare rejected upload: ' + str(result.get('errors')))
    return result.get('result')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--account-id', required=True)
    parser.add_argument('--bundle', type=Path, required=True)
    args = parser.parse_args()
    config = json.loads((ROOT / 'server/design/wrangler.jsonc').read_text())
    if config['name'] != 'hsk-ui-designer':
        raise SystemExit('This deployer is restricted to the dedicated design Worker.')
    token = os.environ.get('CLOUDFLARE_API_TOKEN')
    if not token and os.environ.get('GITHUB_ACTIONS') == 'true':
        raise SystemExit('Missing Actions secret CLOUDFLARE_API_TOKEN.')
    if not token:
        token = tomllib.loads((Path.home() / '.config/.wrangler/config/default.toml').read_text())['oauth_token']
    account = '/accounts/' + args.account_id
    script = account + '/workers/scripts/hsk-ui-designer'
    directory = ROOT / 'server/design/.assets'
    names = set(json.loads((ROOT / 'app-version.json').read_text())['assets']) | {'app-version.json'}
    names |= {str(p.relative_to(ROOT)) for p in (ROOT / 'tools/home-designer').glob('*') if p.is_file()}
    manifest, files = {}, {}
    for name in sorted(names):
        content = (directory / name).read_bytes()
        extension = Path(name).suffix
        digest = hashlib.sha256(content + extension.encode()).hexdigest()[:32]
        mime = 'application/gzip' if extension == '.gz' else (mimetypes.guess_type(name)[0] or 'application/octet-stream')
        manifest['/' + name] = {'hash': digest, 'size': len(content)}
        files[digest] = (mime, content)
    session = call(script + '/assets-upload-session', token, 'POST', json.dumps({'manifest': manifest}).encode())
    upload_token, completion = session['jwt'], session['jwt']
    print('Registered', len(manifest), 'public assets;', len(session['buckets']), 'upload batches', flush=True)
    for index, bucket in enumerate(session['buckets']):
        parts = [(digest, digest, files[digest][0], base64.b64encode(files[digest][1])) for digest in bucket]
        body, mime = multipart(parts)
        uploaded = call(account + '/workers/assets/upload?base64=true', upload_token, 'POST', body, mime)
        if uploaded.get('jwt'):
            completion = uploaded['jwt']
        print('Uploaded asset batch', index + 1, flush=True)
    config['vars']['APP_RELEASE'] = json.loads((ROOT / 'app-version.json').read_text())['release']
    bindings = [{'name': key, 'type': 'plain_text', 'text': str(value)} for key, value in config['vars'].items()]
    bindings += [{'name': row['binding'], 'type': 'r2_bucket', 'bucket_name': row['bucket_name']} for row in config['r2_buckets']]
    bindings.append({'name': 'ASSETS', 'type': 'assets'})
    metadata = {'main_module': 'worker.mjs', 'compatibility_date': config['compatibility_date'], 'bindings': bindings,
                'assets': {'jwt': completion, 'config': {'run_worker_first': True, 'html_handling': 'none', 'not_found_handling': 'none'}}}
    body, mime = multipart([('metadata', None, 'application/json', json.dumps(metadata).encode()),
                            ('worker.mjs', 'worker.mjs', 'application/javascript+module', args.bundle.read_bytes())])
    call(script, token, 'PUT', body, mime)
    call(script + '/subdomain', token, 'POST', b'{"enabled":true,"previews_enabled":false}')
    print('Dedicated design Worker deployed; existing music/AI/voice Workers unchanged.', flush=True)

if __name__ == '__main__':
    main()
