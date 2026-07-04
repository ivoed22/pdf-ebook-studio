import { Document, Image, Page, Text, View, pdf } from "@react-pdf/renderer";
import type { Language, Project } from "../../types/project";
import { getTheme } from "../../data/themes/themes";
import { registerFonts } from "../../pdf/fonts";
import type { RenderedPage } from "./pdfToImages";

const COLS = 3;
const ROWS = 4;

/** Builds a multi-page A4 contact sheet PDF from rasterized page previews. */
export async function renderContactSheet(
  project: Project,
  language: Language,
  previews: RenderedPage[],
): Promise<Blob> {
  registerFonts();
  const theme = getTheme(project.projectMeta.theme);
  const c = theme.colors;
  const urls = previews.map((p) => ({ ...p, url: URL.createObjectURL(p.blob) }));
  const perSheet = COLS * ROWS;
  const sheets: (typeof urls)[] = [];
  for (let i = 0; i < urls.length; i += perSheet) sheets.push(urls.slice(i, i + perSheet));
  if (!sheets.length) sheets.push([]);

  const doc = (
    <Document title={`${project.projectMeta.title} — Contact Sheet (${language.toUpperCase()})`}>
      {sheets.map((sheet, s) => (
        <Page key={s} size="A4" style={{ backgroundColor: c.background, padding: 30 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 14,
              alignItems: "flex-end",
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 15,
                fontWeight: 600,
                color: c.heading,
              }}
            >
              {project.projectMeta.title}
            </Text>
            <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, color: c.textMuted }}>
              Contact sheet · {language.toUpperCase()} · Sheet {s + 1}/{sheets.length}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {sheet.map((item) => (
              <View key={item.pageNumber} style={{ width: "31.5%" }}>
                <Image
                  src={item.url}
                  style={{
                    width: "100%",
                    borderRadius: 2,
                  }}
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 7,
                    color: c.textMuted,
                    textAlign: "center",
                    marginTop: 3,
                    marginBottom: 4,
                  }}
                >
                  Page {item.pageNumber}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );

  try {
    return await pdf(doc).toBlob();
  } finally {
    for (const u of urls) URL.revokeObjectURL(u.url);
  }
}
