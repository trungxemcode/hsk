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


def page_schemas(schema):
    return schema.get('pages') or [{'id': 'home', 'label': 'Trang chủ', 'root': '#studioHome', 'scope': 'html body.studio-enabled[data-studio-hub="home"] #studioHome#studioHome#studioHome', 'reorder': True, 'components': schema['components'], 'groups': schema['groups']}]


def blank_page():
    return {'components': {}, 'styles': {'desktop': {}, 'mobile': {}}, 'order': {'desktop': [], 'mobile': []}}


def empty_project(schema):
    return {'schema': 2, 'pages': {p['id']: blank_page() for p in page_schemas(schema)}}


def selector_ok(value):
    if not isinstance(value, str) or len(value) > 360:
        return False
    if value == '':
        return True
    segment = r'(?:#[A-Za-z_][\w-]*|[a-z][a-z0-9-]*(?::nth-of-type\([1-9][0-9]{0,4}\))?)'
    return bool(re.fullmatch(segment + r'(?: > ' + segment + r')*', value)) and not re.search(r'(?:^| > )(?:html|body|head|script|style|link|meta)(?:$|:| > )', value)


def validate_styles(schema, styles, keys):
    if not isinstance(styles, dict) or set(styles) != {'desktop', 'mobile'}:
        raise ValueError('Thiếu cấu hình PC/điện thoại.')
    for mode in ('desktop', 'mobile'):
        if not isinstance(styles[mode], dict) or not set(styles[mode]).issubset(keys):
            raise ValueError('Phần tử không được phép chỉnh.')
        for props in styles[mode].values():
            if not isinstance(props, dict):
                raise ValueError('Thuộc tính không hợp lệ.')
            for name, value in props.items():
                p = schema['properties'].get(name)
                if not p:
                    raise ValueError('Thuộc tính không được phép: ' + name)
                if p['type'] == 'number':
                    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not p['min'] <= value <= p['max'] or (p.get('integer') and value != int(value)):
                        raise ValueError('Giá trị ngoài giới hạn: ' + p['label'])
                elif p['type'] == 'color':
                    if not isinstance(value, str) or (not re.fullmatch(r'#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})', value) and value not in [o['value'] for o in p['options']]):
                        raise ValueError('Màu không hợp lệ: ' + p['label'])
                elif not isinstance(value, str) or value not in [o['value'] for o in p['options']]:
                    raise ValueError('Giá trị không hợp lệ: ' + p['label'])
    return styles


def validate(schema, data):
    if not isinstance(data, dict) or type(data.get('schema')) is not int:
        raise ValueError('Tệp không phải bản nháp giao diện HSK phiên bản 1 hoặc 2.')
    if data['schema'] == 1:
        if set(data) != {'schema', 'page', 'styles', 'order'} or data['page'] != 'home':
            raise ValueError('Bản nháp trang chủ không hợp lệ.')
        validate_styles(schema, data['styles'], {c['key'] for c in schema['components']})
        if not isinstance(data['order'], dict) or set(data['order']) != {'desktop', 'mobile'}:
            raise ValueError('Thiếu thứ tự khối.')
        for mode in ('desktop', 'mobile'):
            order = data['order'][mode]
            if not isinstance(order, list) or not all(isinstance(k, str) for k in order) or len(order) != len(schema['groups'][mode]) or len(set(order)) != len(order) or set(order) != set(schema['groups'][mode]):
                raise ValueError('Danh sách khối không hợp lệ.')
        return data
    if data['schema'] != 2 or set(data) != {'schema', 'pages'} or not isinstance(data['pages'], dict):
        raise ValueError('Bản nháp giao diện không hợp lệ.')
    pages = {p['id']: p for p in page_schemas(schema)}
    out = empty_project(schema)
    for page_id, config in data['pages'].items():
        if page_id not in pages or not isinstance(config, dict) or set(config) != {'components', 'styles', 'order'} or not isinstance(config['components'], dict) or len(config['components']) > 1000:
            raise ValueError('Trang hoặc danh sách phần tử không hợp lệ.')
        page = pages[page_id]
        registry = {c['key']: c for c in page.get('components', [])}
        for key, component in config['components'].items():
            if not re.fullmatch(r'[a-z][a-z0-9-]{0,95}', key) or key in registry or not isinstance(component, dict) or set(component) != {'selector', 'label'} or not selector_ok(component['selector']) or not isinstance(component['label'], str) or not 0 < len(component['label']) <= 120:
                raise ValueError('Phần tử nhập không hợp lệ: ' + key)
            registry[key] = component
        validate_styles(schema, config['styles'], set(registry))
        if not isinstance(config['order'], dict) or set(config['order']) != {'desktop', 'mobile'}:
            raise ValueError('Thiếu thứ tự khối.')
        for mode in ('desktop', 'mobile'):
            order = config['order'][mode]
            if not isinstance(order, list) or not all(isinstance(k, str) for k in order) or len(order) > 100 or len(set(order)) != len(order) or any(k not in registry or not registry[k]['selector'] or ' ' in registry[k]['selector'] for k in order) or (order and not page.get('reorder')):
                raise ValueError('Thứ tự khối không hợp lệ.')
        out['pages'][page_id] = config
    return out


