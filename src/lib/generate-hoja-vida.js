import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import JSZip from "jszip";
import { ESTADOS_PROCESO } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { getHojaVidaMeta } from "@/lib/hoja-vida-meta";

/** Arial 9pt = 18 half-points */
const FONT_PT9 = 18;

const BORDER = {
  style: BorderStyle.SINGLE,
  size: 8,
  color: "000000",
};

const CELL_BORDER = {
  top: BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
};

/** A4 con márgenes 1" del Multinuclear.docx ≈ 9029 DXA útiles */
const PAGE_CONTENT_WIDTH = 9000;

function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 280, after: 480 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32,
        font: "Arial",
        color: "000000",
      }),
    ],
  });
}

function sectionTitle(text, { center = false } = {}) {
  return new Paragraph({
    alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: 280, after: 200 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 12,
        color: "000000",
        space: 6,
      },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        font: "Arial",
        color: "000000",
      }),
    ],
  });
}

/** Padding de celda (DXA). Ayuda a que Word→PDF no aplaste el texto. */
const CELL_PAD = { top: 80, bottom: 80, left: 100, right: 100 };

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: CELL_BORDER,
    margins: CELL_PAD,
    shading: { fill: "E8E8E8" },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40, line: 276 },
        children: [
          new TextRun({
            text,
            bold: true,
            size: FONT_PT9,
            font: "Arial",
            color: "000000",
          }),
        ],
      }),
    ],
  });
}

function dataCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: CELL_BORDER,
    margins: CELL_PAD,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40, line: 276 },
        children: [
          new TextRun({
            text: text == null || text === "" ? "—" : String(text),
            size: FONT_PT9,
            font: "Arial",
            color: "000000",
          }),
        ],
      }),
    ],
  });
}

function buildBodyChildren(meta, rows) {
  const children = [
    heading(meta.titulo),
    new Paragraph({
      spacing: { after: 200 },
      children: [],
    }),
    sectionTitle("EXPERIENCIA", { center: true }),
  ];

  const wObjeto = 3400;
  const wEntidad = 2300;
  const wMonto = 1400;
  const wEstado = 1200;
  const wAnio = 700;
  const tableWidth = wObjeto + wEntidad + wMonto + wEstado + wAnio;

  if (rows.length === 0) {
    children.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: "Sin procesos registrados aún para esta empresa.",
            italics: true,
            size: FONT_PT9,
            font: "Arial",
            color: "000000",
          }),
        ],
      }),
    );
    return children;
  }

  const tableRows = [
    new TableRow({
      children: [
        headerCell("OBJETO DE CONTRATACIÓN", wObjeto),
        headerCell("ENTIDAD CONTRATANTE", wEntidad),
        headerCell("MONTO", wMonto),
        headerCell("ESTADO", wEstado),
        headerCell("AÑO", wAnio),
      ],
    }),
  ];

  for (const p of rows) {
    tableRows.push(
      new TableRow({
        children: [
          dataCell(p.objeto, wObjeto),
          dataCell(p.entidadContratante, wEntidad),
          dataCell(formatMoney(p.monto ?? 0), wMonto),
          dataCell(ESTADOS_PROCESO[p.estado] ?? p.estado, wEstado),
          dataCell(String(p.anio ?? "—"), wAnio),
        ],
      }),
    );
  }

  children.push(
    new Table({
      width: {
        size: Math.min(tableWidth, PAGE_CONTENT_WIDTH),
        type: WidthType.DXA,
      },
      layout: TableLayoutType.FIXED,
      columnWidths: [wObjeto, wEntidad, wMonto, wEstado, wAnio],
      rows: tableRows,
    }),
  );

  return children;
}

/**
 * Margen superior amplio para que el cuerpo no se meta debajo del
 * encabezado flotante (sobre todo desde la 2.ª página).
 * 2880 DXA ≈ 2".
 * No tocamos w:header: logo izq. + gráfico der. flotan relativos a él.
 */
const PAGE_TOP_MARGIN = 2880;
const DXA_TO_EMU = 635;

/** Solo sube w:top; deja w:header como en la plantilla. Sin pies. */
function withHeaderClearance(sectPrXml) {
  let xml = sectPrXml.replace(/<w:footerReference\b[^>]*\/>/gi, "");
  if (/\bw:top="/i.test(xml)) {
    xml = xml.replace(/\bw:top="\d+"/i, `w:top="${PAGE_TOP_MARGIN}"`);
  }
  return xml;
}

