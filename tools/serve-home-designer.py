"""Loopback-only HSK Home Designer. Python standard library; no npm install."""
import argparse
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import math
import os
from pathlib import Path
import re
import secrets
import tempfile
import threading
from urllib.parse import urlsplit
import webbrowser


def validate(schema, data):
    if not isinstance(data, dict) or type(data.get('schema')) is not int or data.get('schema') != 1 or data.get('page') != 'home':
        raise ValueError('Tệp không phải cấu hình trang chủ HSK phiên bản 1.')
    if set(data) != {'schema', 'page', 'styles', 'order'}:
        raise ValueError('Trường cấu hình không hợp lệ.')
    if not all(isinstance(data.get(k), dict) and set(data[k]) == {'desktop', 'mobile'} for k in ('styles', 'order')):
        raise ValueError('Thiếu cấu hình PC/điện thoại.')
    keys = {c['key'] for c in schema['components']}
    for mode in ('desktop', 'mobile'):
        order, styles = data['order'][mode], data['styles'][mode]
        if not isinstance(order, list) or not all(isinstance(x, str) for x in order) or len(order) != len(schema['groups'][mode]) or len(set(order)) != len(order) or set(order) != set(schema['groups'][mode]):
            raise ValueError('Danh sách khối có phần tử thiếu, trùng hoặc không hợp lệ.')
        if not isinstance(styles, dict) or not set(styles).issubset(keys):
            raise ValueError('Phần tử không được phép chỉnh.')
        for props in styles.values():
            if not isinstance(props, dict):
                raise ValueError('Thuộc tính không hợp lệ.')
            for name, value in props.items():
                p = schema['properties'].get(name)
                if not p:
                    raise ValueError('Thuộc tính không được phép: ' + name)
                if p['type'] == 'number':
                    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not p['min'] <= value <= p['max'] or (p.get('integer') and value != int(value)):
                        raise ValueError('Giá trị ngoài giới hạn: ' + p['label'])
                elif not isinstance(value, str) or value not in [o['value'] for o in p['options']]:
                    raise ValueError('Giá trị không hợp lệ: ' + p['label'])
    return data


def generate_css(schema, data):
    data = validate(schema, data)
    prefix = 'html body.studio-enabled[data-studio-hub="home"] #studioHome#studioHome#studioHome'
    by_key = {c['key']: c for c in schema['components']}
    css = '/* HSK Home Designer v1 — generated; edit the JSON in the local designer. */\n'
    for mode in ('desktop', 'mobile'):
        scope = prefix.replace('body.studio-enabled', 'body.studio-enabled:not(.mobile-ux)' if mode == 'desktop' else 'body.studio-enabled.mobile-ux')
        rules = []
        for c in schema['components']:
            props = data['styles'][mode].get(c['key'], {})
            declarations = []
            for name, p in schema['properties'].items():
                if name in props:
                    v = props[name]
                    value = str(int(v)) if isinstance(v, (float, int)) and v == int(v) else str(v)
                    declarations.append(p['css'] + ':' + value + p.get('unit', '') + '!important')
            if declarations:
                rules.append(scope + ' ' + c['selector'] + '{' + ';'.join(declarations) + ';}')
        if data['order'][mode] != schema['groups'][mode]:
            rules += [scope + ':not([hidden]){display:flex!important;flex-direction:column!important;}', scope + '>*{order:900!important;}', scope + '>#updateNotice{order:-1!important;}']
            for i, key in enumerate(data['order'][mode]):
                rules.append(scope + '>' + by_key[key]['selector'] + '{order:' + str(i) + '!important;}')
        if rules:
            css += '@media ' + ('(min-width:721px)' if mode == 'desktop' else '(max-width:720px), (orientation:landscape) and (max-height:500px) and (pointer:coarse)') + '{\n' + '\n'.join(rules) + '\n}\n'
    return css


