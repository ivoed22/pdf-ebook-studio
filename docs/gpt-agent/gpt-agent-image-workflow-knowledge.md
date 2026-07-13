# PDF Ebook Studio image workflow

This is the canonical image-production reference for PDF Ebook Studio Pack Builder.

## Workflow contract

The default is a prompt-only Agent Pack. It contains the project and reproducible image prompts, but no fake or placeholder image files.

- `qcStatus` is `needs-images` until all referenced images exist and pass review.
- The prompt-only pack contains no `images/` directory.
- It contains `prompts/image-prompts.json`, `prompts/chatgpt-image-batches.md` and `prompts/image-production-sheet.md`.
- `image-prompts.json` is the machine-readable production source used by PDF Ebook Studio; Markdown is the human-readable fallback.
- `project/project-with-images.json` is used only after real images have been embedded.
- `qcStatus: pass` is allowed only after every referenced image filename is present.

## Production sequence

1. Import `pdf-ebook-studio-agent-pack.zip`.
2. Open `prompts/chatgpt-image-batches.md`.
3. Generate five images per batch in ChatGPT.
4. Review every result against its recipe or page content.
5. Regenerate rejected images.
6. Download and rename each file exactly.
7. Put approved files in one ZIP.
8. Upload that ZIP in PDF Ebook Studio's Images section.
9. Run QC and resolve missing or unused images.
10. Inspect crop and focus in preview.
11. Export the final PDF/customer/seller files in PDF Ebook Studio.

Image generation may not preserve filenames or return a ZIP. Every batch must therefore request a ZIP if supported and also require visible filename labels as fallback.

## Default batches

Use five images per batch for quality and easier rejection/regeneration. Use ten only when the user explicitly prefers speed.

Each batch contains:

- product title and shared style lock;
- exact required filenames;
- one self-contained prompt per image;
- orientation, target ratio and crop focus;
- anti-duplication rules;
- rejection criteria;
- ZIP-or-label delivery instruction.

## Crop and output

The app supports JPG, JPEG, PNG and WebP and matches files by exact filename. Use high-quality sRGB JPG for normal photography.

PDF Ebook Studio uses `object-fit: cover`, so sources can be cropped. A4 portrait does not mean every source image must be portrait.

| Slot | Master orientation | Guideline |
| --- | --- | --- |
| Full-bleed A4 cover | Portrait | About 1:1.414; central crop-safe subject |
| Tall split image | Portrait | 2:3 or 3:4 |
| Wide top hero | Landscape | 3:2 master with room for a wider crop |
| Editorial large image | Slot-dependent | Usually 4:3 or closest suitable orientation |
| Grid/detail image | Square | 1:1 unless template requires otherwise |

Keep important content in the central 60%, leave space on all sides, and set crop focus to center/top/bottom/left/right. Request the largest available generated image. Exact print pixels, such as 2480 x 3508 for 300 dpi A4, require a later resize/upscale/crop check and must not be claimed solely because they appear in a prompt.

## Food validation

Every prompt is grounded in the recipe title, ingredients, method and serving description. It specifies exact dish identity, visible ingredients, preparation stage, cooking method, doneness, texture, sauce, plating, vessel, portion, compatible garnish, surface, props, angle, crop and lighting.

Reject an image if it introduces an incompatible ingredient, pasta shape, protein cut, garnish, sauce, side dish or cooking method. Also reject plastic textures, impossible food, wrong preparation stage, malformed utensils/hands, text, logos and duplicate compositions.

Use a coherent global visual world while varying appropriate views: 45-degree final hero, overhead preparation, macro texture, serving action or cooking process. Variation never overrides recipe accuracy.

## Interior and exterior validation

Specify space type, camera height/angle, distance, time of day, light direction, palette, materials, layout and styling. Reject impossible geometry, duplicated furniture, blocked circulation, floating objects, inconsistent shadows, fake text and repetitive camera positions.

## Completion definition

Generated prompts are not completed images. Generated images are not completed assets until they are reviewed, correctly named, uploaded, crop-checked and accepted by Studio QC. The final ebook exists only after PDF Ebook Studio exports it.
