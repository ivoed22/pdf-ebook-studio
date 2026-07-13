import { create } from "zustand";

export type UiLang = "nl" | "en";

interface I18nState {
  uiLang: UiLang;
  setUiLang(lang: UiLang): void;
}

export const useI18n = create<I18nState>((set) => ({
  uiLang: (localStorage.getItem("pdf-ebook-studio-ui-lang") as UiLang) || "nl",
  setUiLang(lang) {
    localStorage.setItem("pdf-ebook-studio-ui-lang", lang);
    set({ uiLang: lang });
  },
}));

type Entry = { nl: string; en: string };

const STRINGS = {
  // App / dashboard
  appTagline: {
    nl: "Maak van voorbereide content en afbeeldingen premium, verkoopbare A4-PDF's.",
    en: "Turn prepared content and images into premium, sellable A4 PDFs.",
  },
  newProject: { nl: "+ Nieuw project", en: "+ New project" },
  importProject: { nl: "Project importeren", en: "Import project" },
  importAgentPackDirect: { nl: "Agent ZIP importeren", en: "Import Agent ZIP" },
  quickStartTitle: { nl: "Start of importeer een project", en: "Start or import a project" },
  quickStartBody: {
    nl: "Maak een leeg project, kies een bestaand bestand of importeer direct een compleet ChatGPT Agent Pack.",
    en: "Create a blank project, choose an existing file, or directly import a complete ChatGPT Agent Pack.",
  },
  recommendedAgentPack: { nl: "Aanbevolen voor ChatGPT", en: "Recommended for ChatGPT" },
  examplesTitle: { nl: "Voorbeeldprojecten", en: "Sample projects" },
  examplesBody: {
    nl: "Open een compleet voorbeeld om templates, QC en export direct te verkennen.",
    en: "Open a complete sample to explore templates, QC, and export right away.",
  },
  showExamples: { nl: "Toon de voorbeelden", en: "Show samples" },
  noProjectsBody: {
    nl: "Je bibliotheek is nog leeg. Start hierboven of open hieronder een voorbeeldproject.",
    en: "Your library is empty. Start above or open a sample project below.",
  },
  interiorSampleBody: {
    nl: "Een editorial interieurmagazine met paletten, materialen en beeldrijke pagina's.",
    en: "An editorial interior magazine with palettes, materials, and image-rich pages.",
  },
  recipeSampleBody: {
    nl: "Een compleet receptenebook met bereiding, voeding en verkoopklare export.",
    en: "A complete recipe ebook with preparation, nutrition, and sales-ready export.",
  },
  openSample: { nl: "Voorbeeld openen", en: "Open sample" },
  importMarkdown: { nl: "Importeer Markdown…", en: "Import Markdown…" },
  pasteMarkdown: { nl: "Plak Markdown…", en: "Paste Markdown…" },
  importJson: { nl: "Importeer project-JSON…", en: "Import project JSON…" },
  importAgentPack: { nl: "Importeer Agent ZIP…", en: "Import Agent ZIP…" },
  agentPackImported: { nl: "geimporteerd via Agent ZIP ✓", en: "imported from Agent ZIP ✓" },
  loadInteriorSample: { nl: "Interieur-voorbeeld", en: "Interior sample" },
  loadRecipeSample: { nl: "Recepten-voorbeeld", en: "Recipe sample" },
  searchProjects: { nl: "Zoek projecten…", en: "Search projects…" },
  sortRecent: { nl: "Laatst bewerkt", en: "Recently edited" },
  sortTitle: { nl: "Titel A–Z", en: "Title A–Z" },
  noProjects: { nl: "Nog geen projecten", en: "No projects yet" },
  onboardTitle: { nl: "Zo werkt het", en: "How it works" },
  onboard1Title: { nl: "1 · Importeer of maak", en: "1 · Import or create" },
  onboard1Body: {
    nl: "Start met een Markdown-bestand, een voorbeeldproject of een leeg project.",
    en: "Start from a Markdown file, a sample project, or a blank project.",
  },
  onboard2Title: { nl: "2 · Bewerk & controleer", en: "2 · Edit & check" },
  onboard2Body: {
    nl: "Upload afbeeldingen, bewerk pagina's met live PDF-voorbeeld en laat QC alles nakijken.",
    en: "Upload images, edit pages with a live PDF preview, and let QC verify everything.",
  },
  onboard3Title: { nl: "3 · Exporteer & verkoop", en: "3 · Export & sell" },
  onboard3Body: {
    nl: "Exporteer de PDF, previews en het complete Etsy-verkooppakket.",
    en: "Export the PDF, previews and the complete Etsy seller pack.",
  },
  tryASample: { nl: "Of probeer direct een voorbeeld:", en: "Or try a sample right away:" },
  pages: { nl: "pagina's", en: "pages" },
  updated: { nl: "Bewerkt", en: "Updated" },
  duplicate: { nl: "Dupliceer", en: "Duplicate" },
  delete: { nl: "Verwijder", en: "Delete" },
  deleteProjectQ: { nl: "Project verwijderen?", en: "Delete project?" },
  deleteProjectBody: {
    nl: "\"{name}\" en alle bijbehorende afbeeldingen worden definitief verwijderd.",
    en: "\"{name}\" and all its images will be permanently deleted.",
  },
  cancel: { nl: "Annuleer", en: "Cancel" },
  confirm: { nl: "Bevestig", en: "Confirm" },
  pasteMarkdownTitle: { nl: "Plak Markdown-content", en: "Paste Markdown content" },
  pasteMarkdownHint: {
    nl: "Plak hieronder je volledige Markdown (frontmatter + <!-- PAGE --> blokken).",
    en: "Paste your full Markdown below (frontmatter + <!-- PAGE --> blocks).",
  },
  importBtn: { nl: "Importeer", en: "Import" },
  projectCopy: { nl: "kopie", en: "copy" },

  // Wizard
  wizardTitle: { nl: "Nieuw project", en: "New project" },
  projectTitleLabel: { nl: "Projecttitel", en: "Project title" },
  productType: { nl: "Producttype", en: "Product type" },
  languageVersions: { nl: "Taalversies", en: "Language versions" },
  langVersionHint: { nl: "Elke taal exporteert als eigen PDF.", en: "Each language exports as its own PDF." },
  theme: { nl: "Thema", en: "Theme" },
  createProject: { nl: "Maak project", en: "Create project" },
  wizardFootnote: {
    nl: "Formaat: A4 staand. Je kunt ook een Markdown-bestand importeren vanaf het dashboard.",
    en: "Document format: A4 portrait. You can also import a Markdown file from the dashboard instead.",
  },
  typeRecipe: { nl: "Receptenboek", en: "Recipe Ebook" },
  typeRecipeBlurb: { nl: "Kookboeken met ingrediënten, stappen en bereidingstijden.", en: "Cookbooks with ingredients, steps and prep times." },
  typeInterior: { nl: "Interieur-magazine", en: "Interior Magazine" },
  typeInteriorBlurb: { nl: "Kamerconcepten met paletten en materialen.", en: "Room concepts with palettes and materials." },
  typeExterior: { nl: "Exterieur-magazine", en: "Exterior Magazine" },
  typeExteriorBlurb: { nl: "Tuin-, gevel- en buitenleefconcepten.", en: "Garden, facade and outdoor living concepts." },
  typeGuide: { nl: "Algemeen ebook / gids", en: "General Ebook / Guide" },
  typeGuideBlurb: { nl: "Hoofdstukken, checklists, werkbladen en gidsen.", en: "Chapters, checklists, workbook pages and guides." },

  // Editor chrome
  backToProjects: { nl: "← Projecten", en: "← Projects" },
  qcClean: { nl: "QC in orde", en: "QC clean" },
  errorsN: { nl: "{n} fout(en)", en: "{n} error(s)" },
  saved: { nl: "Opgeslagen ✓", en: "Saved ✓" },
  saving: { nl: "Opslaan…", en: "Saving…" },
  undo: { nl: "Ongedaan maken", en: "Undo" },
  redo: { nl: "Opnieuw", en: "Redo" },
  tabPage: { nl: "Pagina", en: "Page" },
  tabImages: { nl: "Afbeeldingen", en: "Images" },
  tabPalettes: { nl: "Paletten", en: "Palettes" },
  tabQc: { nl: "QC", en: "QC" },
  tabExport: { nl: "Export", en: "Export" },
  tabProject: { nl: "Project", en: "Project" },

  // Page list
  pagesHeader: { nl: "Pagina's", en: "Pages" },
  addPage: { nl: "+ Nieuw", en: "+ Add" },
  renumber: { nl: "Hernummer 1..n", en: "Renumber 1..n" },
  noPagesInLang: { nl: "Nog geen pagina's in deze taalversie.", en: "No pages in this language version yet." },
  untitled: { nl: "(zonder titel)", en: "(untitled)" },
  noTemplate: { nl: "geen template", en: "no template" },
  copy: { nl: "Kopie", en: "Copy" },
  removePageQ: { nl: "Pagina verwijderen?", en: "Remove page?" },
  removePageBody: { nl: "Pagina {n} wordt verwijderd uit deze taalversie.", en: "Page {n} will be removed from this language version." },
  dragHint: { nl: "Sleep om te herordenen", en: "Drag to reorder" },

  // Page editor
  selectPagePrompt: { nl: "Selecteer een pagina om de inhoud te bewerken.", en: "Select a page to edit its content." },
  pageNumber: { nl: "Pagina #", en: "Page #" },
  language: { nl: "Taal", en: "Language" },
  template: { nl: "Template", en: "Template" },
  chooseTemplate: { nl: "Kies template…", en: "Choose template…" },
  requiredFields: { nl: "Verplichte velden", en: "Required fields" },
  optionalFields: { nl: "Optionele velden", en: "Optional fields" },
  otherFields: { nl: "Overige velden op deze pagina", en: "Other fields on this page" },
  remove: { nl: "verwijder", en: "remove" },
  onePerLine: { nl: " — één per regel", en: " — one per line" },
  notUploaded: { nl: "Niet geüpload.", en: "Not uploaded." },
  useSuggestion: { nl: "Gebruik \"{name}\"?", en: "Use \"{name}\"?" },
  pickUploaded: { nl: "Kies een geüploade afbeelding", en: "Pick an uploaded image" },
  addColor: { nl: "+ Kleur toevoegen", en: "+ Add color" },
  applySavedPalette: { nl: "Pas opgeslagen palet toe…", en: "Apply saved palette…" },
  focusPoint: { nl: "Uitsnede-focus", en: "Crop focus" },
  focusCenter: { nl: "Midden", en: "Center" },
  focusTop: { nl: "Boven", en: "Top" },
  focusBottom: { nl: "Onder", en: "Bottom" },
  focusLeft: { nl: "Links", en: "Left" },
  focusRight: { nl: "Rechts", en: "Right" },

  // Template picker
  pickTemplateTitle: { nl: "Kies een template", en: "Choose a template" },
  currentTemplate: { nl: "Huidig", en: "Current" },
  allGroups: { nl: "Alle groepen", en: "All groups" },

  // Assets
  dropImages: { nl: "Sleep afbeeldingen of een ZIP hierheen", en: "Drop images or a ZIP here" },
  dropImagesHint: {
    nl: ".jpg · .jpeg · .png · .webp · .zip — gekoppeld aan pagina's op exacte bestandsnaam",
    en: ".jpg · .jpeg · .png · .webp · .zip — matched to pages by exact filename",
  },
  namingExample: { nl: "Naamgeving: page-01-cover.jpg, page-07-soft-beige-retreat.jpg", en: "Naming: page-01-cover.jpg, page-07-soft-beige-retreat.jpg" },
  uploadedN: { nl: "Geüpload ({n})", en: "Uploaded ({n})" },
  noImagesYet: { nl: "Nog geen afbeeldingen geüpload.", en: "No images uploaded yet." },
  inUse: { nl: "In gebruik", en: "In use" },
  unused: { nl: "Ongebruikt", en: "Unused" },
  imagesAdded: { nl: "{n} afbeelding(en) toegevoegd.", en: "{n} image(s) added." },
  imagesReplaced: { nl: "{n} vervangen (zelfde bestandsnaam).", en: "{n} replaced (same filename)." },
  imagesSkipped: { nl: "Overgeslagen (niet ondersteund): {names}", en: "Skipped unsupported: {names}" },

  // Palettes
  paletteIntro: {
    nl: "Opgeslagen paletten kun je vanuit de pagina-editor op elke pagina toepassen. Eigen palet-JSON:",
    en: "Saved palettes can be applied to any page from the page editor. Custom palette JSON:",
  },
  newPalette: { nl: "+ Nieuw palet", en: "+ New palette" },
  importJsonShort: { nl: "Importeer JSON…", en: "Import JSON…" },
  addPreset: { nl: "Voeg preset toe…", en: "Add preset…" },
  noPalettes: { nl: "Nog geen opgeslagen paletten.", en: "No saved palettes yet." },
  paletteTip: { nl: "Tip: 3–6 kleuren renderen het mooist.", en: "Tip: 3–6 colors render best." },
  paletteReadError: { nl: "Kon paletbestand niet lezen.", en: "Could not read palette file." },
  colorName: { nl: "Naam", en: "Name" },
  documentTheme: { nl: "Documentthema", en: "Document theme" },
  documentThemeNote: {
    nl: "Deze kleuren bepalen het héle document (achtergrond, tekst, koppen, accenten). Interieur-paletten per pagina stel je los in via het paletvak op de pagina.",
    en: "These colors drive the whole document (background, text, headings, accents). Per-page interior palettes are set separately via the palette field on the page.",
  },
  roleBackground: { nl: "Achtergrond", en: "Background" },
  roleSurface: { nl: "Vlakken", en: "Panels" },
  roleText: { nl: "Tekst", en: "Text" },
  roleHeading: { nl: "Koppen", en: "Headings" },
  roleAccent: { nl: "Accent", en: "Accent" },
  roleDivider: { nl: "Lijnen", en: "Lines" },
  resetTheme: { nl: "Terug naar themastandaard", en: "Reset to theme default" },
  themeCustomized: { nl: "Aangepast", en: "Customized" },
  paletteLibraryHeading: { nl: "Palet-bibliotheek", en: "Palette library" },
  paletteLibrarySub: {
    nl: "Voor pagina's mét een paletvak (interieur, exterieur, recept) — niet het documentthema.",
    en: "For pages that have a palette area (interior, exterior, recipe) — not the document theme.",
  },
  themeFineTuneHint: {
    nl: "Fijn afstellen van de kleuren doe je in het tabblad Paletten.",
    en: "Fine-tune the colors in the Palettes tab.",
  },
  paletteLibraryNote: {
    nl: "Opgeslagen paletten zijn een bibliotheek. Kleuren verschijnen op pagina's mét een paletvak (o.a. interieur-, exterieur- en receptpagina's) — niet op covers. De algemene paginakleuren stel je in bij het tabblad Project (thema).",
    en: "Saved palettes are a library. Colors show on pages that have a palette area (e.g. interior, exterior and recipe pages) — not on covers. The overall page colors are set under the Project tab (theme).",
  },
  applyToPage: { nl: "Toepassen op huidige pagina", en: "Apply to current page" },
  paletteApplied: { nl: "Palet toegepast op pagina {n}.", en: "Palette applied to page {n}." },
  paletteNoArea: {
    nl: "Toegepast, maar pagina {n} heeft geen paletvak in deze template — kies een template die een palet toont.",
    en: "Applied, but page {n} has no palette area in this template — pick a template that shows a palette.",
  },
  paletteNoPage: { nl: "Selecteer eerst een pagina.", en: "Select a page first." },

  // QC
  qcAllPassed: { nl: "Alle controles geslaagd", en: "All checks passed" },
  qcAllPassedBody: {
    nl: "Verplichte velden, afbeeldingen, paletten, paginanummering en tekstlengte zien er goed uit. Klaar om te exporteren.",
    en: "Required fields, images, palettes, page numbering and text length all look good. Ready to export.",
  },
  qcSummary: {
    nl: "{e} fout(en) · {w} waarschuwing(en). Fouten eerst oplossen voor een verkoopbaar resultaat; waarschuwingen zijn advies.",
    en: "{e} error(s) · {w} warning(s). Fix errors first for a sellable result; warnings are advisory.",
  },
  fixAll: { nl: "Los alles op wat kan ({n})", en: "Fix everything possible ({n})" },
  fix: { nl: "Oplossen", en: "Fix" },
  fixedN: { nl: "{n} issue(s) opgelost.", en: "Fixed {n} issue(s)." },

  // Export
  qcOpenErrors: {
    nl: "{n} QC-fout(en) open. Exporteren kan, maar los ze eerst op voor een verkoopbaar resultaat — zie het QC-tabblad.",
    en: "{n} QC error(s) open. You can still export, but fix them first for a sellable result — see the QC tab.",
  },
  exportLangLabel: { nl: "Taalversie om te exporteren", en: "Language version to export" },
  allLanguages: { nl: "Alle talen (aparte bestanden)", en: "All languages (separate files)" },
  onlyLang: { nl: "Alleen {lang}", en: "{lang} only" },
  exportBtn: { nl: "Exporteer", en: "Export" },
  finalPdf: { nl: "Definitieve PDF", en: "Final PDF" },
  finalPdfHint: { nl: "Hoogwaardige vector-A4-PDF — het bestand dat je klant ontvangt.", en: "High-quality vector A4 PDF — the file your customer receives." },
  pagePreviews: { nl: "Paginapreviews (ZIP)", en: "Page previews (ZIP)" },
  pagePreviewsHint: { nl: "Elke pagina als JPG (~200 DPI), voor listings en social media.", en: "Every page as a ~200 DPI JPG, for listings and social posts." },
  contactSheet: { nl: "Contactsheet (PDF)", en: "Contact sheet (PDF)" },
  contactSheetHint: { nl: "Alle pagina's als miniaturen op A4-overzichtsvellen.", en: "All pages as thumbnails on A4 overview sheets." },
  customerZip: { nl: "Klant-ZIP", en: "Customer ZIP" },
  customerZipHint: { nl: "Definitieve PDF('s) + leesmij — upload dit als productbestand op Etsy.", en: "Final PDF(s) + Read-Me — upload this to Etsy as the product file." },
  sellerZip: { nl: "Verkoper-ZIP / Etsy-pakket", en: "Seller ZIP / Etsy Listing Pack" },
  sellerZipHint: {
    nl: "PDF's, previews, contactsheet, listing-teksten, listingfoto's (2000×2000) en QC-rapporten.",
    en: "PDFs, previews, contact sheet, listing texts, listing photos (2000×2000) and QC reports.",
  },
  etsyImages: { nl: "Etsy-listingafbeeldingen", en: "Etsy listing images" },
  etsyImagesHint: { nl: "Vierkante 2000×2000 marketingbeelden: cover-mockup, inhoud, inkijk en palet.", en: "Square 2000×2000 marketing images: cover mockup, what's included, inside look and palette." },
  projectBackup: { nl: "Projectback-up", en: "Project backup" },
  exportProjectJson: { nl: "Exporteer project-JSON", en: "Export project JSON" },
  exportWithImages: { nl: "Exporteer met afbeeldingen", en: "Export with images" },
  backupHint: {
    nl: "Opnieuw importeren via het dashboard. \"Met afbeeldingen\" sluit alle uploads in (groter bestand, volledig draagbaar).",
    en: "Re-import from the dashboard. \"With images\" embeds all uploads (bigger file, fully portable).",
  },
  exporting: { nl: "Bezig met exporteren", en: "Exporting" },
  exportDone: { nl: "Klaar — check je downloads.", en: "Done — check your downloads." },
  exportFailed: { nl: "Export mislukt: {msg}", en: "Export failed: {msg}" },
  close: { nl: "Sluiten", en: "Close" },

  // Project settings
  title: { nl: "Titel", en: "Title" },
  subtitle: { nl: "Ondertitel", en: "Subtitle" },
  authorBrand: { nl: "Auteur / merk", en: "Author / brand" },
  year: { nl: "Jaar", en: "Year" },
  outputProfile: { nl: "Outputprofiel", en: "Output profile" },
  settingsFootnote: {
    nl: "Formaat: A4 staand · Themawissel is direct zichtbaar in preview en exports.",
    en: "Format: A4 portrait · Theme changes apply instantly to the live preview and all exports.",
  },

  // Preview
  selectOrAdd: { nl: "Selecteer of maak een pagina om de preview te zien.", en: "Select or add a page to see its preview." },
  livePreview: { nl: "Live PDF-preview — exact wat je exporteert", en: "Live PDF preview — exactly what exports" },
  rendering: { nl: "Preview renderen…", en: "Rendering preview…" },
  previewFailed: { nl: "Preview mislukt", en: "Preview failed" },
  allPages: { nl: "Alle pagina's", en: "All pages" },
  onePage: { nl: "Eén pagina", en: "Single page" },
  pageOf: { nl: "Pagina {a} van {b}", en: "Page {a} of {b}" },
  gridLoading: { nl: "Overzicht renderen…", en: "Rendering overview…" },

  // Shortcuts
  shortcuts: { nl: "Sneltoetsen", en: "Keyboard shortcuts" },
  scUndo: { nl: "Ongedaan maken / opnieuw", en: "Undo / redo" },
  scNav: { nl: "Vorige / volgende pagina", en: "Previous / next page" },
  scDup: { nl: "Dupliceer pagina", en: "Duplicate page" },
  scHelp: { nl: "Dit overzicht", en: "This overlay" },

  // Misc
  loading: { nl: "Studio laden…", en: "Loading your studio…" },
  narrowScreen: {
    nl: "De editor werkt het best op een groter scherm (≥ 1024px breed).",
    en: "The editor works best on a larger screen (≥ 1024px wide).",
  },
} satisfies Record<string, Entry>;

export type StringKey = keyof typeof STRINGS;

export function translate(lang: UiLang, key: StringKey, vars?: Record<string, string | number>): string {
  let text: string = STRINGS[key][lang];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

/** Hook: returns t() bound to the current UI language. */
export function useT() {
  const uiLang = useI18n((s) => s.uiLang);
  return (key: StringKey, vars?: Record<string, string | number>) => translate(uiLang, key, vars);
}

/** Non-hook variant for code outside components. */
export function tNow(key: StringKey, vars?: Record<string, string | number>): string {
  return translate(useI18n.getState().uiLang, key, vars);
}
