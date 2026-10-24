"""Online-only YouTube audio resolver/optional bounded relay. No media files."""
import hashlib
import json
import os
import re
import secrets
import threading
import time
from collections import OrderedDict, deque
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs
from urllib.request import Request, urlopen

ORIGIN = os.environ.get('ALLOWED_ORIGIN', 'https://trungxemcode.github.io')
PUBLIC = os.environ.get('PUBLIC_URL', '').rstrip('/')
API_KEY = os.environ.get('FIREBASE_API_KEY', '')
lock = threading.RLock()
cache, identities, sessions, rates = OrderedDict(), OrderedDict(), OrderedDict(), OrderedDict()
pool = ThreadPoolExecutor(max_workers=2)
extract_slots = threading.BoundedSemaphore(2)
relay_slots = threading.BoundedSemaphore(20)

class ResolverError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message

def video_id(url):
    u = urlsplit(url)
    if u.scheme != 'https' or u.username or u.password or u.port or u.fragment:
        raise ValueError('Link YouTube HTTPS chưa hợp lệ.')
    host = (u.hostname or '').lower()
    if host == 'youtu.be': value = u.path.strip('/')
    elif host in ('youtube.com', 'www.youtube.com', 'music.youtube.com'):
        value = parse_qs(u.query).get('v', [''])[0] if u.path == '/watch' else u.path.split('/')[-1] if u.path.startswith(('/shorts/', '/embed/', '/live/')) else ''
    else: value = ''
    if not re.fullmatch(r'[\w-]{11}', value, flags=re.ASCII):
        raise ValueError('Chọn link một video YouTube, không phải playlist.')
    return value

def audio_url(value):
    u = urlsplit(value)
    return u.scheme == 'https' and not u.username and not u.password and u.port in (None, 443) and (u.hostname or '').endswith('.googlevideo.com')

def trim(mapping, count):
    while len(mapping) > count: mapping.popitem(last=False)

def authenticate(authorization):
    if not authorization.startswith('Bearer ') or len(authorization) > 12000:
        raise ResolverError(401, 'Đăng nhập HSK để phát nhạc nền từ YouTube.')
    token = authorization[7:]
    digest = hashlib.sha256(token.encode()).hexdigest()
    with lock:
        hit = identities.get(digest)
        if hit and hit[0] > time.time(): return hit[1]
    if not API_KEY: raise ResolverError(503, 'Dịch vụ chưa được cấu hình đăng nhập.')
    try:
        req = Request('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + API_KEY,
                      data=json.dumps({'idToken': token}).encode(), headers={'Content-Type': 'application/json'})
        with urlopen(req, timeout=8) as r: user = json.load(r)['users'][0]
        if user.get('disabled') or not user.get('localId'): raise ValueError()
    except Exception as e: raise ResolverError(401, 'Phiên đăng nhập hết hạn. Đăng nhập lại rồi thử phát.') from e
    with lock:
        identities[digest] = (time.time() + 60, user['localId']); trim(identities, 256)
    return user['localId']

def rate_limit(uid):
    now = time.time()
    with lock:
        history = rates.setdefault(uid, deque())
        while history and history[0] < now - 60: history.popleft()
        if len(history) >= 12: raise ResolverError(429, 'Bạn đổi bài quá nhanh. Chờ một chút rồi thử lại.')
        history.append(now); rates.move_to_end(uid); trim(rates, 512)

def extract(ident):
    import yt_dlp
    opts = {'quiet': True, 'no_warnings': True, 'skip_download': True, 'noplaylist': True,
            'cachedir': False, 'socket_timeout': 10, 'retries': 0, 'extractor_retries': 0,
            'js_runtimes': {'deno': {'path': os.environ.get('DENO_PATH', '/home/ubuntu/.deno/bin/deno')}},
            'format': 'bestaudio[ext=m4a][protocol=https]/bestaudio[ext=m4a]'}
    with yt_dlp.YoutubeDL(opts) as y:
        data = y.extract_info('https://www.youtube.com/watch?v=' + ident, download=False)
    if data.get('id') != ident or data.get('is_live') or not 0 < float(data.get('duration') or 0) <= 7200:
        raise ValueError('Nguồn không khớp hoặc là livestream/quá 2 giờ.')
    if not audio_url(data.get('url', '')) or data.get('ext') != 'm4a':
        raise ValueError('Chưa có luồng M4A tương thích cho bài này.')
    return {'id': ident, 'url': data['url'], 'title': str(data.get('title') or '')[:120],
            'artist': str(data.get('artist') or data.get('uploader') or 'YouTube')[:80],
            'duration': data['duration'], 'headers': data.get('http_headers', {})}

