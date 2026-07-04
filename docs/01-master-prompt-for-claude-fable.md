# MASTER PROMPT FOR CLAUDE / FABLE 5

Build a production-ready web app called **PDF Ebook Studio**.

## Goal
The app creates professional, sellable PDF ebooks and digital magazines for:
1. Recipe ebooks
2. Interior inspiration magazines
3. Exterior inspiration magazines
4. General ebooks / guides

The app must work WITHOUT AI API integration. The user prepares text and images outside the app, imports them, and the app turns them into polished PDFs and Etsy-ready digital product packs.

## Core workflow
1. Create a project.
2. Choose product type.
3. Choose language version: Dutch or English.
4. Choose document format: A4 portrait.
5. Import structured Markdown content.
6. Upload image files or a ZIP/folder of images.
7. Match images to pages by filename.
8. Select template set and theme.
9. Preview pages.
10. Edit fields manually.
11. Run QC validation.
12. Export final PDF.
13. Export page previews.
14. Export contact sheet.
15. Export Customer ZIP.
16. Export Seller ZIP / Etsy Listing Pack.
17. Export/import project JSON.

## Product types

### Recipe Ebook
Required fields:
- title
- subtitle/intro
- heroImage
- prepTime
- cookTime
- totalTime
- servings
- difficulty
- ingredients
- steps
- notes
- optional nutrition
- category/tags

### Interior Magazine
Required fields:
- title
- subtitle
- heroImage
- whyItWorks
- howToRecreate
- palette
- materials
- designNotes
- styleTags
- optional imageNotes

### Exterior Magazine
Required fields:
- title
- subtitle
- heroImage
- designConcept
- palette
- materials
- designNotes
- plantingNotes
- maintenanceNotes
- styleTags

### General Ebook / Guide
Required fields:
- title
- subtitle
- body
- optional heroImage
- quote
- checklistItems
- chapterLabel
- keyTakeaways

## Input requirements
V1 must support:
- Markdown import
- manual editor
- image upload
- image ZIP/folder upload where possible
- palette presets
- custom palette import
- project JSON export/import

Future-ready architecture for:
- DOCX import
- CSV/Excel import
- drag-and-drop template editor

## Language handling
Projects can have two separate versions:
- Dutch
- English

Export Dutch and English separately. Do not mix languages on one page unless the user explicitly makes that content.

## Architecture
Use a single internal Project JSON model.
Markdown/manual/future DOCX/future CSV imports must all convert into Project JSON.

Use:
- Project JSON
- Template JSON
- Theme JSON
- Validation engine
- Template registry
- Export engine

Do not hardcode every layout directly. Templates must be config-driven so new templates can be added later.

## UI requirements
The app needs:
- project dashboard
- product type selector
- language/version selector
- page list
- page editor
- template selector
- image asset manager
- palette manager
- live preview
- QC panel
- export panel

## Template requirements
Use the included `templates/starter-template-pack.json`.
The app must support loading templates from JSON/config.

## Export requirements
Support:
- high-quality A4 final PDF
- PNG/JPG page previews
- contact sheet
- customer ZIP
- seller ZIP
- Etsy Listing Pack
- Read Me file
- listing title/description/tags TXT files
- page-number QC report
- missing-assets report

## Validation requirements
Before export, detect:
- missing required fields
- missing image files
- unused images
- duplicate filenames
- invalid HEX colors
- incomplete palettes
- text overflow risk
- unsupported template ids
- duplicate page numbers
- broken page sequence

## Design quality requirements
The generated PDFs must look premium and sellable:
- strong typography hierarchy
- generous margins
- consistent footer/page numbers
- professional image cropping
- clean palette rendering
- no text overflow
- consistent visual rhythm
- print-ready A4 output
- stable repeatable export

## Acceptance criteria
The app is successful when:
1. Interior magazine sample imports correctly.
2. Recipe ebook sample imports correctly.
3. Images match by filename.
4. Missing images are detected.
5. Palettes render correctly.
6. Pages preview correctly.
7. A4 final PDF exports correctly.
8. Page previews export.
9. Contact sheet exports.
10. Customer ZIP exports.
11. Seller/Etsy ZIP exports.
12. Project JSON export/import works.
13. Dutch and English versions can be handled separately.
