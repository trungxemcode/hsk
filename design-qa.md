# Music sheet source fidelity QA

Source: supplied music-browse(1).zip/index.html and owner images 233242 (library), 233304 (options). Existing application, not a new prototype.
Implementation: C:/tmp/music-menu-fixed-library-{390,430,820,1440}.png and C:/tmp/music-menu-fixed-quick-{390,430,820,1440}.png, captured with Playwright Chromium on the authorized Windows device.
Viewports: 390, 430, 820, 1440 x 844 CSS pixels; deviceScaleFactor 1. Owner target images show 520px panels; implementation uses the same 520px maximum and shrinks to the mobile viewport. Compare panel content, excluding phone chrome. Source ZIP review screenshots include earlier revisions; current index.html plus owner images are authoritative.

Findings and iteration history:
- P1: double gutters, oversized track header and inconsistent rows. Ported source typography, 32px handle, 52px heading, 48px main actions, 44px cover, 12px body gutters, rounded library groups. Rechecked final browser captures.
- P2: duplicate legacy summary chevrons. Removed CSS pseudo-chevron, retained source SVG and its open-state rotation. Browser assertion covers a single 48px summary with 13px text.
- P1: separate per-row animations with repeated layout reads. Replaced by one cancellable body animation; uses source 220ms timing and 14px translation. Closing retains current view geometry until next open.
- P1: drag capture on action controls. Sheet drag ignores action controls; buttons retain their handlers and source icons.
- P1 found during regression: cancelling all body animations could cancel inherited visibility transitions and blank the sheet. Track only the owned WAAPI animation; no CSS transition on body. Reopen and all functional view tests pass after correction.
- P2: stale transient playback status styled as a pill. Reserve source 18px status space, remove pill decoration and hide transient notices visually while retaining live-region content.

Required fidelity surfaces:
- Typography: exact source system font stack; 16px/650 heading, 14.5px/600 main actions, 13px/600 library summary, 12px metadata. Forms retain 16px inputs for iOS zoom prevention.
- Layout: source single scroll container, fixed heading, mobile safe-area padding and desktop floating panel; no page horizontal overflow at tested widths.
- Color: existing source-mapped mb palette; opaque sheet and scrim, transparent action rows, muted SVG icons, selected pill border and checkmark.
- Assets: supplied SVG paths copied directly for actions, source chevrons, existing real artwork kept. Fixture screenshots intentionally use fixture artwork; no production artwork/data replaced.
- Copy: app labels and real playlist names preserved. Track names, counts and extra owner-only actions differ from the demonstration by real account/catalogue state.

Primary interactions: create playlist, expand playlist, quick assign/unassign, multi-select save, personal link form, owner YouTube/file tabs, back/Escape/focus return, native AAC continuing through sheet navigation. Console page errors checked by UI tests (none). Background/MediaSession, queue motion, delete authorization and feature runtime passed.

Physical iPhone frame pacing and lock-screen playback were not measured; no physical-device smoothness claim. Remaining P3: system font rasterization varies by platform.

final result: passed
