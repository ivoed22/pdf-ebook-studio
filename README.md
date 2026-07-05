# PDF Ebook Studio

A local-first web app that turns prepared Markdown content and images into premium, sellable A4 PDF ebooks and digital magazines — plus complete Etsy-ready digital product packs. No AI APIs, no backend: everything runs in your browser and your content never leaves your computer.

**Live app:** https://ivoed22.github.io/pdf-ebook-studio/

## Product types

- **Recipe ebooks** — ingredients, steps, prep/cook times, difficulty, nutrition
- **Interior inspiration magazines** — concepts with palettes, materials, design notes
- **Exterior inspiration magazines** — garden/facade concepts, planting and maintenance notes
- **General ebooks / guides** — chapters, checklists, workbook pages, key takeaways

## v2 highlights

- Bilingual app UI (Dutch/English toggle) — ebook content languages remain separate
- Undo/redo with keyboard shortcuts, autosave indicator
- Dashboard with live cover thumbnails, search, sort, duplicate, paste-Markdown import
- Page list with drag & drop reordering and mini page thumbnails
- Visual template picker with layout schematics for all 66 templates
- Per-image crop focus control (top/bottom/left/right/center)
- QC auto-fix: one click repairs page numbering, image matches, HEX colors, unused images
- All-pages grid preview with instant render cache
- Etsy listing images: four 2000×2000 marketing visuals composed from your real pages

## Workflow

1. Create a project (or import structured Markdown / project JSON, or load a sample).
2. Pick product type, Dutch and/or English versions, and a theme.
3. Upload images (files or a ZIP) — they match to pages by filename (`page-01-cover.jpg`).
4. Edit pages in the schema-driven editor with a live PDF preview (what you see *is* the export).
5. Run QC: missing fields, missing/unused images, invalid HEX colors, page numbering, overflow risk.
6. Export: final vector PDF, page previews, contact sheet, Customer ZIP, or the full Seller / Etsy Listing Pack (with listing title/description/tags and QC reports).

Dutch and English versions export as separate files; languages are never mixed on a page.

## Tech

Vite + React + TypeScript · Tailwind CSS · Zustand · Zod · @react-pdf/renderer (vector PDF) · pdfjs-dist (preview/rasterizing) · JSZip · IndexedDB (idb)

Templates are config-driven: `src/data/templates/starter-template-pack-expanded-v2.json` defines 66 template IDs mapped onto shared base renderers in `src/pdf/renderers.tsx` (see `RENDERER_MAP` in `src/core/templates/registry.ts`).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploy

Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`.

## Documentation

The original requirements pack (input format, image naming rules, acceptance criteria) lives in `docs/`.
