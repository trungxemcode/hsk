# Module refactor — candidate 3.4.16

Base: main `203559c8dbf0f9e4826b85b5cceac9d72a611b07`. Isolated branch `refactor/modules-and-app`; no main merge or production deployment in this task.

## Result

- Relocated 52 feature JS files into 16 feature groups, alongside the existing backup group. Implementation bytes match their original Git files. Account and study-sync remain together for their CommonJS dependency.
- Relocated 10 learning packs, with both JS and gzip variants (20 files), to `content/data/`, unchanged. Updated consumers, generators, tests, feature contracts and workflow path filters. Maintained 5,011 vocabulary entries, 146 lessons and existing learning keys.
- Extracted dictionary rendering, synonym/sense handling, text utilities and formatting into four ordered classic scripts. `app.js`: 113,690 → 88,989 bytes, a 21.7% reduction in this file. Remaining app code and extracted helper bodies were compared with the base; only their location changed and the previously inert strict-mode string was removed to preserve execution mode. This is not a claim that the total download or startup time fell 21.7%.
- Kept all 159 previous offline asset paths through their current destinations, plus four helpers (163 assets). Retained root workers/config/platform URLs, CSS, global APIs, storage, SRS and data augmentation order. Installer validates hashes before reusing old-URL cache bytes; aliases support old requests.

## Verification

| Check | Result |
| --- | --- |
| Full server tests | 237 passed; no skips/failures |
| Feature-preservation Python tests | 19 passed |
| PWA guard/catalog Python tests | 22 passed |
| Preservation gate | 45 groups, 171 guards |
| Content/learning keys | 5,011 words, 146 lessons passed |
| Offline manifest |163 assets; deterministic rebuild |
| Node DOM/browser checks used by CI | 51 passed across the run and the focused rerun |

The first 44 Node checks passed before the image repair. Studio then found a baseline empty-image defect. After repair, the deterministic image check, Studio and all remaining checks passed. No assertions were removed, skipped or relaxed. Source changes after these checks were documentation only.

Browser coverage includes `/hsk/` URL bases; gzip/no-DecompressionStream/corrupt-gzip fallback; helper load order; real search/comparison; actual handwriting-worker readiness; account/sync isolation; backup/reload; all 146 lesson views; placement, SRS, practice/exams, notebook, light/dark layouts and touch navigation. The actual offline-worker runs with small synthetic assets to verify waiting/explicit activation, verified old-path cache reuse (including gzip), aliases, fresh install and offline reload without changing progress.

## Baseline image defect found by full UI testing

Both existing page 10 entries contained only `data:image/webp;base64,` on main. A random exam selection could therefore time out waiting for image width. Restored exactly the two entries, retaining all other image values, and kept `drive-exam-data.json.gz` byte-identical (question IDs, source metadata and answers unchanged).

| Source | PDF page | Original recorded PDF SHA256 |
| --- | --- | --- |
| H11330 | 10 (index 9) |`a6545eba85b384557d09d08416aa6e2e66e61b643e645da5330c208ec17b56f5` |
| H11003 | 10 (index 9) |`57a8b0dfa770c152455b880db87d2415780949601efbb963166adf5423c4a15f` |

Downloaded source PDFs matched these hashes. Rendered with the original 1.65 scale / quality 88 WebP settings and visually checked both full pages (983×1390). The importer now decodes/validates all source image bytes before publishing any packs. A server regression rejects empty/truncated WebP; Chromium decodes all 52 packed pages and deterministically opens/zooms both repaired pages in the actual app.

## Boundaries

External AI/auth transports are mocked; no paid provider traffic or real learner data was used for tests. Chromium coverage is not a physical iPhone test. Main, GitHub Pages, the live Cloudflare Worker, Apps Script, Sheets and auto voice remain untouched. CI must pass and the owner must authorize merge before release. Do not deploy main's older standalone Worker over the newer independent live voice implementation.