def upgrade(schema, data):
    data = validate(schema, data)
    if data['schema'] == 2:
        return data
    out = empty_project(schema)
    out['pages']['home']['styles'] = data['styles']
    for mode in ('desktop', 'mobile'):
        if data['order'][mode] != schema['groups'][mode]:
            out['pages']['home']['order'][mode] = data['order'][mode]
    return out


def element_rules(schema, props, selector):
    declarations, extra = [], []
    name = props.get('animationName')
    preset = bool(name and name != 'none')
    trigger = props.get('animationTrigger', 'appear')
    def decl(p, value):
        if isinstance(value, (float, int)) and value == int(value):
            value = int(value)
        return p['css'] + ':' + str(value) + p.get('unit', '') + '!important'
    for key, p in schema['properties'].items():
        if key in props and not p.get('meta') and key != 'animationName':
            declarations.append(decl(p, props[key]))
    def importance(key):
        return '' if key in schema.get('motion', {}).get('channels', {}).get(name, []) else '!important'
    for key, variable, fallback in [('moveX', 'x', '0px'), ('moveY', 'y', '0px'), ('rotate', 'rotate', '0deg'), ('scale', 'scale', '1'), ('opacity', 'opacity', '1')]:
        if (preset or (key in ('moveX', 'moveY') and ('moveX' in props or 'moveY' in props))) and key not in props:
            declarations.append('--hsk-design-' + variable + ':' + fallback + '!important')
    if 'moveX' in props or 'moveY' in props:
        declarations.append('translate:var(--hsk-design-x,0px) var(--hsk-design-y,0px)' + importance('translate'))
    for key, css, fallback in [('rotate', 'rotate', '0deg'), ('scale', 'scale', '1'), ('opacity', 'opacity', '1')]:
        if key in props:
            declarations.append(css + ':var(--hsk-design-' + key + ',' + fallback + ')' + importance(key))
    if preset:
        for key, value in schema['motion']['defaults'].items():
            if key not in props:
                declarations.append(decl(schema['properties'][key], value))
        declarations.append('animation-name:' + (name if trigger == 'appear' else 'none') + '!important')
        if trigger != 'appear':
            extra.append(selector + (':hover' if trigger == 'hover' else ':active') + '{animation-name:' + name + '!important;}')
    elif name == 'none':
        declarations.append('animation-name:none!important')
    rules = [selector + '{' + ';'.join(declarations) + ';}'] if declarations else []
    motion = preset or any(k.startswith('transition') or k.startswith('animation') for k in props)
    return rules + extra, motion, preset


def generate_css(schema, data):
    data = upgrade(schema, data)
    css = '/* HSK Visual Designer v2 — generated; edit the JSON in the local designer. */\n'
    needs_frames = False
    for page in page_schemas(schema):
        config = data['pages'][page['id']]
        registry = {c['key']: c for c in page.get('components', [])}
        registry.update(config['components'])
        for mode in ('desktop', 'mobile'):
            scope = page['scope'].replace('body.studio-enabled', 'body.studio-enabled:not(.mobile-ux)' if mode == 'desktop' else 'body.studio-enabled.mobile-ux')
            rules, reduced = [], []
            for key in sorted(config['styles'][mode]):
                selector = registry[key]['selector']
                selector = scope + (' ' + selector if selector else '')
                element, motion, preset = element_rules(schema, config['styles'][mode][key], selector)
                rules.extend(element)
                needs_frames = needs_frames or preset
                if motion:
                    reduced.append(selector)
            order = config['order'][mode]
            if order:
                rules += [scope + ':not([hidden]){display:flex!important;flex-direction:column!important;}', scope + '>*{order:900!important;}']
                if page['id'] == 'home':
                    rules.append(scope + '>#updateNotice{order:-1!important;}')
                for i, key in enumerate(order):
                    rules.append(scope + '>' + registry[key]['selector'] + '{order:' + str(i) + '!important;}')
            if reduced:
                rules.append('@media(prefers-reduced-motion:reduce){' + ''.join(s + '{animation-duration:0.001ms!important;animation-delay:0ms!important;animation-iteration-count:1!important;animation-play-state:running!important;transition-duration:0.001ms!important;}' for s in reduced) + '}')
            if rules:
                css += '@media ' + ('(min-width:721px)' if mode == 'desktop' else '(max-width:720px), (orientation:landscape) and (max-height:500px) and (pointer:coarse)') + '{\n' + '\n'.join(rules) + '\n}\n'
    return (schema['motion']['keyframes'] if needs_frames else '') + css


def apply_config(root, schema, data):
    """Only the managed JSON/CSS and one marked HTML link can be written."""
    original = validate(schema, data)
    data = upgrade(schema, original)
    applied = root / 'home-design.json'
    if original['schema'] == 1 and applied.exists():
        previous = upgrade(schema, json.loads(applied.read_text(encoding='utf-8')))
        previous['pages']['home'] = data['pages']['home']
        data = previous
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
                if not 0 < length <= 2000000:
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
