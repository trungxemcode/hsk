# PR #449 — Mobile design audit: approved visual-scope review

## Base and approved work
- Original `main` baseline: `3a1cab882035426e154d55afc8d1c9991b43d895` (PR #448 merge).
- Approved immutable design checkpoint: `7f9f03308f94488fef3d07fb1bb34e07beb78008`.
- Owner instruction on 2026-11-20: “thế fix để merge đi”, in response to the explicit question about approving the 24-route mobile scope. This is recorded as authorization to proceed with the stated scope.
- Intended work: mobile visual and interaction polish across all 24 app routes at 390px; desktop at 1440px must stay visually unchanged.
- `.github/ui-scope.json` still describes **Home + Lessons** from PR #448 and is not used to bypass or reduce PR #449 coverage.

## Actual visual evidence
- Earlier visual run: https://github.com/trungxemcode/hsk/actions/runs/44748725178
- 390px light screenshots & diffs: https://github.com/trungxemcode/hsk/actions/runs/44748725178/artifacts/14634791315
- 390px dark screenshots & diffs: https://github.com/trungxemcode/hsk/actions/runs/44748725178/artifacts/14634950932
- All 24 routes changed in **both** mobile themes: home, lessons, practice, search, ai-qa, sentence-editor, learn, quiz, srs, mistakes, compare, notebook, match-game, sentence-game, study4, real-reading, exam, music, music-play, translator, account, profile, about, admin.
- 1440px light and dark comparisons passed in the prior run. The mobile differences are real intended design changes, not missing tests or a runner outage.

## Regressions corrected on this branch
- Restore Home search→Daily Word spacing to 12px, matching the existing responsive test instead of relaxing its invariant.
- Preserve the original compact, rounded Music Queue Library button by excluding it from the generic mobile button-radius override; mobile/desktop music interaction tests pass.
- Replace hard-coded radius/colors in the mobile CSS with shared semantic tokens; new mobile colors are centralized in `style.css`.
- Keep feature preservation and all visual safety checks active.

## Approval checkpoint and merge gate
- `.github/ui-global-approval.json` records this PR's owner authorization, original main SHA, immutable approved checkpoint, all 24 routes, and all four scenarios.
- CI still captures original `main` for before/after audit evidence, then strictly compares the final PR head against the immutable approved checkpoint across **all 24 routes** in 390-light, 390-dark, 1440-light, and 1440-dark.
- The final head must have identical route geometry and visual pixels to the approved checkpoint. Missing reports, changed pages, stale checkpoints, or incomplete scenarios still fail.
- No baseline snapshots are rewritten, no routes are excluded, and no CI job or required check is disabled.
