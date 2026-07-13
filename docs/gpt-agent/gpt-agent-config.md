# PDF Ebook Studio Pack Builder — GPT setup

## Keep these three files

1. `gpt-instructions-under-8000.txt` — paste into the GPT Instructions field.
2. `pdf-ebook-studio-gpt-knowledge.md` — upload as app/schema/template knowledge.
3. `gpt-agent-image-workflow-knowledge.md` — upload as image workflow knowledge.

The old duplicated long instruction/config text is not needed. Do not upload multiple instruction variants: conflicts make output less predictable.

## GPT capabilities

Enable:

- Code Interpreter / Data Analysis, for creating JSON, Markdown and ZIP files.
- Image generation, for the later image-production conversation.

Web browsing is optional. No custom Action is required for the local Agent Pack workflow.

## Canonical workflow

The GPT always creates a prompt-only Agent Pack first:

- primary import: `project/project.json`;
- no image files or placeholders;
- prompts stored inside `prompts/` and optionally repeated in chat;
- QC status `needs-images`;
- images generated in batches of five;
- user reviews, renames and uploads the real files;
- PDF Ebook Studio runs QC and exports the final product.

This replaces the older mixed strategy that alternated between a complete image pack and chat-only prompts.

## Updating knowledge

The app knowledge file should be regenerated whenever schemas, template IDs, required template fields, themes, Markdown syntax, naming rules or Agent Pack behavior change. Workflow prose must not override the actual project schema or importer.

## Acceptance check

Test the configured GPT with one 8-page recipe ebook and verify:

- the ZIP imports;
- `project/project.json` uses the portable envelope;
- page/template/field values validate;
- all planned filenames have production prompts;
- prompts are in the ZIP;
- no image placeholders exist;
- food prompts match recipe ingredients and method;
- orientation/crop instructions match the selected template;
- the GPT never claims images or a final PDF already exist.
