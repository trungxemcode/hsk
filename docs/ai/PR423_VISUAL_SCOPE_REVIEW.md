# PR #423 — Visual scope review (owner approval required)

**Do not merge/deploy until the owner reviews this global design scope.**
This branch keeps the requested global typography design. The existing UI-outside-scope CI remains mandatory; no route, baseline image, pixel threshold, or geometry check was excluded or weakened.

## Evidence from GitHub CI head 5d06292

| Scenario | UI states | DOM nodes | Font-family changes | Font-size changes | Position/size changes | Newly out-of-viewport measured elements |
|---|---:|---:|---:|---:|---:|---:|
| 390 light | 24 | 4791 | 4747 | 724 | 1399 | 0 |
| 390 dark | 24 | 4791 | 4747 | 724 | 1399 | 0 |
| 1440 light | 24 | 8195 | 8147 | 96 | 1902 | 0 |
| 1440 dark | 24 | 8195 | 8147 | 96 | 1902 | 0 |

These counts come from actual before/after geometry JSON. The original image comparisons still FAIL 24 protected states in each scenario. No new measured viewport overflow is not proof of visual approval or complete clipping coverage.

Reviewed routes/states (all 24): about, account, admin, ai-qa, compare, exam, home, learn, lessons, match-game, mistakes, music, music-play, notebook, practice, profile, quiz, real-reading, search, sentence-editor, sentence-game, srs, study4, translator.

Original CI review artifacts (not modified):
- [390 light](https://github.com/trungxemcode/hsk/actions/runs/43535583600/artifacts/14089526676)
- [390 dark](https://github.com/trungxemcode/hsk/actions/runs/43535583600/artifacts/14088959476)
- [1440 light](https://github.com/trungxemcode/hsk/actions/runs/43535583600/artifacts/14088454599)
- [1440 dark](https://github.com/trungxemcode/hsk/actions/runs/43535583600/artifacts/14088349878)

## Intended design — review before approval

- Global CSS font alias Inter -> HSK Sans while keeping existing local Inter font file sources. Smaller labels gain readability, e.g. 11.5px -> 12px; cards, typography, mobile and desktop content can reflow.
- Local changes also affect Home, Lessons, practice/quiz, AI Q&A, Music, handwriting/sentence editor, OCR/translation, layout spacing and some motion. This is **not a topbar-only PR**, despite the original branch name.
- Legitimate global design changes must be explicitly approved per affected route, including all mobile and dark-mode states, before describing them as in scope.

## Concrete regression fixed on the branch

Mobile panel-box/activity-panel/hub-panel added an unnecessary 8px inset per side on top of the existing 16px workspace gutter: on a 390px device, interior content narrowed from 358px to 342px, causing extra wrapping on Exam/Lessons/Quiz. Restored padding:16px 0 while retaining the new typography and the 16px workspace gutter. Extended the existing browser check-redesign-ui.cjs to assert 16px left/right alignment, no duplicate panel padding and no horizontal scroll on Lessons, Quiz and Compare at 320/390px in light and dark mode. Existing design checks remain.

The prior commit also fixed actual dark-mode contrast failures in comparison examples and grammar warning notes.

## Review and merge gates

1. Owner checks before/after visuals and **approves or requests corrections** to the complete global typography/layout scope. If some screens are not intended, split/revert them; do not exempt unrelated routes.
2. Preserve original CI visual baselines and require evidence that intended changes are distinguished from true regressions; do not turn off UI-outside-scope, reset snapshot baselines, or exclude all affected routes.
3. Retest keyboard, iPhone-safe mobile layouts, AI composer visibility, overflow, 17-route dark-mode contrast, music, PWA integrity, server functionality and all affected pages.
4. Merge only on a fresh head with all required workflows SUCCESS and conflict-free; verify GitHub Pages and Cloudflare Editor deploy. Production AI/translator Worker is not part of this PR.


## Owner confirmation and strict post-approval CI (2026-11-14)

The owner explicitly approved the **entire PR #423 global typography and responsive layout design scope**, pinned to `86ce51e29f3e6f22ac43293aa5de712806fa1605`. This approval does not excuse new regressions.

- Original main merge-base remains `fdc2d360ad50458721f3349e79484da2c818e48a` and is captured at every viewport/theme and route as `*-baseline-*.png` and geometry.
- The immutable approved checkpoint is an additional reference, **not a replacement baseline**, pixel threshold change, disabled test, or blanket route exclusion.
- Head and approved checkpoint must match on all **24 routes × four viewport/theme scenarios = 96 protected states**, in both computed geometry and the existing pixel check.
- The original main-to-approved differences remain measured and preserved in each CI artifact for audit, while new changes after approval still fail a strict gate.
- Other PWA, frontend safety, feature, iPhone layout and Studio tests remain mandatory. No AI/translation Worker deployment is authorized here.

- This one-time approval only activates for PR #423. After merge, future PRs retain the unchanged main-to-head visual gate; no persistent exemption is inherited.

- Approved-reference worktree is prepared from the pinned SHA by the existing visual-guard script. The GitHub Actions workflow itself remains byte-for-byte unchanged and its four scenarios and gate are intact.
