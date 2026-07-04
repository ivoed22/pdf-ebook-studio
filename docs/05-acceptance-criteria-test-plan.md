# Acceptance Criteria / Test Plan

## Import tests
- Import interior sample Markdown successfully.
- Import recipe sample Markdown successfully.
- All pages appear in the page list.
- Each page uses the correct template.
- Required fields are mapped correctly.

## Image tests
- Uploaded filenames match heroImage fields.
- Missing images show errors.
- Unused uploaded images show warnings.
- Duplicate filenames show warnings.

## Palette tests
- Valid HEX colors render correctly.
- Invalid HEX colors show errors.
- Fewer than 3 palette colors shows warning.

## Layout tests
- A4 portrait pages render consistently.
- Footer and page numbers are automatic.
- Text does not overlap image or footer.
- Long text shows overflow warning.

## Export tests
- Final PDF downloads successfully.
- Page previews export as images.
- Contact sheet exports successfully.
- Customer ZIP contains final PDF and Read Me.
- Seller ZIP contains final PDF, previews, contact sheet and listing assets.
- Project JSON export/import preserves content.
