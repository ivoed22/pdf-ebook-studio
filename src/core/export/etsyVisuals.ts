import type { ImageAsset, Language, Project } from "../../types/project";
import { getTheme } from "../../data/themes/themes";
import type { Theme } from "../../types/theme";
import { renderProjectPdf } from "./renderPdf";
import { pdfToImages, type RenderedPage } from "./pdfToImages";

/**
 * Square 2000×2000 Etsy listing images, composed on a canvas with the
 * project's theme. Uses the real page renders so listings always match
 * the product.
 */

export const ETSY_SIZE = 2000;

export interface EtsyVisual {
  name: string;
  blob: Blob;
}

interface Ctx2D {
  c: CanvasRenderingContext2D;
  theme: Theme;
  project: Project;
  language: Language;
}

export async function renderEtsyVisuals(
  project: Project,
  images: Map<string, ImageAsset>,
  language: Language,
  onProgress: (step: string) => void = () => {},
  pagePreviews?: RenderedPage[],
): Promise<EtsyVisual[]> {
  await document.fonts.ready;
  onProgress("Rendering pages for listing images…");
  const previews =
    pagePreviews ??
    (await pdfToImages(await renderProjectPdf(project, images, language), { scale: 1.7 }));
  if (!previews.length) return [];

  const theme = getTheme(project.projectMeta.theme);
  const bitmaps = await Promise.all(previews.slice(0, 7).map((p) => createImageBitmap(p.blob)));
  const visuals: EtsyVisual[] = [];

  const compositions: [string, (ctx: Ctx2D, pages: ImageBitmap[]) => void][] = [
    ["listing-1-main-cover", drawMainCover],
    ["listing-2-whats-included", drawIncludedGrid],
    ["listing-3-inside-look", drawInsideCollage],
    ["listing-4-palette-style", drawPalette],
  ];

  for (const [name, draw] of compositions) {
    onProgress(`Composing ${name}…`);
    const canvas = document.createElement("canvas");
    canvas.width = ETSY_SIZE;
    canvas.height = ETSY_SIZE;
    const c = canvas.getContext("2d")!;
    draw({ c, theme, project, language }, bitmaps);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.92),
    );
    visuals.push({ name: `${name}-${language}.jpg`, blob });
    canvas.width = 0;
  }
  for (const b of bitmaps) b.close();
  return visuals;
}

// ---------------------------------------------------------------- helpers --

function fill(ctx: Ctx2D, color: string) {
  ctx.c.fillStyle = color;
  ctx.c.fillRect(0, 0, ETSY_SIZE, ETSY_SIZE);
}

