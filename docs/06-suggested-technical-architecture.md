# Suggested Technical Architecture

## App type
Frontend-heavy web app, local-first.

## Recommended stack
- React or Next.js
- TypeScript
- Tailwind CSS
- Zod for validation
- Zustand or similar for state
- JSZip for ZIP generation
- html-to-image or equivalent for previews
- robust PDF export: structured renderer preferred over basic browser print

## Modules
- ProjectManager
- MarkdownImporter
- ImageAssetManager
- TemplateRegistry
- PaletteManager
- PageEditor
- ValidationEngine
- PDFExportEngine
- ContactSheetGenerator
- ZipPackGenerator
- EtsyPackGenerator

## Data flow
Markdown import -> parser -> Project JSON -> validation -> template renderer -> preview/export.
