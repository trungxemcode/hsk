# Owner-supplied interface integration

Applied the three files from `C:\Users\LENOVO\hsk` to main after PR #166, not the older app shell bundled with the design. The source index only added font/design links; latest HTML, modules, routes, storage and music download behavior are retained.

Original files and working patch were backed up on the PC at `C:\Users\LENOVO\hsk-design-backup-20261023-212041`.

Raw source SHA256:
- index.html: `77B056F14BA37CB4C8BF63FAAB25FBA8AE84BE3F3A6E4D0D15CA6C15C550D255`
- redesign.css: `FDFB3E70BCBE79E0C549121263E2CB0723D231606F683E22FCA80099528391E7`
- redesign.js: `31134B19730178BD5BBB0B9795E3442BC87B28F84119E76DB45E94D0EBE66FA4`

## Integration boundaries

- Preserved design selector order, visual surfaces, layout and animations. Mechanically consolidated source tokens and fixed color/radius/shadow literals into the existing single `style.css` catalog.
- Official Inter Latin, Latin extended/pinyin and Vietnamese WOFF2 subsets, with OFL license. No Google font network dependency; Chinese retains system font fallback. All six new runtime/license assets enter the offline catalog.
- Pathway cards navigate through existing `HSKStudio.navigate`, with click, Enter and Space support; no duplicate routing implementation.
- Compatibility fixes preserve hidden mobile controls, 16px mobile form text, dock label padding, landscape safe-area rail, dark badge contrast and SRS hard-button contrast. Reduced-motion preferences retained.
- Home visual assertion now permits the owner's taller scrollable layout, while requiring the main learning CTA above the fold. No feature, accessibility or interaction checks removed. Exact palette assertions follow the requested new palette; token catalog restrictions remain enforced.
- New browser regression checks local fonts, pathway routes, both themes, reduced motion and overflow at 390/1440px. Existing functional and responsive checks remain enabled.

No Firebase, Worker, Auto50, Apps Script, API key, curriculum or account storage changes. Browser tests mock external services and cannot prove physical iPhone behavior.