def resolve(ident, refresh=False):
    with lock:
        hit = cache.get(ident)
        if not refresh and hit and hit[0] > time.time(): return hit[1]
    if not extract_slots.acquire(blocking=False):
        raise ResolverError(429, 'Đang mở nhiều bài cùng lúc. Thử lại sau vài giây.')
    def task():
        try: return extract(ident)
        finally: extract_slots.release()
    future = pool.submit(task)
    try: data = future.result(timeout=35)
    except TimeoutError as e: raise ResolverError(504, 'Nguồn nhạc phản hồi chậm. Chạm Phát để thử lại.') from e
    except Exception as e: raise ResolverError(502, 'YouTube chưa cung cấp được audio cho bài này. Thử lại sau hoặc mở trang nguồn.') from e
    with lock:
        cache[ident] = (time.time() + 120, data); trim(cache, 128)
    return data

class Handler(BaseHTTPRequestHandler):
    server_version = 'HSKMusic'
    def log_message(self, *_): pass  # Never log bearer tokens or playback URLs.
    def origin_ok(self): return self.headers.get('Origin', '') in ('', ORIGIN)
    def headers_out(self, status, mime='application/json', extra=None):
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if self.headers.get('Origin') == ORIGIN:
            self.send_header('Access-Control-Allow-Origin', ORIGIN)
            self.send_header('Vary', 'Origin')
        for name, value in (extra or {}).items(): self.send_header(name, str(value))
        self.end_headers()
    def json(self, status, data):
        blob = json.dumps(data).encode()
        self.headers_out(status, extra={'Content-Length': len(blob)})
        self.wfile.write(blob)
    def do_OPTIONS(self):
        if not self.origin_ok(): return self.json(403, {'error': 'Origin không được phép.'})
        self.headers_out(204, extra={'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, Range', 'Access-Control-Max-Age': '600'})
    def do_POST(self):
        try:
            if self.path != '/api/online/resolve': return self.json(404, {'error': 'Not found'})
            if not self.origin_ok(): return self.json(403, {'error': 'Origin không được phép.'})
            uid = authenticate(self.headers.get('Authorization', '')); rate_limit(uid)
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 4096: return self.json(400, {'error': 'Yêu cầu chưa hợp lệ.'})
            payload = json.loads(self.rfile.read(size))
            ident = video_id(payload['url'])
            data = resolve(ident, payload.get('refresh') is True)
            ticket = secrets.token_urlsafe(32)
            with lock:
                sessions[ticket] = (time.time() + 1800, data); trim(sessions, 256)
            self.json(200, {k: data[k] for k in ('id', 'url', 'title', 'artist', 'duration')} |
                      {'expiresAt': int((time.time() + 120) * 1000), 'relayUrl': PUBLIC + '/api/online/stream/' + ticket})
        except ResolverError as e: self.json(e.status, {'error': e.message})
        except (ValueError, TypeError, KeyError): self.json(400, {'error': 'Link hoặc yêu cầu chưa hợp lệ.'})
        except (BrokenPipeError, ConnectionResetError): pass
        except Exception: self.json(500, {'error': 'Dịch vụ đang bận. Thử lại sau.'})
    def do_GET(self):
        if self.path == '/api/online/health': return self.json(200, {'ok': True, 'mode': 'online-only'})
        prefix = '/api/online/stream/'
        if not self.path.startswith(prefix) or not self.origin_ok(): return self.json(404, {'error': 'Not found'})
        with lock: item = sessions.get(self.path[len(prefix):])
        if not item or item[0] < time.time(): return self.json(410, {'error': 'Link phát hết hạn.'})
        byte_range = self.headers.get('Range', '')
        if byte_range and not re.fullmatch(r'bytes=\d*-\d*', byte_range): return self.json(416, {'error': 'Range chưa hợp lệ.'})
        if not relay_slots.acquire(blocking=False): return self.json(503, {'error': 'Đang có nhiều người nghe.'})
        try:
            data = item[1]; headers = dict(data['headers'])
            if byte_range: headers['Range'] = byte_range
            with urlopen(Request(data['url'], headers=headers), timeout=15) as upstream:
                # Redirects are not expected for extracted googlevideo media URLs.
                if not audio_url(upstream.url): return self.json(502, {'error': 'Nguồn audio không hợp lệ.'})
                extra = {k: upstream.headers[k] for k in ('Content-Length', 'Content-Range', 'Accept-Ranges') if k in upstream.headers}
                self.headers_out(upstream.status, 'audio/mp4', extra)
                total = 0
                while total < 160 * 1024 * 1024:
                    chunk = upstream.read(65536)
                    if not chunk: break
                    self.wfile.write(chunk); total += len(chunk)
        except (BrokenPipeError, ConnectionResetError, TimeoutError): pass
        except Exception: pass  # A truncated response makes the audio adapter re-resolve.
        finally: relay_slots.release()

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('PORT', '8765'))), Handler).serve_forever()
