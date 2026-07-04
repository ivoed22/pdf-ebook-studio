import type { Language, Project } from "../../types/project";

const TYPE_LABEL: Record<string, { en: string; nl: string }> = {
  "recipe-ebook": { en: "Recipe Ebook", nl: "Receptenboek" },
  "interior-magazine": { en: "Interior Design Magazine", nl: "Interieur Inspiratie Magazine" },
  "exterior-magazine": { en: "Exterior & Garden Magazine", nl: "Buiten & Tuin Magazine" },
  "general-ebook": { en: "Ebook Guide", nl: "Ebook Gids" },
};

export function listingTitle(project: Project, language: Language): string {
  const label = TYPE_LABEL[project.projectMeta.productType]?.[language] ?? "Digital Ebook";
  const pages = project.pages.filter((p) => p.language === language).length;
  return language === "nl"
    ? `${project.projectMeta.title} — ${label} | ${pages} pagina's | Printbare A4 PDF | Digitale Download`
    : `${project.projectMeta.title} — ${label} | ${pages} Pages | Printable A4 PDF | Instant Digital Download`;
}

export function listingDescription(project: Project, language: Language): string {
  const meta = project.projectMeta;
  const pages = project.pages.filter((p) => p.language === language);
  const titles = pages
    .map((p) => (typeof p.fields.title === "string" ? p.fields.title : ""))
    .filter(Boolean)
    .slice(1, 9);
  if (language === "nl") {
    return [
      `${meta.title}`,
      meta.subtitle ?? "",
      "",
      `Een prachtig vormgegeven digitaal product van ${pages.length} pagina's, direct te downloaden als printbare A4 PDF.`,
      "",
      "WAT JE ONTVANGT",
      `• ${pages.length} pagina's in hoge kwaliteit (A4, PDF)`,
      "• Direct downloaden na aankoop — geen verzending",
      "• Printbaar thuis of bij een printservice",
      "• Ook perfect leesbaar op tablet en desktop",
      "",
      titles.length ? "EEN KIJKJE BINNENIN\n" + titles.map((t) => `• ${t}`).join("\n") : "",
      "",
      "BELANGRIJK",
      "Dit is een digitaal product. Er wordt niets fysiek verzonden. Door de aard van digitale producten is retourneren niet mogelijk.",
    ]
      .filter((l) => l !== undefined)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  }
  return [
    `${meta.title}`,
    meta.subtitle ?? "",
    "",
    `A beautifully designed ${pages.length}-page digital product, delivered as an instant-download printable A4 PDF.`,
    "",
    "WHAT YOU GET",
    `• ${pages.length} high-quality pages (A4, PDF)`,
    "• Instant download after purchase — nothing is shipped",
    "• Print at home or at any print shop",
    "• Beautiful on tablet and desktop too",
    "",
    titles.length ? "A LOOK INSIDE\n" + titles.map((t) => `• ${t}`).join("\n") : "",
    "",
    "PLEASE NOTE",
    "This is a digital product. No physical item will be shipped. Due to the nature of digital downloads, returns are not accepted.",
  ]
    .filter((l) => l !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function listingTags(project: Project, language: Language): string {
  const type = project.projectMeta.productType;
  const base: Record<string, string[]> = {
    "recipe-ebook":
      language === "nl"
        ? ["recepten ebook", "digitaal kookboek", "printbare recepten", "recepten pdf", "kookboek download"]
        : ["recipe ebook", "digital cookbook", "printable recipes", "recipe pdf", "cookbook download"],
    "interior-magazine":
      language === "nl"
        ? ["interieur inspiratie", "interieur ebook", "woondecoratie gids", "interieur pdf", "moodboard"]
        : ["interior design", "home decor guide", "interior ebook", "design inspiration", "moodboard"],
    "exterior-magazine":
      language === "nl"
        ? ["tuin inspiratie", "buitenleven", "tuinontwerp gids", "exterieur pdf", "tuin ebook"]
        : ["garden design", "outdoor living", "landscaping guide", "exterior pdf", "garden ebook"],
    "general-ebook":
      language === "nl"
        ? ["digitale gids", "ebook pdf", "printbare gids", "werkboek", "zelfstudie"]
        : ["digital guide", "ebook pdf", "printable guide", "workbook", "self study"],
  };
  const common =
    language === "nl"
      ? ["digitale download", "printbare pdf", "a4 pdf", "direct downloaden", "digitaal product"]
      : ["digital download", "printable pdf", "a4 pdf", "instant download", "digital product"];
  const themeWords = project.projectMeta.title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3);
  return [...(base[type] ?? []), ...common, ...themeWords].slice(0, 13).join(", ");
}

export function readMeText(project: Project, language: Language): string {
  const meta = project.projectMeta;
  if (language === "nl") {
    return [
      `${meta.title}`,
      "".padEnd(meta.title.length, "="),
      "",
      "Bedankt voor je aankoop!",
      "",
      "WAT ZIT ER IN DEZE DOWNLOAD",
      "• De volledige PDF in A4-formaat (staand)",
      "",
      "HOE TE GEBRUIKEN",
      "1. Open de PDF op je computer, tablet of telefoon.",
      "2. Printen? Kies A4, staand, 100% schaal (niet passend maken).",
      "3. Voor het mooiste resultaat: print op 120-170 grams papier.",
      "",
      "LICENTIE",
      "Alleen voor persoonlijk gebruik. Doorverkopen of herdistribueren van dit bestand is niet toegestaan.",
      "",
      `© ${meta.year ?? new Date().getFullYear()} ${meta.author ?? meta.title}. Alle rechten voorbehouden.`,
    ].join("\n");
  }
  return [
    `${meta.title}`,
    "".padEnd(meta.title.length, "="),
    "",
    "Thank you for your purchase!",
    "",
    "WHAT'S IN THIS DOWNLOAD",
    "• The complete PDF in A4 format (portrait)",
    "",
    "HOW TO USE",
    "1. Open the PDF on your computer, tablet or phone.",
    "2. Printing? Choose A4, portrait, 100% scale (do not fit-to-page).",
    "3. For the best result, print on 120-170 gsm paper.",
    "",
    "LICENSE",
    "For personal use only. Reselling or redistributing this file is not permitted.",
    "",
    `© ${meta.year ?? new Date().getFullYear()} ${meta.author ?? meta.title}. All rights reserved.`,
  ].join("\n");
}
