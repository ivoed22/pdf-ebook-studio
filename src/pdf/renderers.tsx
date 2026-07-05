import { Image, Text, View } from "@react-pdf/renderer";
import type { Page, PaletteColor } from "../types/project";
import type { RendererKind } from "../types/template";
import { rendererFor } from "../core/templates/registry";
import { bodySizeForAmount } from "./theme";
import {
  BodyText,
  BulletList,
  Divider,
  HeroImage,
  MetaChips,
  PageFrame,
  PaletteStrip,
  SectionHeading,
  TitleBlock,
  fieldFocus,
  fieldList,
  fieldPalette,
  fieldStr,
  focusPosition,
  pageImageUrl,
  totalTextLength,
  type RenderContext,
} from "./components";

interface RendererProps {
  ctx: RenderContext;
  page: Page;
}

// ---------------------------------------------------------------- covers ---

function CoverEditorial({ ctx, page }: RendererProps) {
  const { tokens, project } = ctx;
  const c = tokens.theme.colors;
  const author = fieldStr(page, "author") || project.projectMeta.author || "";
  const year = fieldStr(page, "year") || project.projectMeta.year || "";
  const tagline = fieldStr(page, "tagline");
  return (
    <PageFrame ctx={ctx} page={page} footer={false}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 7.5, letterSpacing: 2.5, color: c.textMuted }}>
            {(author || project.projectMeta.title).toUpperCase()}
          </Text>
          {year ? (
            <Text style={{ fontSize: 7.5, letterSpacing: 2.5, color: c.textMuted }}>{year}</Text>
          ) : null}
        </View>
        <HeroImage ctx={ctx} filename={fieldStr(page, "heroImage")} focus={fieldFocus(page, "heroImage")} height={430} radius={5} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 26 }}>
          <View style={{ width: 30, height: 1.5, backgroundColor: c.accent, marginBottom: 18 }} />
          <Text
            style={{
              fontFamily: tokens.font.display,
              fontSize: tokens.size.coverTitle,
              fontWeight: 600,
              color: c.heading,
              textAlign: "center",
              lineHeight: 1.12,
            }}
          >
            {fieldStr(page, "title") || project.projectMeta.title}
          </Text>
          {fieldStr(page, "subtitle") ? (
            <Text
              style={{
                fontSize: 12,
                color: c.textMuted,
                textAlign: "center",
                marginTop: 12,
                maxWidth: "78%",
                lineHeight: 1.5,
              }}
            >
              {fieldStr(page, "subtitle")}
            </Text>
          ) : null}
          {tagline ? (
            <Text
              style={{
                fontSize: 8.5,
                letterSpacing: 2,
                color: c.accent,
                marginTop: 14,
              }}
            >
              {tagline.toUpperCase()}
            </Text>
          ) : null}
        </View>
      </View>
    </PageFrame>
  );
}

function CoverFullBleed({ ctx, page }: RendererProps) {
  const { tokens, project } = ctx;
  const url = pageImageUrl(ctx, fieldStr(page, "heroImage"));
  return (
    <PageFrame ctx={ctx} page={page} padded={false} footer={false}>
      {url ? (
        <Image
          src={url}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: focusPosition(fieldFocus(page, "heroImage")) }}
        />
      ) : (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: tokens.theme.colors.surface,
          }}
        />
      )}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 320,
          backgroundColor: "#000000",
          opacity: 0.45,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: tokens.margin,
          right: tokens.margin,
          bottom: 64,
        }}
      >
        <View style={{ width: 30, height: 1.5, backgroundColor: "#FFFFFF", marginBottom: 14, opacity: 0.9 }} />
        <Text
          style={{
            fontFamily: tokens.font.display,
            fontSize: 36,
            fontWeight: 600,
            color: "#FFFFFF",
            lineHeight: 1.12,
          }}
        >
          {fieldStr(page, "title") || project.projectMeta.title}
        </Text>
        {fieldStr(page, "subtitle") ? (
          <Text style={{ fontSize: 11.5, color: "#FFFFFF", opacity: 0.9, marginTop: 10, lineHeight: 1.5, maxWidth: "84%" }}>
            {fieldStr(page, "subtitle")}
          </Text>
        ) : null}
      </View>
    </PageFrame>
  );
}