def apply_config(root, schema, data):
    """Only the managed JSON/CSS and one marked HTML link can be written."""
    data = validate(schema, data)
    index = root / 'index.html'
    before = index.read_text(encoding='utf-8')
    if len(re.findall(r'<!-- HSK HOME DESIGN START -->', before)) > 1:
        raise ValueError('Có nhiều vùng cấu hình giao diện trong index.html; cần kiểm tra lại.')
    before_clean = re.sub(r'\n?<!-- HSK HOME DESIGN START -->.*?<!-- HSK HOME DESIGN END -->\n?', '', before, flags=re.S)
    if '</head>' not in before_clean:
        raise ValueError('Không tìm thấy phần đầu trang để gắn cấu hình.')
    link = '\n<!-- HSK HOME DESIGN START -->\n<link rel="stylesheet" href="./home-design.css">\n<!-- HSK HOME DESIGN END -->\n'
    outputs = {
        root / 'home-design.json': (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode(),
        root / 'home-design.css': generate_css(schema, data).encode(),
        index: before_clean.replace('</head>', link + '</head>', 1).encode(),
    }
    catalog = root / 'tools/pwa-assets.json'
    if catalog.exists():
        assets = json.loads(catalog.read_text(encoding='utf-8'))
        if not isinstance(assets.get('files'), list):
            raise ValueError('Danh mục tài nguyên PWA không hợp lệ.')
        if 'home-design.css' not in assets['files']:
            assets['files'].append('home-design.css')
        outputs[catalog] = (json.dumps(assets, ensure_ascii=False, indent=2) + '\n').encode()
    originals = {p: p.read_bytes() if p.exists() else None for p in outputs}
    temporary = []
    try:
        for dest, content in outputs.items():
            with tempfile.NamedTemporaryFile(dir=root, delete=False) as f:
                f.write(content)
                name = Path(f.name)
            os.chmod(name, dest.stat().st_mode & 0o777 if dest.exists() else 0o644)
            temporary.append((name, dest))
        for source, dest in temporary:
            os.replace(source, dest)
    except Exception:
        for dest, original in originals.items():
            if original is None:
                dest.unlink(missing_ok=True)
            else:
                dest.write_bytes(original)
        raise
    finally:
        for source, _ in temporary:
            source.unlink(missing_ok=True)
    return {'ok': True, 'files': [str(p.relative_to(root)) for p in outputs]}


def make_server(root, port):
    root = root.resolve()
    schema = json.loads((root / 'tools/home-designer/schema.json').read_text(encoding='utf-8'))
    token = secrets.token_urlsafe(32)
    lock = threading.Lock()

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

        def log_message(self, *_args):
            pass

        def end_headers(self):
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('X-Frame-Options', 'SAMEORIGIN')
            self.send_header('Content-Security-Policy', "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' data: blob:; frame-ancestors 'self'; form-action 'self'")
            super().end_headers()

        def host_allowed(self):
            try:
                host = urlsplit('http://' + self.headers.get('Host', ''))
                return host.hostname in ('127.0.0.1', 'localhost', '::1') and host.port == self.server.server_port
            except ValueError:
                return False

        def json_response(self, data, code=200):
            body = json.dumps(data, ensure_ascii=False).encode()
            self.send_response(code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if not self.host_allowed():
                return self.json_response({'error': 'Host không hợp lệ.'}, 403)
            path = urlsplit(self.path).path
            if path == '/__designer/state':
                try:
                    applied = validate(schema, json.loads((root / 'home-design.json').read_text(encoding='utf-8'))) if (root / 'home-design.json').exists() else None
                    release = json.loads((root / 'app-version.json').read_text(encoding='utf-8'))['release']
                    return self.json_response({'token': token, 'projectId': hashlib.sha256(str(root).encode()).hexdigest()[:16], 'release': release, 'applied': applied})
                except (ValueError, OSError) as e:
                    return self.json_response({'error': str(e)}, 400)
            if path.endswith('/account-config.json'):
                return self.json_response({'enabled': False})
            if path.endswith('/push-config.json'):
                return self.json_response({'enabled': False})
            if self.headers.get('Service-Worker') == 'script':
                return self.json_response({'error': 'Bản xem thử không cài service worker.'}, 404)
            resolved = Path(self.translate_path(self.path)).resolve()
            if not resolved.is_relative_to(root) or any(part.startswith('.') for part in resolved.relative_to(root).parts) or (resolved.is_dir() and not (resolved / 'index.html').exists()):
                return self.json_response({'error': 'Đường dẫn không được hỗ trợ.'}, 404)
            return super().do_GET()

        def do_POST(self):
            if not self.host_allowed() or self.headers.get('Origin') != 'http://' + self.headers.get('Host') or not secrets.compare_digest(self.headers.get('X-HSK-Designer-Token', ''), token):
                return self.json_response({'error': 'Yêu cầu lưu không hợp lệ. Hãy tải lại bộ chỉnh.'}, 403)
            if self.path != '/__designer/apply':
                return self.json_response({'error': 'Đường dẫn không được hỗ trợ.'}, 404)
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 200000:
                    raise ValueError('Kích thước bản nháp không hợp lệ.')
                data = json.loads(self.rfile.read(length))
                with lock:
                    result = apply_config(root, schema, data)
                return self.json_response(result)
            except (ValueError, OSError) as e:
                return self.json_response({'error': str(e)}, 400)

    return ThreadingHTTPServer(('127.0.0.1', port), Handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--port', type=int, default=8788)
    parser.add_argument('--open', action='store_true')
    args = parser.parse_args()
    try:
        server = make_server(args.root, args.port)
    except OSError as e:
        parser.exit(1, 'Cannot start HSK Home Designer: ' + str(e) + '\nTry --port 8789 if the port is busy.\n')
    url = 'http://127.0.0.1:' + str(server.server_port) + '/tools/home-designer/editor.html'
    print('HSK Home Designer: ' + url, flush=True)
    print('Keep this window open. Press Ctrl+C to stop.', flush=True)
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
