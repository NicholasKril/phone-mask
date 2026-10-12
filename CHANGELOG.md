# Changelog

## 2.0.0

### Fixed
- Selection deletion and caret movement during edits in the middle of a number.
- Backspace and Delete around spaces, brackets and hyphens, including mobile beforeinput.
- Formatting being skipped after deletion; prefilled values and form resets not being synchronized.
- Shared hints between sibling fields, invisible input text and missing screen-reader hiding.
- Truncated international numbers, incorrect country rules and ambiguous +1 detection.

### Added
- International formatting and country/territory metadata from libphonenumber-js/min.
- ESM, CommonJS, self-contained browser bundles, DOM-free core and TypeScript declarations.
- Explicit defaultCountry, international/national formatting and Unicode digit normalization.
- Controllers with setValue, getValue, refresh and destroy; onChange and phonemask:change.
- IME composition, non-cancelable beforeinput fallback and independent optional hints.
- Deterministic builds, package checks, browser regression tests and multi-OS CI.
- Ukrainian README with HTML, React/Next.js, Vue/Nuxt, WordPress, Webflow, Shopify and native usage.

### Breaking changes
- Browser script now lives in dist; src is modular source code requiring a build.
- Country rules are provided by bundled metadata, increasing bundle size over v1.
- National input requires defaultCountry and stays national in the visible field.
- International grouping follows metadata; Ukraine's calling code is +380.
- data-length is advisory (15), and excess digits are retained for correction.
- Remove v1's transparent text styles and manually supplied hint elements.

## 1.0.0
- Initial release.
- Smart caret handling.
- Country detection.
