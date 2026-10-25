# Current task: admin import to R2 + personal YouTube links

Base main61de982 (3.17.1). User confirmed R2 audio background works on their phone. User requested admin-only library imports using successful yt-dlp Actions test, while all listeners retain personal YouTube links and R2 background audio.

3.18.1 candidate: private R2 queue; Firebase owner create/status/upload; GitHub Actions signature-verified OIDC claim/complete/fail; scheduled/manual runner with YTB_Cookies, no PAT; visible progress states. All listeners can play/save personal official YouTube embeds, actual progress/seek/playlist, best-effort route persistence. Native R2 audio kept. No app-side downloader or VPS changes.

Validation: 275 server tests, new role/OIDC/queue tests and UI, R2 background tests, feature runtime; complete results in PR. Main merge needed for scheduled import runner; live end-to-end verification pending deployment. Queue scans first1000 records; owner-scale pilot. No cookies/secrets in source or logs.
