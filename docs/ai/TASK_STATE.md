# Current task: compact music menu UX

Base main9322ad9, live3.18.1. Admin YouTube→GitHub Actions→R2 is verified by run40163262374; importer User-Agent fix #192 merged. User confirmed native R2 background playback on phone.

3.18.2 candidate: main sheet has short actions instead of stacked forms; personal links and owner library imports use subviews, admin YouTube/File tabs, collapsed optional metadata, readable dark labels/white action text, inline personal errors, no stale loading status. Existing playback, queue and owner restrictions are preserved.

Checks: menu/import/native background UI390/1440, feature runtime390/1440, music DOM, token catalog and feature preservation53capabilities/235guards. Screenshots inspected locally. PR/release status should be checked on GitHub before resuming.

Smart music imports (3.18.2): owner import prefills the current YouTube URL. Debounced owner-only oEmbed lookup provides title/channel; existing lesson AI extracts only credits evidenced in the title, never treating channel as performer. Manual edits survive late responses; account changes abort/reset lookup. Composer persists through runner/R2 catalogue. Lookup failure remains nonblocking. Smart UI and metadata authorization tests cover these paths.