function readPgMarAttr(sectPrXml, attr, fallback) {
  const re = new RegExp(`\\bw:${attr}="(\\d+)"`, "i");
  const m = sectPrXml.match(re);
  return m ? Number(m[1]) : fallback;
}

/**
 * Si la plantilla tiene “primera página distinta” (titlePg) y el encabezado
 * rico está solo en first, úsalo también como default en todas las hojas.
 */
function preferFirstPageHeader(sectPrXml) {
  if (!/<w:titlePg\b/i.test(sectPrXml)) return sectPrXml;

  const firstMatch =
    sectPrXml.match(
      /<w:headerReference\b[^>]*\bw:type="first"[^>]*\br:id="([^"]+)"[^>]*\/>/i,
    ) ||
    sectPrXml.match(
      /<w:headerReference\b[^>]*\br:id="([^"]+)"[^>]*\bw:type="first"[^>]*\/>/i,
    );
  if (!firstMatch) return sectPrXml;

  const firstId = firstMatch[1];
  let xml = sectPrXml.replace(/<w:titlePg\b[^>]*\/>/gi, "");

  if (/<w:headerReference\b[^>]*\bw:type="default"/i.test(xml)) {
    xml = xml.replace(
      /(<w:headerReference\b[^>]*\bw:type="default"[^>]*\br:id=")[^"]+(")/i,
      `$1${firstId}$2`,
    );
    xml = xml.replace(
      /(<w:headerReference\b[^>]*\br:id=")[^"]+("[^>]*\bw:type="default")/i,
      `$1${firstId}$2`,
    );
  }

  // Quitar refs “first” para no duplicar
  xml = xml.replace(/<w:headerReference\b[^>]*\bw:type="first"[^>]*\/>/gi, "");
  xml = xml.replace(/<w:footerReference\b[^>]*\bw:type="first"[^>]*\/>/gi, "");

  return xml;
}

/**
 * Algunas plantillas (Kurs, Duropegasa) ponen arte del membrete en el body.
 * Conservamos esos bloques con dibujos al inicio del documento.
 */
function extractBodyDecorations(tplBodyInner) {
  const withoutSect = tplBodyInner.replace(
    /<w:sectPr\b[\s\S]*?<\/w:sectPr>/i,
    "",
  );
  const chunks = withoutSect.split(/(?=<w:(?:p|tbl)[\s>])/i);
  return chunks.filter((chunk) =>
    /<w:drawing\b|<w:pict\b|v:imagedata/i.test(chunk),
  );
}

/**
 * Multinuclear ancla logo/gráfico a la página; Duropegasa/Ecuasinergy usan
 * column/paragraph y se desalinea al cambiar márgenes. Normalizamos a page.
 */
function stabilizeHeaderAnchors(headerXml, { leftMarginDxa, headerDistDxa }) {
  const leftEmu = leftMarginDxa * DXA_TO_EMU;
  const headerEmu = headerDistDxa * DXA_TO_EMU;

  let xml = headerXml.replace(
    /<wp:positionH(\s+)relativeFrom="column">(\s*)<wp:posOffset>(-?\d+)<\/wp:posOffset>/gi,
    (_m, sp1, sp2, off) =>
      `<wp:positionH${sp1}relativeFrom="page">${sp2}<wp:posOffset>${Number(off) + leftEmu}</wp:posOffset>`,
  );

  xml = xml.replace(
    /<wp:positionV(\s+)relativeFrom="paragraph">(\s*)<wp:posOffset>(-?\d+)<\/wp:posOffset>/gi,
    (_m, sp1, sp2, off) => {
      const v = Math.max(0, Number(off) + headerEmu);
      return `<wp:positionV${sp1}relativeFrom="page">${sp2}<wp:posOffset>${v}</wp:posOffset>`;
    },
  );

  return xml;
}

function headerTargetsFromSectPr(sectPrXml, documentRelsXml) {
  const ids = [
    ...sectPrXml.matchAll(/<w:headerReference\b[^>]*\br:id="([^"]+)"/gi),
  ].map((m) => m[1]);
  const targets = [];
  for (const id of ids) {
    const m =
      documentRelsXml.match(
        new RegExp(`Id="${id}"[^>]*Target="([^"]+)"`, "i"),
      ) ||
      documentRelsXml.match(
        new RegExp(`Target="([^"]+)"[^>]*Id="${id}"`, "i"),
      );
    if (m?.[1]) targets.push(m[1].replace(/^\//, ""));
  }
  return [...new Set(targets)];
}

/**
 * Inserta el cuerpo generado en la plantilla (conserva encabezado/pie).
 */
async function mergeIntoTemplate(contentBlob, templatePath) {
  const [tplRes, contentBuf] = await Promise.all([
    fetch(templatePath),
    contentBlob.arrayBuffer(),
  ]);
  if (!tplRes.ok) {
    throw new Error(
      `No se pudo cargar la plantilla Word (${templatePath}).`,
    );
  }

  const tplZip = await JSZip.loadAsync(await tplRes.arrayBuffer());
  const genZip = await JSZip.loadAsync(contentBuf);

  const tplDocXml = await tplZip.file("word/document.xml").async("string");
  const genDocXml = await genZip.file("word/document.xml").async("string");

  const tplBody = tplDocXml.match(/<w:body\b[^>]*>([\s\S]*)<\/w:body>/i);
  const genBody = genDocXml.match(/<w:body\b[^>]*>([\s\S]*)<\/w:body>/i);
  if (!tplBody || !genBody) {
    throw new Error("Plantilla o documento generado inválido.");
  }

  const sectPrRaw = tplBody[1].match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/i)?.[0];
  if (!sectPrRaw) {
    throw new Error("La plantilla no tiene sección (sectPr).");
  }
  const sectPr = withHeaderClearance(preferFirstPageHeader(sectPrRaw));

  const leftMarginDxa = readPgMarAttr(sectPrRaw, "left", 1440);
  const headerDistDxa = readPgMarAttr(sectPrRaw, "header", 720);
  const documentRels = await tplZip
    .file("word/_rels/document.xml.rels")
    .async("string");
  for (const target of headerTargetsFromSectPr(sectPr, documentRels)) {
    const headerPath = target.startsWith("word/")
      ? target
      : `word/${target}`;
    const headerFile = tplZip.file(headerPath);
    if (!headerFile) continue;
    const headerXml = await headerFile.async("string");
    tplZip.file(
      headerPath,
      stabilizeHeaderAnchors(headerXml, { leftMarginDxa, headerDistDxa }),
    );
  }

  const decorations = extractBodyDecorations(tplBody[1]).join("");
  const genInner = genBody[1].replace(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/i, "");
  const newDocXml = tplDocXml.replace(
    /<w:body\b[^>]*>[\s\S]*<\/w:body>/i,
    `<w:body>${decorations}${genInner}${sectPr}</w:body>`,
  );

  tplZip.file("word/document.xml", newDocXml);

  return tplZip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/**
 * Genera un .docx de hoja de vida empresarial.
 * Si hay templatePath, reutiliza ese archivo (encabezado/pie) y solo
 * escribe el contenido encima.
 * @param {{ slug: string, procesos: Array }} params
 * @returns {Promise<{ blob: Blob, fileName: string } | { error: string }>}
 */
export async function generateHojaVidaDocx({ slug, procesos }) {
  const meta = getHojaVidaMeta(slug);
  if (!meta) {
    return {
      error: "Aún no hay plantilla de hoja de vida para esta empresa.",
    };
  }

  const rows = [...(procesos ?? [])].sort((a, b) => {
    const ya = Number(a.anio) || 0;
    const yb = Number(b.anio) || 0;
    if (yb !== ya) return yb - ya;
    return String(a.objeto || "").localeCompare(String(b.objeto || ""), "es");
  });

  const children = buildBodyChildren(meta, rows);

  // Cuerpo solo; el encabezado/pie vienen de la plantilla de la empresa
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11909, height: 16834 },
            margin: {
              top: PAGE_TOP_MARGIN,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  let blob = await Packer.toBlob(doc);

  if (meta.templatePath) {
    try {
      blob = await mergeIntoTemplate(blob, meta.templatePath);
    } catch (err) {
      return {
        error:
          err?.message ||
          "No se pudo aplicar el encabezado de la plantilla Word.",
      };
    }
  }

  return { blob, fileName: meta.fileName };
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
