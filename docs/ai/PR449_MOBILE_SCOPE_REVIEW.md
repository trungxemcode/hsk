# PR #449 — Mobile design audit: visual-scope review (pending owner approval)

## Base and requested work
- Original `main` baseline: `3a1cab882035426e154d55afc8d1c9991b43d895` (PR #448 merge).
- PR branch original head: `5716224eea9895e19a42a121b1800b3e5d5883d8`.
- Intended work: mobile visual and interaction polish across the app at 390px; desktop at 1440px must stay visually unchanged.
- `.github/ui-scope.json` still describes **Home + Lessons** from #448. This does NOT constitute approval for PR #449's broad mobile design changes.

## Actual visual diff before corrections
- GitHub Actions run: https://github.com/trungxemcode/hsk/actions/runs/44748725178
- 390px light screenshots & diffs: https://github.com/trungxemcode/hsk/actions/runs/44748725178/artifacts/14634791315
- 390px dark screenshots & diffs: https://github.com/trungxemcode/hsk/actions/runs/44748725178/artifacts/14634950932
- All 24 routes changed in **both** light and dark: home, lessons, practice, search, ai-qa, sentence-editor, learn, quiz, srs, mistakes, compare, notebook, match-game, sentence-game, study4, real-reading, exam, music, music-play, translator, account, profile, about, admin.
- 1440px light and dark visual comparisons passed. The mobile failures are genuine pixel differences, not missing tests or a tool outage.

## Real regressions corrected on this branch
- Restore Home search→Daily Word spacing to 12px, matching the existing responsive test instead of relaxing its invariant.
- Preserve the original compact, rounded Music Queue Library button by excluding it from the new generic mobile button-radius override; mobile/desktop music interaction tests pass.
- Replace hard-coded radius/colors in new mobile CSS with shared semantic tokens (new mobile colors centralized in `style.css`); design-token validation passes.
- Keep all original visual and feature safety checks active. Do not rewrite baseline screenshots or disable CI gates.

## Merge gate
This is a **global mobile UI change affecting all 24 captured routes**. A green local browser smoke test alone does not authorize broad new visual baselines. Review the light/dark screenshots for all changed screens and obtain **explicit owner approval of this exact scope** before recording an approved baseline checkpoint. Until then the original main-baseline comparison must remain strict and the PR must **not merge**.