// -------------------------------------------------------------- concepts ---

function HeroTopContent({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const body = fieldStr(page, "body", "designConcept", "text");
  const whyItWorks = fieldStr(page, "whyItWorks");
  const howToRecreate = fieldStr(page, "howToRecreate");
  const palette = fieldPalette(page);
  const materials = fieldList(page, "materials");
  const notes = fieldList(page, "designNotes", "plantingNotes", "maintenanceNotes", "notes", "imageNotes");
  const styleTags = fieldList(page, "styleTags");
  const fs = bodySizeForAmount(tokens.size.body, totalTextLength(page), 1500);

  return (
    <PageFrame ctx={ctx} page={page}>
      <HeroImage ctx={ctx} filename={fieldStr(page, "heroImage")} focus={fieldFocus(page, "heroImage")} height={272} />
      <View style={{ marginTop: 18 }}>
        <TitleBlock ctx={ctx} page={page} />
      </View>
      <Divider ctx={ctx} spacing={12} />
      <View style={{ flexDirection: "row", gap: 20, flex: 1 }}>
        <View style={{ flex: 1.25 }}>
          {whyItWorks ? (
            <View style={{ marginBottom: 12 }}>
              <SectionHeading ctx={ctx}>Why it works</SectionHeading>
              <BodyText ctx={ctx} size={fs}>{whyItWorks}</BodyText>
            </View>
          ) : null}
          {howToRecreate ? (
            <View style={{ marginBottom: 12 }}>
              <SectionHeading ctx={ctx}>How to recreate</SectionHeading>
              <BodyText ctx={ctx} size={fs}>{howToRecreate}</BodyText>
            </View>
          ) : null}
          {!whyItWorks && !howToRecreate && body ? (
            <View style={{ marginBottom: 12 }}>
              <BodyText ctx={ctx} size={fs}>{body}</BodyText>
            </View>
          ) : null}
        </View>
        <View style={{ flex: 0.95 }}>
          {palette.length ? (
            <View style={{ marginBottom: 12 }}>
              <SectionHeading ctx={ctx}>Palette</SectionHeading>
              <PaletteStrip ctx={ctx} colors={palette} />
            </View>
          ) : null}
          {materials.length ? (
            <View style={{ marginBottom: 12 }}>
              <SectionHeading ctx={ctx}>Materials</SectionHeading>
              <BulletList ctx={ctx} items={materials} size={fs - 0.5} />
            </View>
          ) : null}
          {notes.length ? (
            <View style={{ marginBottom: 12 }}>
              <SectionHeading ctx={ctx}>Design notes</SectionHeading>
              <BulletList ctx={ctx} items={notes} size={fs - 0.5} />
            </View>
          ) : null}
          {styleTags.length ? (
            <Text style={{ fontSize: 7, letterSpacing: 1.4, color: tokens.theme.colors.accent }}>
              {styleTags.join("  ·  ").toUpperCase()}
            </Text>
          ) : null}
        </View>
      </View>
    </PageFrame>
  );
}

function SideImageContent({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const palette = fieldPalette(page);
  const materials = fieldList(page, "materials");
  const notes = fieldList(page, "designNotes", "plantingNotes", "maintenanceNotes", "notes");
  const whyItWorks = fieldStr(page, "whyItWorks");
  const howToRecreate = fieldStr(page, "howToRecreate");
  const body = fieldStr(page, "body", "designConcept", "text");
  const fs = bodySizeForAmount(tokens.size.body, totalTextLength(page), 1400);

  return (
    <PageFrame ctx={ctx} page={page}>
      <View style={{ flexDirection: "row", gap: 18, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <HeroImage ctx={ctx} filename={fieldStr(page, "heroImage")} focus={fieldFocus(page, "heroImage")} height={560} />
          {palette.length ? (
            <View style={{ marginTop: 12 }}>
              <PaletteStrip ctx={ctx} colors={palette} />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <TitleBlock ctx={ctx} page={page} />
          <Divider ctx={ctx} spacing={12} />
          {whyItWorks ? (
            <View style={{ marginBottom: 12 }}>
              <SectionHeading ctx={ctx}>Why it works</SectionHeading>
              <BodyText ctx={ctx} size={fs}>{whyItWorks}</BodyText>
            </View>
          ) : null}
          {howToRecreate ? (
            <View style={{ marginBottom: 12 }}>
              <SectionHeading ctx={ctx}>How to recreate</SectionHeading>
              <BodyText ctx={ctx} size={fs}>{howToRecreate}</BodyText>
            </View>
          ) : null}
          {body && !whyItWorks && !howToRecreate ? (
            <View style={{ marginBottom: 12 }}>
              <BodyText ctx={ctx} size={fs}>{body}</BodyText>
            </View>
          ) : null}
          {materials.length ? (
            <View style={{ marginBottom: 12 }}>
              <SectionHeading ctx={ctx}>Materials</SectionHeading>
              <BulletList ctx={ctx} items={materials} size={fs - 0.5} />
            </View>
          ) : null}
          {notes.length ? (
            <View>
              <SectionHeading ctx={ctx}>Notes</SectionHeading>
              <BulletList ctx={ctx} items={notes} size={fs - 0.5} />
            </View>
          ) : null}
        </View>
      </View>
    </PageFrame>
  );
}

function FullBleedOverlay({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const url = pageImageUrl(ctx, fieldStr(page, "heroImage"));
  const body = fieldStr(page, "whyItWorks", "body", "designConcept");
  return (
    <PageFrame ctx={ctx} page={page} padded={false}>
      {url ? (
        <Image
          src={url}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: focusPosition(fieldFocus(page, "heroImage")) }}
        />
      ) : (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: tokens.theme.colors.surface,
          }}
        />
      )}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 250,
          backgroundColor: "#000000",
          opacity: 0.5,
        }}
      />
      <View style={{ position: "absolute", left: tokens.margin, right: tokens.margin, bottom: 52 }}>
        <Text
          style={{
            fontFamily: tokens.font.display,
            fontSize: 24,
            fontWeight: 600,
            color: "#FFFFFF",
            lineHeight: 1.15,
          }}
        >
          {fieldStr(page, "title")}
        </Text>
        {fieldStr(page, "subtitle") ? (
          <Text style={{ fontSize: 10.5, color: "#FFFFFF", opacity: 0.92, marginTop: 6, lineHeight: 1.45 }}>
            {fieldStr(page, "subtitle")}
          </Text>
        ) : null}
        {body ? (
          <Text
            style={{
              fontSize: 9,
              color: "#FFFFFF",
              opacity: 0.85,
              marginTop: 10,
              lineHeight: 1.5,
              maxWidth: "88%",
            }}
          >
            {body}
          </Text>
        ) : null}
      </View>
    </PageFrame>
  );
}

function MoodboardGrid({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const images = fieldList(page, "images");
  const hero = fieldStr(page, "heroImage");
  const all = [...(hero ? [hero] : []), ...images].slice(0, 6);
  const palette = fieldPalette(page);
  const notes = fieldList(page, "designNotes", "imageNotes", "materials", "notes", "items");
  const cellHeight = all.length > 4 ? 168 : 208;
  return (
    <PageFrame ctx={ctx} page={page}>
      <TitleBlock ctx={ctx} page={page} />
      <Divider ctx={ctx} spacing={12} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {(all.length ? all : [undefined, undefined, undefined, undefined]).map((f, i) => (
          <View key={i} style={{ width: "48.5%" }}>
            <HeroImage ctx={ctx} filename={f} height={cellHeight} radius={3} />
          </View>
        ))}
      </View>
      <View style={{ marginTop: 14, flexDirection: "row", gap: 20 }}>
        {palette.length ? (
          <View style={{ flex: 1 }}>
            <SectionHeading ctx={ctx}>Palette</SectionHeading>
            <PaletteStrip ctx={ctx} colors={palette} />
          </View>
        ) : null}
        {notes.length ? (
          <View style={{ flex: 1.2 }}>
            <SectionHeading ctx={ctx}>Notes</SectionHeading>
            <BulletList ctx={ctx} items={notes.slice(0, 6)} size={tokens.size.small} />
          </View>
        ) : null}
      </View>
    </PageFrame>
  );
}

function TwoImageCompare({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const imageA = fieldStr(page, "imageA") || fieldStr(page, "heroImage");
  const imageB = fieldStr(page, "imageB") || fieldList(page, "images")[0] || "";
  const labelA = fieldStr(page, "labelA") || "Before";
  const labelB = fieldStr(page, "labelB") || "After";
  const body = fieldStr(page, "body", "howToRecreate", "whyItWorks", "designConcept");
  const notes = fieldList(page, "designNotes", "notes");
  return (
    <PageFrame ctx={ctx} page={page}>
      <TitleBlock ctx={ctx} page={page} />
      <Divider ctx={ctx} spacing={12} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[
          [imageA, labelA],
          [imageB, labelB],
        ].map(([img, label], i) => (
          <View key={i} style={{ flex: 1 }}>
            <HeroImage ctx={ctx} filename={img || undefined} height={300} radius={3} />
            <Text
              style={{
                fontSize: 8,
                letterSpacing: 2,
                color: tokens.theme.colors.accent,
                marginTop: 7,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {String(label).toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
      {body ? (
        <View style={{ marginTop: 14 }}>
          <SectionHeading ctx={ctx}>Direction</SectionHeading>
          <BodyText ctx={ctx}>{body}</BodyText>
        </View>
      ) : null}
      {notes.length ? (
        <View style={{ marginTop: 12 }}>
          <BulletList ctx={ctx} items={notes} size={tokens.size.small} />
        </View>
      ) : null}
    </PageFrame>
  );
}

// ------------------------------------------------------------------ text ---

function TextEditorial({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const body = fieldStr(page, "body", "intro", "text", "whyItWorks", "designConcept");
  const hero = fieldStr(page, "heroImage");
  const takeaways = fieldList(page, "keyTakeaways", "items", "checklistItems");
  const quote = fieldStr(page, "quote");
  const chapterLabel = fieldStr(page, "chapterLabel");
  const fs = bodySizeForAmount(tokens.size.body + 0.5, totalTextLength(page), 2600);
  return (
    <PageFrame ctx={ctx} page={page}>
      {chapterLabel ? (
        <Text style={{ fontSize: 8, letterSpacing: 2.5, color: tokens.theme.colors.accent, marginBottom: 8 }}>
          {chapterLabel.toUpperCase()}
        </Text>
      ) : null}
      <TitleBlock ctx={ctx} page={page} />
      {hero ? (
        <View style={{ marginTop: 14 }}>
          <HeroImage ctx={ctx} filename={hero} height={190} focus={fieldFocus(page, "heroImage")} />
        </View>
      ) : null}
      <Divider ctx={ctx} spacing={14} />
      <View style={{ flex: 1 }}>
        {body ? (
          <BodyText ctx={ctx} size={fs} style={{ marginBottom: 12 }}>
            {body}
          </BodyText>
        ) : null}
        {quote ? (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: tokens.theme.colors.accent,
              paddingLeft: 12,
              marginVertical: 10,
            }}
          >
            <Text
              style={{
                fontFamily: tokens.font.display,
                fontStyle: "italic",
                fontSize: 13,
                color: tokens.theme.colors.heading,
                lineHeight: 1.5,
              }}
            >
              {quote}
            </Text>
          </View>
        ) : null}
        {takeaways.length ? (
          <View style={{ marginTop: 6 }}>
            <SectionHeading ctx={ctx}>Key takeaways</SectionHeading>
            <BulletList ctx={ctx} items={takeaways} />
          </View>
        ) : null}
      </View>
    </PageFrame>
  );
}

function TwoColumnText({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const body = fieldStr(page, "body", "text");
  const hero = fieldStr(page, "heroImage");
  const paragraphs = body.split(/\n{2,}|\n/).filter(Boolean);
  const half = Math.ceil(paragraphs.length / 2);
  const fs = bodySizeForAmount(tokens.size.body, totalTextLength(page), 3400);
  return (
    <PageFrame ctx={ctx} page={page}>
      <TitleBlock ctx={ctx} page={page} />
      {hero ? (
        <View style={{ marginTop: 12 }}>
          <HeroImage ctx={ctx} filename={hero} height={150} focus={fieldFocus(page, "heroImage")} />
        </View>
      ) : null}
      <Divider ctx={ctx} spacing={14} />
      <View style={{ flexDirection: "row", gap: 18, flex: 1 }}>
        {[paragraphs.slice(0, half), paragraphs.slice(half)].map((col, i) => (
          <View key={i} style={{ flex: 1 }}>
            {col.map((p, j) => (
              <BodyText key={j} ctx={ctx} size={fs} style={{ marginBottom: 8 }}>
                {p}
              </BodyText>
            ))}
          </View>
        ))}
      </View>
    </PageFrame>
  );
}

function ChecklistPage({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const items = fieldList(
    page,
    "checklistItems",
    "items",
    "designNotes",
    "maintenanceNotes",
    "keyTakeaways",
    "ingredients",
    "body",
  );
  const intro = fieldStr(page, "intro", "subtitle") ? "" : fieldStr(page, "body");
  const fs = items.length > 16 ? tokens.size.small + 0.5 : tokens.size.body;
  return (
    <PageFrame ctx={ctx} page={page}>
      <TitleBlock ctx={ctx} page={page} />
      {intro ? (
        <BodyText ctx={ctx} style={{ marginTop: 10 }}>
          {intro}
        </BodyText>
      ) : null}
      <Divider ctx={ctx} spacing={14} />
      <View style={{ flex: 1 }}>
        {items.map((item, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 9,
              paddingBottom: 9,
              borderBottomWidth: i === items.length - 1 ? 0 : 0.5,
              borderBottomColor: tokens.theme.colors.divider,
            }}
          >
            <View
              style={{
                width: 11,
                height: 11,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: tokens.theme.colors.accent,
                marginRight: 10,
                marginTop: 1,
              }}
            />
            <Text style={{ fontSize: fs, lineHeight: 1.45, flex: 1, color: tokens.theme.colors.text }}>
              {item}
            </Text>
          </View>
        ))}
      </View>
    </PageFrame>
  );
}

function TablePage({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const columns = fieldList(page, "columns");
  const rows = fieldList(page, "rows", "items", "body");
  const nutrition = fieldList(page, "nutrition");
  const data = rows.length ? rows : nutrition;
  const cells = data.map((r) => r.split("|").map((c) => c.trim()));
  const colCount = Math.max(columns.length, ...cells.map((r) => r.length), 1);
  return (
    <PageFrame ctx={ctx} page={page}>
      <TitleBlock ctx={ctx} page={page} />
      <Divider ctx={ctx} spacing={14} />
      {columns.length ? (
        <View
          style={{
            flexDirection: "row",
            backgroundColor: tokens.theme.colors.surface,
            borderRadius: 3,
            paddingVertical: 7,
            paddingHorizontal: 8,
            marginBottom: 2,
          }}
        >
          {Array.from({ length: colCount }).map((_, i) => (
            <Text
              key={i}
              style={{
                flex: 1,
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 1,
                color: tokens.theme.colors.heading,
              }}
            >
              {(columns[i] ?? "").toUpperCase()}
            </Text>
          ))}
        </View>
      ) : null}
      {cells.map((row, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            paddingVertical: 7,
            paddingHorizontal: 8,
            borderBottomWidth: 0.5,
            borderBottomColor: tokens.theme.colors.divider,
          }}
        >
          {Array.from({ length: colCount }).map((_, j) => (
            <Text key={j} style={{ flex: 1, fontSize: 9, color: tokens.theme.colors.text, lineHeight: 1.4 }}>
              {row[j] ?? ""}
            </Text>
          ))}
        </View>
      ))}
    </PageFrame>
  );
}

function SectionDivider({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const url = pageImageUrl(ctx, fieldStr(page, "heroImage"));
  const label = fieldStr(page, "chapterLabel", "sectionLabel");
  const c = tokens.theme.colors;
  if (url) {
    return (
      <PageFrame ctx={ctx} page={page} padded={false}>
        <Image
          src={url}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: focusPosition(fieldFocus(page, "heroImage")) }}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#000000",
            opacity: 0.42,
          }}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: tokens.margin }}>
          {label ? (
            <Text style={{ fontSize: 9, letterSpacing: 3, color: "#FFFFFF", opacity: 0.9, marginBottom: 14 }}>
              {label.toUpperCase()}
            </Text>
          ) : null}
          <Text
            style={{
              fontFamily: tokens.font.display,
              fontSize: 32,
              fontWeight: 600,
              color: "#FFFFFF",
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            {fieldStr(page, "title")}
          </Text>
          {fieldStr(page, "subtitle") ? (
            <Text
              style={{
                fontSize: 11,
                color: "#FFFFFF",
                opacity: 0.9,
                marginTop: 10,
                textAlign: "center",
                maxWidth: "72%",
                lineHeight: 1.5,
              }}
            >
              {fieldStr(page, "subtitle")}
            </Text>
          ) : null}
        </View>
      </PageFrame>
    );
  }
  return (
    <PageFrame ctx={ctx} page={page}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {label ? (
          <Text style={{ fontSize: 9, letterSpacing: 3, color: c.accent, marginBottom: 16 }}>
            {label.toUpperCase()}
          </Text>
        ) : null}
        <View style={{ width: 34, height: 1.5, backgroundColor: c.accent, marginBottom: 20 }} />
        <Text
          style={{
            fontFamily: tokens.font.display,
            fontSize: 32,
            fontWeight: 600,
            color: c.heading,
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          {fieldStr(page, "title")}
        </Text>
        {fieldStr(page, "subtitle") ? (
          <Text
            style={{
              fontSize: 11,
              color: c.textMuted,
              marginTop: 12,
              textAlign: "center",
              maxWidth: "70%",
              lineHeight: 1.5,
            }}
          >
            {fieldStr(page, "subtitle")}
          </Text>
        ) : null}
      </View>
    </PageFrame>
  );
}

function IndexPage({ ctx, page }: RendererProps) {
  const { tokens, project } = ctx;
  const explicit = fieldList(page, "items", "body");
  const entries: [string, string][] = explicit.length
    ? explicit.map((line) => {
        const m = /^(.*?)(?:\s*\.{2,}\s*|\s*\|\s*)(\d+)\s*$/.exec(line);
        return m ? [m[1].trim(), m[2]] : [line, ""];
      })
    : project.pages
        .filter(
          (p) =>
            p.language === page.language &&
            p.id !== page.id &&
            typeof p.fields.title === "string" &&
            p.fields.title,
        )
        .map((p) => [String(p.fields.title), String(p.pageNumber)]);
  return (
    <PageFrame ctx={ctx} page={page}>
      <TitleBlock ctx={ctx} page={page} />
      <Divider ctx={ctx} spacing={14} />
      <View style={{ flex: 1 }}>
        {entries.map(([label, num], i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 10.5, color: tokens.theme.colors.text }}>{label}</Text>
            <View
              style={{
                flex: 1,
                borderBottomWidth: 0.6,
                borderBottomColor: tokens.theme.colors.divider,
                marginHorizontal: 6,
                marginBottom: 2,
              }}
            />
            <Text style={{ fontSize: 10.5, color: tokens.theme.colors.accent, fontWeight: 600 }}>{num}</Text>
          </View>
        ))}
      </View>
    </PageFrame>
  );
}

function ImageQuote({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const quote = fieldStr(page, "quote", "body", "subtitle");
  const attribution = fieldStr(page, "attribution", "author");
  return (
    <PageFrame ctx={ctx} page={page}>
      <HeroImage ctx={ctx} filename={fieldStr(page, "heroImage")} focus={fieldFocus(page, "heroImage")} height={430} />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 22, color: tokens.theme.colors.accent, fontFamily: tokens.font.display }}>
          “
        </Text>
        <Text
          style={{
            fontFamily: tokens.font.display,
            fontStyle: "italic",
            fontSize: 16,
            color: tokens.theme.colors.heading,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {quote}
        </Text>
        {attribution ? (
          <Text style={{ fontSize: 8.5, letterSpacing: 2, color: tokens.theme.colors.textMuted, marginTop: 12 }}>
            {`— ${attribution}`.toUpperCase()}
          </Text>
        ) : null}
      </View>
    </PageFrame>
  );
}

function WorkbookPage({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const prompts = fieldList(page, "items", "checklistItems", "body");
  return (
    <PageFrame ctx={ctx} page={page}>
      <TitleBlock ctx={ctx} page={page} />
      <Divider ctx={ctx} spacing={14} />
      <View style={{ flex: 1 }}>
        {(prompts.length ? prompts : ["Notes"]).map((prompt, i) => (
          <View key={i} style={{ marginBottom: 18 }}>
            <Text
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: tokens.theme.colors.heading,
                marginBottom: 10,
              }}
            >
              {prompt}
            </Text>
            {[0, 1, 2].map((line) => (
              <View
                key={line}
                style={{
                  borderBottomWidth: 0.6,
                  borderBottomColor: tokens.theme.colors.divider,
                  height: 16,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </PageFrame>
  );
}

// --------------------------------------------------------------- recipes ---

function recipeMeta(page: Page): [string, string][] {
  return [
    ["Prep", fieldStr(page, "prepTime")],
    ["Cook", fieldStr(page, "cookTime")],
    ["Total", fieldStr(page, "totalTime")],
    ["Serves", fieldStr(page, "servings")],
    ["Level", fieldStr(page, "difficulty")],
  ];
}

function RecipeHero({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const ingredients = fieldList(page, "ingredients");
  const steps = fieldList(page, "steps");
  const notes = fieldStr(page, "notes");
  const nutrition = fieldList(page, "nutrition");
  const fs = bodySizeForAmount(tokens.size.body, totalTextLength(page), 1700);
  return (
    <PageFrame ctx={ctx} page={page}>
      <HeroImage ctx={ctx} filename={fieldStr(page, "heroImage")} focus={fieldFocus(page, "heroImage")} height={238} />
      <View style={{ marginTop: 16 }}>
        <TitleBlock ctx={ctx} page={page} />
      </View>
      <View style={{ marginTop: 10 }}>
        <MetaChips ctx={ctx} entries={recipeMeta(page)} />
      </View>
      <Divider ctx={ctx} spacing={12} />
      <View style={{ flexDirection: "row", gap: 20, flex: 1 }}>
        <View style={{ flex: 0.9 }}>
          <SectionHeading ctx={ctx}>Ingredients</SectionHeading>
          <BulletList ctx={ctx} items={ingredients} size={fs - 0.5} />
          {nutrition.length ? (
            <View style={{ marginTop: 12 }}>
              <SectionHeading ctx={ctx}>Nutrition</SectionHeading>
              <BulletList ctx={ctx} items={nutrition} size={fs - 1} />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1.35 }}>
          <SectionHeading ctx={ctx}>Method</SectionHeading>
          <BulletList ctx={ctx} items={steps} numbered size={fs} />
          {notes ? (
            <View
              style={{
                marginTop: 12,
                backgroundColor: tokens.theme.colors.surface,
                borderRadius: 4,
                padding: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 7,
                  letterSpacing: 1.5,
                  color: tokens.theme.colors.accent,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                NOTES
              </Text>
              <Text style={{ fontSize: fs - 0.5, lineHeight: 1.5, color: tokens.theme.colors.text }}>
                {notes}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </PageFrame>
  );
}

function RecipeSplit({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const ingredients = fieldList(page, "ingredients");
  const steps = fieldList(page, "steps");
  const notes = fieldStr(page, "notes");
  const fs = bodySizeForAmount(tokens.size.body, totalTextLength(page), 1600);
  return (
    <PageFrame ctx={ctx} page={page}>
      <View style={{ flexDirection: "row", gap: 18, flex: 1 }}>
        <View style={{ flex: 0.95 }}>
          <HeroImage ctx={ctx} filename={fieldStr(page, "heroImage")} focus={fieldFocus(page, "heroImage")} height={330} />
          <View style={{ marginTop: 14 }}>
            <SectionHeading ctx={ctx}>Ingredients</SectionHeading>
            <BulletList ctx={ctx} items={ingredients} size={fs - 0.5} />
          </View>
        </View>
        <View style={{ flex: 1.15 }}>
          <TitleBlock ctx={ctx} page={page} />
          <View style={{ marginTop: 10 }}>
            <MetaChips ctx={ctx} entries={recipeMeta(page)} />
          </View>
          <Divider ctx={ctx} spacing={12} />
          <SectionHeading ctx={ctx}>Method</SectionHeading>
          <BulletList ctx={ctx} items={steps} numbered size={fs} />
          {notes ? (
            <Text
              style={{
                fontSize: fs - 0.5,
                fontStyle: "italic",
                color: tokens.theme.colors.textMuted,
                marginTop: 10,
                lineHeight: 1.5,
              }}
            >
              {notes}
            </Text>
          ) : null}
        </View>
      </View>
    </PageFrame>
  );
}

// ------------------------------------------------------------------ etsy ---

function EtsyVisual({ ctx, page }: RendererProps) {
  const { tokens, project } = ctx;
  const c = tokens.theme.colors;
  const items = fieldList(page, "items", "checklistItems", "body");
  const palette = fieldPalette(page);
  const hero = fieldStr(page, "heroImage");
  return (
    <PageFrame ctx={ctx} page={page} footer={false}>
      <View
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: c.divider,
          borderRadius: 6,
          padding: 26,
          backgroundColor: c.background,
        }}
      >
        <Text style={{ fontSize: 8, letterSpacing: 2.5, color: c.accent, textAlign: "center" }}>
          {(project.projectMeta.title || "DIGITAL PRODUCT").toUpperCase()}
        </Text>
        <View style={{ marginTop: 14 }}>
          <TitleBlock ctx={ctx} page={page} align="center" />
        </View>
        {hero ? (
          <View style={{ marginTop: 16 }}>
            <HeroImage ctx={ctx} filename={hero} height={300} focus={fieldFocus(page, "heroImage")} />
          </View>
        ) : null}
        {items.length ? (
          <View style={{ marginTop: 18, paddingHorizontal: 30 }}>
            {items.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 8, alignItems: "center" }}>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: c.accent,
                    marginRight: 9,
                  }}
                />
                <Text style={{ fontSize: 11, color: c.text, flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {palette.length ? (
          <View style={{ marginTop: 18, paddingHorizontal: 20 }}>
            <PaletteStrip ctx={ctx} colors={palette} />
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 7.5, letterSpacing: 2, color: c.textMuted, textAlign: "center" }}>
          INSTANT DIGITAL DOWNLOAD · PRINTABLE A4 PDF
        </Text>
      </View>
    </PageFrame>
  );
}

// --------------------------------------------------------------- utility ---

function UtilityText({ ctx, page }: RendererProps) {
  const { tokens } = ctx;
  const body = fieldStr(page, "body", "text");
  const items = fieldList(page, "items", "checklistItems");
  return (
    <PageFrame ctx={ctx} page={page}>
      <TitleBlock ctx={ctx} page={page} />
      <Divider ctx={ctx} spacing={14} />
      {body ? (
        <BodyText ctx={ctx} style={{ marginBottom: 12 }}>
          {body}
        </BodyText>
      ) : null}
      {items.length ? <BulletList ctx={ctx} items={items} size={tokens.size.small + 0.5} /> : null}
    </PageFrame>
  );
}

// -------------------------------------------------------------- dispatch ---

const RENDERERS: Record<RendererKind, (props: RendererProps) => React.JSX.Element> = {
  "cover-editorial": CoverEditorial,
  "cover-full-bleed": CoverFullBleed,
  "hero-top-content": HeroTopContent,
  "side-image-content": SideImageContent,
  "full-bleed-overlay": FullBleedOverlay,
  "moodboard-grid": MoodboardGrid,
  "two-image-compare": TwoImageCompare,
  "text-editorial": TextEditorial,
  "two-column-text": TwoColumnText,
  "checklist-page": ChecklistPage,
  "table-page": TablePage,
  "section-divider": SectionDivider,
  "index-page": IndexPage,
  "image-quote": ImageQuote,
  "workbook-page": WorkbookPage,
  "recipe-hero": RecipeHero,
  "recipe-split": RecipeSplit,
  "etsy-visual": EtsyVisual,
  "utility-text": UtilityText,
};

export function renderPage(ctx: RenderContext, page: Page): React.JSX.Element {
  const Renderer = RENDERERS[rendererFor(page.template)];
  return <Renderer key={page.id} ctx={ctx} page={page} />;
}

export function paletteOrDefault(ctx: RenderContext, page: Page): PaletteColor[] {
  const own = fieldPalette(page);
  return own.length ? own : ctx.tokens.theme.defaultPalette;
}
