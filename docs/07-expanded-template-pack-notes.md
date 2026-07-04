# Expanded Starter Template Pack v2

This template pack contains **66 templates** for PDF Ebook Studio.

## Groups
- Core Magazine
- Interior Magazine
- Recipe Ebook
- Exterior Magazine
- General Ebook
- Bonus / Utility
- Etsy Listing Visuals

## Important implementation note
Templates are intentionally config-driven. Claude/Fable should build a Template Registry that loads this JSON and maps each template id to a renderer.

For the first build, not every template needs a completely unique renderer. Similar templates can share base renderers, but the app must keep the template IDs and required fields intact so more exact renderers can be added later.
