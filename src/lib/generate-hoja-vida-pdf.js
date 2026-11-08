import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ESTADOS_PROCESO } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { getHojaVidaMeta } from "@/lib/hoja-vida-meta";

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN_X = 40;
const MARGIN_BOTTOM = 48;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const COLS = [
  { key: "objeto", label: "OBJETO DE CONTRATACIÓN", weight: 3.2 },
  { key: "entidad", label: "ENTIDAD CONTRATANTE", weight: 2.2 },
  { key: "monto", label: "MONTO", weight: 1.3 },
  { key: "estado", label: "ESTADO", weight: 1.2 },
  { key: "anio", label: "AÑO", weight: 0.7 },
];

const COL_W = (() => {
  const total = COLS.reduce((s, c) => s + c.weight, 0);
  return COLS.map((c) => (CONTENT_W * c.weight) / total);
})();

/** WinAnsi-safe text for Helvetica. */
function pdfSafe(value) {
  return String(value ?? "—")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function wrapLines(font, text, fontSize, maxWidth) {
  const raw = pdfSafe(text);
  if (!raw) return ["—"];
  const words = raw.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
        current = word;
      } else {
        // palabra muy larga: partir
        let chunk = "";
        for (const ch of word) {
          const tryChunk = chunk + ch;
          if (font.widthOfTextAtSize(tryChunk, fontSize) <= maxWidth) {
            chunk = tryChunk;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ["—"];
}

async function fetchImageBytes(path) {
  if (!path) return null;
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function embedImage(pdfDoc, bytes, pathHint = "") {
  if (!bytes?.length) return null;
  const lower = pathHint.toLowerCase();
  try {
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      return await pdfDoc.embedJpg(bytes);
    }
    return await pdfDoc.embedPng(bytes);
  } catch {
    try {
      return await pdfDoc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

/**
 * Dibuja encabezado de marca (banner o izq/der) y devuelve Y inferior del contenido.
 */
function drawBrandHeader(page, images) {
  const { banner, left, right } = images;
  let y = PAGE_H - 32;

  if (banner) {
    // Banner de membrete a ancho útil (~1.5" de alto máx.)
    const maxH = 110;
    const scale = Math.min(CONTENT_W / banner.width, maxH / banner.height);
    const w = banner.width * scale;
    const h = banner.height * scale;
    page.drawImage(banner, {
      x: MARGIN_X + (CONTENT_W - w) / 2,
      y: y - h,
      width: w,
      height: h,
    });
    return y - h - 22;
  }

  // Logo izq. + gráfico der., tamaño de membrete
  const maxH = 92;
  let used = 0;
  if (left) {
    const scale = Math.min(200 / left.width, maxH / left.height);
    const w = left.width * scale;
    const h = left.height * scale;
    page.drawImage(left, {
      x: MARGIN_X,
      y: y - h,
      width: w,
      height: h,
    });
    used = Math.max(used, h);
  }
  if (right) {
    const scale = Math.min(210 / right.width, maxH / right.height);
    const w = right.width * scale;
    const h = right.height * scale;
    page.drawImage(right, {
      x: PAGE_W - MARGIN_X - w,
      y: y - h,
      width: w,
      height: h,
    });
    used = Math.max(used, h);
  }
  return used > 0 ? y - used - 22 : y - 8;
}

/**
 * Genera PDF de hoja de vida en el navegador (sin Word/LibreOffice/API).
 * @param {{ slug: string, procesos: Array }} params
 * @returns {Promise<{ blob: Blob, fileName: string } | { error: string }>}
 */
export async function generateHojaVidaPdf({ slug, procesos }) {
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

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const [bannerBytes, leftBytes, rightBytes] = await Promise.all([
    fetchImageBytes(meta.headerBanner),
    fetchImageBytes(meta.headerLeft),
    fetchImageBytes(meta.headerRight),
  ]);

  const images = {
    banner: await embedImage(pdfDoc, bannerBytes, meta.headerBanner || ""),
    left: await embedImage(pdfDoc, leftBytes, meta.headerLeft || ""),
    right: await embedImage(pdfDoc, rightBytes, meta.headerRight || ""),
  };

  const title = pdfSafe(meta.titulo || "HOJA DE VIDA EMPRESARIAL");
  const fontSizeTitle = 14;
  const fontSizeSection = 11;
  const fontSizeCell = 8;
  const lineH = 10;
  const cellPadX = 4;
  const cellPadY = 4;
  const headerFill = rgb(0.91, 0.91, 0.91);
  const black = rgb(0, 0, 0);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = drawBrandHeader(page, images);

  function newPage() {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = drawBrandHeader(page, images);
  }

  function ensureSpace(needed) {
    if (y - needed < MARGIN_BOTTOM) newPage();
  }

  // Título
  ensureSpace(36);
  const titleW = fontBold.widthOfTextAtSize(title, fontSizeTitle);
  page.drawText(title, {
    x: MARGIN_X + (CONTENT_W - titleW) / 2,
    y: y - fontSizeTitle,
    size: fontSizeTitle,
    font: fontBold,
    color: black,
  });
  y -= fontSizeTitle + 18;

  // EXPERIENCIA
  ensureSpace(28);
  const sec = "EXPERIENCIA";
  const secW = fontBold.widthOfTextAtSize(sec, fontSizeSection);
  page.drawText(sec, {
    x: MARGIN_X + (CONTENT_W - secW) / 2,
    y: y - fontSizeSection,
    size: fontSizeSection,
    font: fontBold,
    color: black,
  });
  y -= fontSizeSection + 4;
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_W - MARGIN_X, y },
    thickness: 1,
    color: black,
  });
  y -= 12;

  if (rows.length === 0) {
    ensureSpace(20);
    page.drawText(
      pdfSafe("Sin procesos registrados aún para esta empresa."),
      {
        x: MARGIN_X,
        y: y - 10,
        size: 9,
        font,
        color: black,
      },
    );
  } else {
    const tableRows = [
      {
        cells: COLS.map((c) => c.label),
        header: true,
      },
      ...rows.map((p) => ({
        cells: [
          p.objeto || "—",
          p.entidadContratante || "—",
          formatMoney(p.monto ?? 0),
          ESTADOS_PROCESO[p.estado] ?? p.estado ?? "—",
          String(p.anio ?? "—"),
        ],
        header: false,
      })),
    ];

    for (const row of tableRows) {
      const wrapped = row.cells.map((text, i) =>
        wrapLines(row.header ? fontBold : font, text, fontSizeCell, COL_W[i] - cellPadX * 2),
      );
      const maxLines = Math.max(...wrapped.map((l) => l.length));
      const rowH = maxLines * lineH + cellPadY * 2;

      ensureSpace(rowH + 2);

      // fondo cabecera
      if (row.header) {
        page.drawRectangle({
          x: MARGIN_X,
          y: y - rowH,
          width: CONTENT_W,
          height: rowH,
          color: headerFill,
        });
      }

      // bordes y texto
      let x = MARGIN_X;
      for (let i = 0; i < COLS.length; i++) {
        page.drawRectangle({
          x,
          y: y - rowH,
          width: COL_W[i],
          height: rowH,
          borderColor: black,
          borderWidth: 0.6,
        });

        const lines = wrapped[i];
        let ty = y - cellPadY - fontSizeCell;
        for (const line of lines) {
          const tw = (row.header ? fontBold : font).widthOfTextAtSize(
            line,
            fontSizeCell,
          );
          page.drawText(line, {
            x: x + (COL_W[i] - tw) / 2,
            y: ty,
            size: fontSizeCell,
            font: row.header ? fontBold : font,
            color: black,
          });
          ty -= lineH;
        }
        x += COL_W[i];
      }

      y -= rowH;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return { blob, fileName: meta.fileNamePdf };
}
