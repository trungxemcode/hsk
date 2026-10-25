# Music startup performance

Target: iPhone 11 or newer and Android devices with at least 4 GB RAM, using a supported up-to-date browser. No hardware/UA gate or removal of existing controls. Hardware compatibility requires real-device verification; CPU throttling does not simulate RAM or iOS background suspension.

## Controlled before/after

Fresh Chromium contexts, local server, CPU throttled4x, all study gzip fetches delayed2500ms, 390px/1440px viewport. Previous loader (PR200 before optimization): music available7597ms/7659ms, after study readiness. New independent load runs: approximately1284–1731ms, before study readiness (about80% lower in this artificial scenario). Cached catalogue DOM population approximately3–5ms; two-frame interface marker approximately144–212ms. These are lab observations, not guarantees for live networks or phones. API response in the test is deliberately gated; catalogue-network timing is not a live service latency measurement.

## Diagnostics

Browser console: `HSKMusicPerf.report()`. Timings include module-load, open-interface (two animation frames), catalog-cache and catalog-network. Long tasks: last20 durations while on the music route, where supported; optional API absence is tolerated. No queries, titles, auth tokens or analytics requests are recorded. Study initialization can still create long tasks while data is parsed; this change makes music available independently rather than claiming all main-thread work is eliminated.

## Cache and limits

Only published catalogue metadata is cached, endpoint-scoped, schema1, 24hours, up to500rows and768000characters. Same-origin audio URL and hash ID validation applies to both network and cache. Invalid/expired cache is ignored; network failure keeps a valid cached list with a clear status. Audio files are never cached here; this does not create offline playback. Deletion updates the cache. Storage quota errors are nonblocking.

## Verification

`check-music-startup-ui.cjs`: slow study packs, real home-button entry before study readiness, cached list before network response, same native audio across network/study completion, one fetch per preloaded script, cache origin/expiry/network failure, optional PerformanceObserver absence. `check-module-loading-ui.cjs`: /hsk/ paths, gzip, missing DecompressionStream, broken gzip, helper order,5011words, real dictionary and handwriting worker. Existing AI overlay, native background and feature-runtime tests remain enabled.

WebKit Windows26 smoke tests cover loader/cache/DOM lifecycle only: its native media decoder returned error4 for the audio fixture. Real AAC playback remains required in Chromium; iPhone codec/background behavior is not claimed from this smoke test. Explicit early account/navigation must survive study initialization.

Final Windows Chromium run (4x CPU throttle): music available2403ms/2832ms, cache DOM2.9–3.7ms; actual AAC playback continues across catalogue refresh and study completion. Machine results vary; the Linux before/after comparison above uses a separate controlled environment. Failed WebKit preload retries use a cache-busting attempt URL only after a script error. Planner reload tests now wait for study/plan readiness because early home readiness is deliberately independent. All original route/plan assertions remain.
