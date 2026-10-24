# Online audio deployment

The `onlineResolver` URL in `music-config.json` enables exact-ID YouTube audio playback through the single native audio adapter. Without that URL, official embeds remain available. SoundCloud, direct audio, study lessons and uploaded device files retain their existing paths. Catalogue matching and legacy conversion remain disabled. The owner-restored explicit device-save action can download the original M4A to the existing IndexedDB library; this does not create server media files.

The resolver is `online_resolver.py`, Python 3.12 + `yt-dlp[default]` (see source-requirements.txt) + Deno. Run one process, bound to 127.0.0.1:8765, with:
- `FIREBASE_API_KEY`: the app's Firebase project public API key; Firebase verifies incoming ID tokens.
- `PUBLIC_URL`: the HTTPS origin hosting this API.
- `ALLOWED_ORIGIN`: the HSK deployment origin, without a path.
- `DENO_PATH`: the installed Deno binary.
- `DENO_DIR`: writable runtime cache, e.g. `/tmp/hsk-deno-cache` under systemd PrivateTmp; no media is stored there.

Routes: GET `/api/online/health`, authenticated POST `/api/online/resolve` with `{url, refresh?}`, and short-lived opaque `/api/online/stream/{ticket}` for fallback. Resolve returns the original M4A URL, exact video ID, title/artist/duration and relay URL. Account credentials never go to YouTube. Input cannot select arbitrary sites or filesystem paths. Limit: two extraction jobs, 12 resolve requests/min/account, 20 simultaneous relay responses. Metadata/source URLs are bounded in RAM only; no server media files, transcoding or disk cache. Explicit offline saving writes only on the listener device.

Current AWS service: `/opt/hsk-music/online_resolver.py`, `/etc/hsk-music.env` (mode600), `hsk-music.service` running as ubuntu, restart-on-failure, MemoryMax500M, no new privileges, read-only system/home. Nginx `/etc/nginx/conf.d/hsk-music.conf` proxies `/api/online/` to localhost with buffering/temp files/access logs disabled, 4KB request bodies and request-rate limits. It uses the existing Plesk HTTPS certificate. Keep certificate paths in sync after Plesk renewal/reconfiguration. The current hostname is instance/IP based: if its public IP changes, update the hostname/config and verify TLS before publishing; do not assume it is a reserved static IP.

Checks: `sudo systemctl status hsk-music`, `sudo journalctl -u hsk-music -n 30`, HTTPS health endpoint. Deploy a reviewed source copy, restart the service, validate `nginx -t` before reload. Never paste SSH private keys, login tokens or playback URLs into logs/docs.

Native audio is primed during the original gesture while resolution runs, then uses the resolved M4A stream. Pause during resolution is honored. Errors first try the opaque relay; a second error refreshes the exact source; retry limits stop endless loops. Stalls also have a bounded recovery timer. Media Session, actual progress, audioSession playback and queue actions use the same persistent audio element. Route/account cleanup cancels stale work. Device tests are still required for actual iOS/Android suspension, lock-screen auto-next and Bluetooth actions. No website can continue after browser force-quit or device power-off.

Tests: `python tools/check-music-online-resolver.py`, `node --test server/music-online.test.mjs`, `node tools/check-music-aws-ui.cjs` with Playwright and a Chrome build supporting AAC. Mock-provider tests do not prove all YouTube videos/IPs work; the AWS smoke test verifies only the tested source and current IP.

Next-track source prefetch runs only after actual native playback starts, one at a time. RAM-only cache holds at most four sources and shares in-flight requests with foreground play. Original YouTube URLs remain the persisted identifiers; source expiry limits cache lifetime. Errors have a30-second background cooldown. This prefetch retrieves URLs/metadata only, not audio bytes. Expired paused sources refresh on resume.

## 2026-10-24: source diagnostics and playback expectations

The public `/api/online/health` HTTP 200 **only tests the HTTP service**.
It does not verify a YouTube source can be extracted or fetched from this
AWS IP. A 502 from authenticated `/api/online/resolve` is an upstream
extraction or compatible source error, even if health, TLS and CORS succeed.

Current extractor does **not** force yt-dlp's best format before inspecting
formats. It enumerates the returned formats, selects only original, direct
HTTPS non-DRM, audio-only M4A URLs from a trusted Google Video host, and
probes at most two sources with a 2-byte Range GET. 403/PO Token,
format-unavailable, login challenge and rate-limit errors are returned to the
authenticated client as bounded error codes. Server warnings contain only a
hash prefix of the video ID, an error code and an exception class; never
signed media URLs, access tokens or Firebase credentials. No audio data is
stored on VPS by this operation.

### Production deployment (requires authorized SSH to AWS)

The repo branch/PR alone **does not deploy** this Python source. The PWA
currently calls the existing systemd-backed AWS instance, which must be
updated separately. Before changing production, snapshot
`/opt/hsk-music/online_resolver.py` to a safe root-controlled rollback file
and verify you can access the host. Review and deploy the tested
`server/music/online_resolver.py` into `/opt/hsk-music/` without
overwriting `/etc/hsk-music.env`. Preserve service user, sandboxing and
Nginx's HTTPS reverse proxy. On the server:

```sh
sudo systemctl cat hsk-music
sudo systemctl status hsk-music --no-pager
sudo journalctl -u hsk-music -n 60 --no-pager
sudo -u ubuntu /home/ubuntu/.deno/bin/deno --version
# Find the actual yt-dlp interpreter from the systemd ExecStart path above.
# Test it with a PUBLIC, permitted source using -F, not a signed stream URL.
# <python-from-ExecStart> -m yt_dlp --ignore-config -F 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
sudo systemctl restart hsk-music
sudo systemctl is-active hsk-music
curl -fsS 'http://127.0.0.1:8765/api/online/health'
```

Then perform one authenticated playback/save test in HSK and inspect only
error **codes**, never request headers or signed stream URLs. A direct
extractor failure from VPS could be an IP restriction, PO Token enforcement,
Deno/EJS issue, or missing audio format. No generic code patch can guarantee
that an external provider grants access to every audio source. In that case,
do not spoof source success; use the provider's official player or authorized
user-supplied audio.

Native iOS background playback requires a **real playable audio source**
and still depends on OS audio-session behavior. Switching to a native
`HTMLAudioElement` does not guarantee continued playback after force-quitting
the app or when iOS suspends its PWA. Source and device tests are independent.
