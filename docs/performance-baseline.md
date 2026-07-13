# Performance baseline

Measured on 2026-07-13 with `npm run build` before the final Local-first Pro optimizations.

| Metric | Baseline | Current production build |
|---|---:|---:|
| Initial application JS | not previously recorded | 338.39 kB minified / 103.89 kB gzip |
| Main CSS | not previously recorded | 57.01 kB / 10.47 kB gzip |
| PDF render chunk | not previously recorded | 1,492.89 kB / 497.32 kB gzip, lazy loaded |
| PDF.js worker | not previously recorded | 1,375.84 kB, loaded for raster preview |
| Agent Pack importer | not previously recorded | 2.62 kB / 1.21 kB gzip, lazy loaded |
| Export panel | not previously recorded | 20.95 kB / 7.73 kB gzip, lazy loaded |

The PDF renderer, PDF.js worker, ZIP importer and export panels are outside the initial application path. Grid rendering is incremental and cancellable at page boundaries. Single-page renders use a bounded 24-entry revision-aware cache.

## Budgets

- Initial application JS: no more than 375 kB minified and 115 kB gzip.
- Main CSS: no more than 65 kB minified and 13 kB gzip.
- No PDF, ZIP or Etsy implementation may move into the initial application chunk.
- Typing must not synchronously trigger a full-document render; page preview remains debounced.
- Grid mode must publish pages incrementally rather than waiting for a complete PDF.

Runtime timing (preview, 40-page grid and export) is environment-dependent and should be captured in the browser performance panel on the production domain after deployment.
