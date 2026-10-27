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

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 400, after: 180 },
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

function bodyLine(label, value) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        size: FONT_PT9,
        font: "Arial",
        color: "000000",
      }),
      new TextRun({
        text: value,
        size: FONT_PT9,
        font: "Arial",
        color: "000000",
      }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: `•  ${text}`,
        size: FONT_PT9,
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
    bodyLine("RAZÓN SOCIAL", meta.razonSocial),
    bodyLine("REPRESENTANTE LEGAL", meta.representanteLegal),
    bodyLine("RUC", meta.ruc),
    sectionTitle("SERVICIOS"),
  ];

  for (const s of meta.servicios) {
    children.push(bullet(s));
  }

  children.push(sectionTitle("EXPERIENCIA"));

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
 * Inserta el cuerpo generado en la plantilla (conserva encabezado/pie).
 */
async function mergeIntoTemplate(contentBlob, templatePath) {
  const [tplRes, contentBuf] = await Promise.all([
    fetch(templatePath),
    contentBlob.arrayBuffer(),
  ]);
  if (!tplRes.ok) {
    throw new Error("No se pudo cargar la plantilla Word.");
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

  const sectPr = tplBody[1].match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/i)?.[0];
  if (!sectPr) {
    throw new Error("La plantilla no tiene sección (sectPr).");
  }

  const genInner = genBody[1].replace(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/i, "");
  const newDocXml = tplDocXml.replace(
    /<w:body\b[^>]*>[\s\S]*<\/w:body>/i,
    `<w:body>${genInner}${sectPr}</w:body>`,
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
      error:
        "Aún no hay plantilla de hoja de vida para esta empresa. Por ahora solo Multinuclear.",
    };
  }

  const rows = [...(procesos ?? [])].sort((a, b) => {
    const ya = Number(a.anio) || 0;
    const yb = Number(b.anio) || 0;
    if (yb !== ya) return yb - ya;
    return String(a.objeto || "").localeCompare(String(b.objeto || ""), "es");
  });

  const children = buildBodyChildren(meta, rows);

  // Cuerpo solo; el encabezado viene de Multinuclear.docx
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11909, height: 16834 },
            margin: {
              top: 1440,
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
