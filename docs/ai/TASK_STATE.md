# Current task: compact music menu UX

Base main9322ad9, live3.18.1. Admin YouTube→GitHub Actions→R2 is verified by run40163262374; importer User-Agent fix #192 merged. User confirmed native R2 background playback on phone.

3.18.2 candidate: main sheet has short actions instead of stacked forms; personal links and owner library imports use subviews, admin YouTube/File tabs, collapsed optional metadata, readable dark labels/white action text, inline personal errors, no stale loading status. Existing playback, queue and owner restrictions are preserved.

Checks: menu/import/native background UI390/1440, feature runtime390/1440, music DOM, token catalog and feature preservation53capabilities/235guards. Screenshots inspected locally. PR/release status should be checked on GitHub before resuming.

Smart music imports (3.18.2): owner import prefills the current YouTube URL. Debounced owner-only oEmbed lookup provides title/channel; existing lesson AI extracts only credits evidenced in the title, never treating channel as performer. Manual edits survive late responses; account changes abort/reset lookup. Composer persists through runner/R2 catalogue. Lookup failure remains nonblocking. Smart UI and metadata authorization tests cover these paths.

3.18.3 candidate: current R2 track menu exposes owner-only delete with confirmation. POST /api/admin/tracks/{sha256.mp3|m4a}/delete verifies Firebase fixed owner, validates audio key and published object, then deletes only that R2 object. UI clears current audio and refreshes local catalogue views after success. Personal history/playlists remain intact (old references become unavailable); previously buffered/cached bytes cannot be remotely revoked. Server and phone/desktop UI tests cover listener denial, cancellation and deletion.

Music name search candidate: public bounded/cached YouTube search through Worker, no cookies. Listener results play/save personal links; owner results prefill existing import, preserving owner-only publication. YouTube HTML parser may need maintenance; upstream failure has explicit link fallback.

Native-only correction: personal YouTube/search selections never mount a YouTube player. Exact video-ID provenance from R2 sourceUrl routes to persistent audio. Unpublished links save personal context and show explicit pending-import status without interrupting current audio. Owner import prefill uses selected source context. Legacy personal embed entry is blocked; no transparent/hidden iframe workaround. Real physical phone background behavior still needs device verification.

Import throughput: prefer source M4A/AAC and publish M4A to avoid MP3 re-encoding when possible; fallback sources transcode to AAC. Fragment concurrency4. Each workflow drains up to3 jobs sequentially with one setup, fresh signed claims per job; no extra fourth claim/lease. Schedule still roughly5min and GitHub can delay it. No dispatch credential added.

Strict no-YouTube-UI instruction also covers study lesson playback: YouTube lesson sources resolve exact video-ID R2 audio through a native adapter, preserving text/segment controls. No YT.Player constructor or iframe API loading remains active. Missing library audio has explicit status instead of embed fallback.

Artwork-only correction: derive R2 track thumbnails from existing sourceUrl video ID for cover, list, mini player, playlist and queue; use default art if source/image missing. Audio routes, playback events, media controls, importer and backend are unchanged.

Music visual polish only: transparent shared header, bounded browse grid for long titles, plain empty/status text, readable queue typography and compact playlist/peek actions. Scoped CSS overrides obsolete redesign surfaces. No application JS, source resolution, audio events or import/backend changes. Surface screenshots390/1440 and playback regression checks cover this update.

Queue interaction polish: measure the visible launcher as sheet origin (bottom inset, width and collapsed translation), keep it during drag/release/cancel. Only queue presentation/gesture functions change; playback and source resolution stay identical. Compact personal/admin search/actions and transparent subheader/optional fields. Browser touch-event checks390/1440 verify finger tracking and anchor geometry, cancel, form sizing and uninterrupted audio.
