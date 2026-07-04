import React from "react";
import { Image, Page as PdfPage, Text, View } from "@react-pdf/renderer";
import type { Page, PaletteColor, Project } from "../types/project";
import type { PdfTokens } from "./theme";

export interface RenderContext {
  tokens: PdfTokens;
  project: Project;
  /** filename -> object URL for uploaded images */
  imageUrls: Map<string, string>;
  /** total number of pages in the exported language version */
  pageCount: number;
}

// ---- field access helpers -------------------------------------------------

export function fieldStr(page: Page, ...keys: string[]): string {
  for (const key of keys) {
    const v = page.fields[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && v.length && typeof v[0] === "string") {
      return (v as string[]).join("\n");
    }
  }
  return "";
}

export function fieldList(page: Page, ...keys: string[]): string[] {
  for (const key of keys) {
    const v = page.fields[key];
    if (Array.isArray(v) && v.length && typeof v[0] === "string") return v as string[];
    if (typeof v === "string" && v.trim()) {
      return v
        .split(/\r?\n|·|;/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function fieldPalette(page: Page): PaletteColor[] {
  const v = page.fields.palette;
  if (Array.isArray(v) && v.length && typeof v[0] === "object") return v as PaletteColor[];
  return [];
}

export function pageImageUrl(ctx: RenderContext, filename: string | undefined): string | undefined {
  if (!filename) return undefined;
  return ctx.imageUrls.get(filename.trim());
}

export function totalTextLength(page: Page): number {
  let n = 0;
  for (const v of Object.values(page.fields)) {
    if (typeof v === "string") n += v.length;
    else if (Array.isArray(v)) {
      for (const item of v) n += typeof item === "string" ? item.length : 12;
    }
  }
  return n;
}

// ---- building blocks ------------------------------------------------------

/** A4 page with themed background and standard footer. */
export function PageFrame({
  ctx,
  page,
  children,
  padded = true,
  footer = true,
}: {
  ctx: RenderContext;
  page: Page;
  children: React.ReactNode;
  padded?: boolean;
  footer?: boolean;
}) {
  const { tokens } = ctx;
  const c = tokens.theme.colors;
  return (
    <PdfPage
      size="A4"
      style={{
        backgroundColor: c.background,
        fontFamily: tokens.font.body,
        color: c.text,
        paddingTop: padded ? tokens.margin : 0,
        paddingHorizontal: padded ? tokens.margin : 0,
        paddingBottom: padded ? tokens.margin + 14 : 0,
      }}
    >
      {children}
      {footer && <Footer ctx={ctx} page={page} onDark={!padded} />}
    </PdfPage>
  );
}

export function Footer({ ctx, page, onDark }: { ctx: RenderContext; page: Page; onDark?: boolean }) {
  const { tokens, project } = ctx;
  const c = tokens.theme.colors;
  const color = onDark ? "#FFFFFF" : c.footerText;
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 16,
        left: tokens.margin,
        right: tokens.margin,
        flexDirection: "row",
        justifyContent: "space-between",
        opacity: onDark ? 0.85 : 1,
      }}
    >
      <Text style={{ fontSize: tokens.size.footer, color, letterSpacing: 1 }}>
        {project.projectMeta.title.toUpperCase()}
      </Text>
      <Text style={{ fontSize: tokens.size.footer, color }}>Page {page.pageNumber}</Text>
    </View>
  );
}

export function SectionHeading({ ctx, children }: { ctx: RenderContext; children: string }) {
  const { tokens } = ctx;
  return (
    <View style={{ marginBottom: 6, marginTop: 2 }}>
      <Text
        style={{
          fontFamily: tokens.font.body,
          fontSize: tokens.size.sectionHeading,
          fontWeight: 600,
          letterSpacing: 2,
          color: tokens.theme.colors.accent,
        }}
      >
        {children.toUpperCase()}
      </Text>
      <View
        style={{
          marginTop: 4,
          width: 26,
          height: 1.2,
          backgroundColor: tokens.theme.colors.accent,
          opacity: 0.7,
        }}
      />
    </View>
  );
}

export function BodyText({
  ctx,
  children,
  size,
  color,
  style,
}: {
  ctx: RenderContext;
  children: string;
  size?: number;
  color?: string;
  style?: object;
}) {
  const { tokens } = ctx;
  return (
    <Text
      style={{
        fontSize: size ?? tokens.size.body,
        lineHeight: tokens.leading.body,
        color: color ?? tokens.theme.colors.text,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

export function BulletList({
  ctx,
  items,
  size,
  numbered = false,
  color,
}: {
  ctx: RenderContext;
  items: string[];
  size?: number;
  numbered?: boolean;
  color?: string;
}) {
  const { tokens } = ctx;
  const fs = size ?? tokens.size.body;
  const textColor = color ?? tokens.theme.colors.text;
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 3.5 }}>
          <Text
            style={{
              fontSize: fs,
              width: numbered ? 16 : 14,
              color: tokens.theme.colors.accent,
              fontWeight: 600,
            }}
          >
            {numbered ? `${i + 1}.` : "–"}
          </Text>
          <Text style={{ fontSize: fs, lineHeight: tokens.leading.body, color: textColor, flex: 1 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function PaletteStrip({
  ctx,
  colors,
  compact = false,
}: {
  ctx: RenderContext;
  colors: PaletteColor[];
  compact?: boolean;
}) {
  const { tokens } = ctx;
  if (!colors.length) return null;
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {colors.map((color, i) => (
        <View key={i} style={{ alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: "100%",
              height: compact ? 18 : 30,
              borderRadius: 3,
              backgroundColor: isValidHex(color.hex) ? color.hex : tokens.theme.colors.surface,
              borderWidth: 0.5,
              borderColor: tokens.theme.colors.divider,
            }}
          />
          {!compact && (
            <>
              <Text style={{ fontSize: 6.5, marginTop: 3, color: tokens.theme.colors.textMuted }}>
                {color.name}
              </Text>
              <Text style={{ fontSize: 6, color: tokens.theme.colors.textMuted, opacity: 0.8 }}>
                {color.hex}
              </Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

export function isValidHex(hex: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex ?? "");
}

export function HeroImage({
  ctx,
  filename,
  height,
  radius = 4,
}: {
  ctx: RenderContext;
  filename: string | undefined;
  height: number;
  radius?: number;
}) {
  const url = pageImageUrl(ctx, filename);
  const { tokens } = ctx;
  if (!url) {
    return (
      <View
        style={{
          height,
          borderRadius: radius,
          backgroundColor: tokens.theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 0.75,
          borderColor: tokens.theme.colors.divider,
        }}
      >
        <Text style={{ fontSize: 8, color: tokens.theme.colors.textMuted, letterSpacing: 1 }}>
          {filename ? `MISSING IMAGE  ·  ${filename}` : "NO IMAGE SET"}
        </Text>
      </View>
    );
  }
  return (
    <View style={{ height, borderRadius: radius, overflow: "hidden" }}>
      <Image src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </View>
  );
}

export function MetaChips({ ctx, entries }: { ctx: RenderContext; entries: [string, string][] }) {
  const { tokens } = ctx;
  const filled = entries.filter(([, v]) => v);
  if (!filled.length) return null;
  return (
    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
      {filled.map(([label, value], i) => (
        <View
          key={i}
          style={{
            backgroundColor: tokens.theme.colors.surface,
            borderRadius: 3,
            paddingVertical: 4,
            paddingHorizontal: 8,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 6,
              letterSpacing: 1.2,
              color: tokens.theme.colors.textMuted,
              marginBottom: 1.5,
            }}
          >
            {label.toUpperCase()}
          </Text>
          <Text style={{ fontSize: 8.5, fontWeight: 600, color: tokens.theme.colors.heading }}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function TitleBlock({
  ctx,
  page,
  align = "left",
  color,
  subtitleColor,
}: {
  ctx: RenderContext;
  page: Page;
  align?: "left" | "center";
  color?: string;
  subtitleColor?: string;
}) {
  const { tokens } = ctx;
  const title = fieldStr(page, "title");
  const subtitle = fieldStr(page, "subtitle", "intro");
  return (
    <View style={{ alignItems: align === "center" ? "center" : "flex-start" }}>
      {title ? (
        <Text
          style={{
            fontFamily: tokens.font.display,
            fontSize: tokens.size.title,
            fontWeight: 600,
            color: color ?? tokens.theme.colors.heading,
            textAlign: align,
            lineHeight: tokens.leading.tight,
          }}
        >
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text
          style={{
            fontSize: tokens.size.subtitle,
            color: subtitleColor ?? tokens.theme.colors.textMuted,
            marginTop: 6,
            textAlign: align,
            lineHeight: 1.45,
            maxWidth: align === "center" ? "82%" : "94%",
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function Divider({ ctx, spacing = 10 }: { ctx: RenderContext; spacing?: number }) {
  return (
    <View
      style={{
        height: 0.75,
        backgroundColor: ctx.tokens.theme.colors.divider,
        marginVertical: spacing,
      }}
    />
  );
}