function text(
  ctx: Ctx2D,
  content: string,
  x: number,
  y: number,
  options: { size: number; font?: "display" | "body"; weight?: number; color?: string; align?: CanvasTextAlign; spacing?: number },
) {
  const { c, theme } = ctx;
  const family = options.font === "display" ? theme.fonts.display : theme.fonts.body;
  c.font = `${options.weight ?? 400} ${options.size}px "${family}", sans-serif`;
  c.fillStyle = options.color ?? theme.colors.heading;
  c.textAlign = options.align ?? "center";
  if (options.spacing) {
    // manual letter-spacing for small caps labels
    const chars = content.split("");
    const widths = chars.map((ch) => c.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + options.spacing * (chars.length - 1);
    let cx = options.align === "left" ? x : x - total / 2;
    c.textAlign = "left";
    for (let i = 0; i < chars.length; i++) {
      c.fillText(chars[i], cx, y);
      cx += widths[i] + options.spacing;
    }
    c.textAlign = options.align ?? "center";
    return;
  }
  c.fillText(content, x, y);
}

function wrapText(ctx: Ctx2D, content: string, maxWidth: number, size: number, family: string, weight: number): string[] {
  const { c } = ctx;
  c.font = `${weight} ${size}px "${family}", sans-serif`;
  const words = content.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (c.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawPage(ctx: Ctx2D, bitmap: ImageBitmap, x: number, y: number, w: number, options: { shadow?: number; rotate?: number } = {}) {
  const { c } = ctx;
  const h = (bitmap.height / bitmap.width) * w;
  c.save();
  c.translate(x + w / 2, y + h / 2);
  if (options.rotate) c.rotate((options.rotate * Math.PI) / 180);
  if (options.shadow !== 0) {
    c.shadowColor = "rgba(0,0,0,0.28)";
    c.shadowBlur = options.shadow ?? 40;
    c.shadowOffsetY = (options.shadow ?? 40) / 3;
  }
  c.fillStyle = "#ffffff";
  c.fillRect(-w / 2, -h / 2, w, h);
  c.shadowColor = "transparent";
  c.drawImage(bitmap, -w / 2, -h / 2, w, h);
  c.restore();
  return h;
}

function badge(ctx: Ctx2D, label: string, cx: number, cy: number) {
  const { c, theme } = ctx;
  c.font = `600 34px "${theme.fonts.body}", sans-serif`;
  const w = c.measureText(label).width + 76;
  c.fillStyle = theme.colors.accent;
  roundRect(c, cx - w / 2, cy - 37, w, 74, 37);
  c.fill();
  c.fillStyle = "#ffffff";
  c.textAlign = "center";
  c.fillText(label, cx, cy + 12);
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function header(ctx: Ctx2D, kicker: string, title: string) {
  const { theme } = ctx;
  text(ctx, kicker.toUpperCase(), ETSY_SIZE / 2, 150, {
    size: 34,
    color: theme.colors.accent,
    weight: 600,
    spacing: 10,
  });
  const lines = wrapText(ctx, title, 1500, 96, theme.fonts.display, 600);
  lines.forEach((line, i) => {
    text(ctx, line, ETSY_SIZE / 2, 270 + i * 112, {
      size: 96,
      font: "display",
      weight: 600,
      color: theme.colors.heading,
    });
  });
  return 270 + (lines.length - 1) * 112;
}

function footerBar(ctx: Ctx2D) {
  const { language, theme } = ctx;
  const label =
    language === "nl"
      ? "DIRECTE DIGITALE DOWNLOAD  ·  PRINTBARE A4 PDF"
      : "INSTANT DIGITAL DOWNLOAD  ·  PRINTABLE A4 PDF";
  text(ctx, label, ETSY_SIZE / 2, ETSY_SIZE - 90, {
    size: 30,
    color: theme.colors.textMuted,
    weight: 600,
    spacing: 8,
  });
}

// ----------------------------------------------------------- compositions --

function drawMainCover(ctx: Ctx2D, pages: ImageBitmap[]) {
  const { theme, project, language } = ctx;
  fill(ctx, theme.colors.background);
  const titleBottom = header(
    ctx,
    project.projectMeta.author ?? "PDF Ebook Studio",
    project.projectMeta.title,
  );
  const pageCount = project.pages.filter((p) => p.language === language).length;
  badge(ctx, language === "nl" ? `${pageCount} pagina's · A4 PDF` : `${pageCount} pages · A4 PDF`, ETSY_SIZE / 2, titleBottom + 130);

  const w = 860;
  drawPage(ctx, pages[0], (ETSY_SIZE - w) / 2, titleBottom + 230, w, { shadow: 60 });
  footerBar(ctx);
}

function drawIncludedGrid(ctx: Ctx2D, pages: ImageBitmap[]) {
  const { theme, language } = ctx;
  fill(ctx, theme.colors.surface);
  header(ctx, language === "nl" ? "Wat je ontvangt" : "What's included", language === "nl" ? "Een blik op de inhoud" : "A look at what's inside");

  const grid = pages.slice(0, 4);
  const w = 620;
  const gap = 90;
  const startX = (ETSY_SIZE - (w * 2 + gap)) / 2;
  const startY = 480;
  grid.forEach((bitmap, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawPage(ctx, bitmap, startX + col * (w + gap), startY + row * 640, w, { shadow: 30 });
  });
  footerBar(ctx);
}

function drawInsideCollage(ctx: Ctx2D, pages: ImageBitmap[]) {
  const { theme, language } = ctx;
  fill(ctx, theme.colors.background);
  header(ctx, language === "nl" ? "Inkijkexemplaar" : "Inside preview", language === "nl" ? "Ontworpen om te verkopen" : "Designed to feel premium");

  const picks = pages.slice(1, 4).length ? pages.slice(1, 4) : pages.slice(0, 3);
  const w = 720;
  const positions: [number, number, number][] = [
    [200, 560, -5],
    [1080, 620, 4],
    [630, 760, 0],
  ];
  picks.forEach((bitmap, i) => {
    const [x, y, rotate] = positions[i] ?? positions[0];
    drawPage(ctx, bitmap, x, y, w, { shadow: 45, rotate });
  });
  footerBar(ctx);
}

function drawPalette(ctx: Ctx2D, pages: ImageBitmap[]) {
  const { c, theme, project, language } = ctx;
  fill(ctx, theme.colors.background);
  header(ctx, language === "nl" ? "Stijl & palet" : "Style & palette", theme.name);

  // palette: first page palette in project, else theme default
  let colors = theme.defaultPalette;
  for (const page of project.pages) {
    const p = page.fields.palette;
    if (Array.isArray(p) && p.length && typeof p[0] === "object") {
      colors = (p as { name: string; hex: string }[]).filter((x) => /^#/.test(x.hex));
      if (colors.length) break;
    }
  }
  colors = colors.slice(0, 6);

  const sw = Math.min(260, 1500 / colors.length - 30);
  const totalW = colors.length * sw + (colors.length - 1) * 40;
  let x = (ETSY_SIZE - totalW) / 2;
  const y = 520;
  for (const color of colors) {
    c.fillStyle = color.hex;
    roundRect(c, x, y, sw, sw, 24);
    c.fill();
    c.strokeStyle = theme.colors.divider;
    c.lineWidth = 2;
    roundRect(c, x, y, sw, sw, 24);
    c.stroke();
    text(ctx, color.name, x + sw / 2, y + sw + 64, { size: 30, color: theme.colors.text, weight: 500 });
    text(ctx, color.hex.toUpperCase(), x + sw / 2, y + sw + 108, { size: 26, color: theme.colors.textMuted });
    x += sw + 40;
  }

  if (pages[0]) {
    const w = 680;
    drawPage(ctx, pages[Math.min(1, pages.length - 1)], (ETSY_SIZE - w) / 2, y + sw + 190, w, { shadow: 35 });
  }
  footerBar(ctx);
}
