# Current task: R2 music rebuild

Base: merged main82431c4 (3.16.2). Owner requested removing entertainment offline/yt-dlp/VPS and uploading own music to Cloudflare R2.

Implemented candidate3.17.1: R2 Worker catalogue/range streaming/owner-only uploads; native persistent audio with MediaSession/progress; playlists choose catalogue; removed download/extractor/codec/browser handoff code. Study music, account storage and cleanup preserved. Old audio data is not auto-deleted.

Blockers: R2 not enabled (Cloudflare10042); cannot create real bucket/deploy or populate music. music-config.cloudEndpoint blank pending actual URL. Separate removal-only PR189 requires owner review/merge per AGENTS before code-removal PR targets main. No production cutover or AWS resource deletion.

Checks: server unit tests and browser suites (see implementation PR for final results). Device lock-screen validation still required; no guarantee after force quit/power off.
