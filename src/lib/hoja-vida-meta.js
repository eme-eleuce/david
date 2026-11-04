/**
 * Datos de “Hoja de vida empresarial” por slug.
 * EXPERIENCIA = procesos de la app.
 * Word = plantilla con encabezado (sin pie de página).
 */

export const HOJA_VIDA_BY_SLUG = {
  multinuclear: {
    titulo: "HOJA DE VIDA EMPRESARIAL",
    headerLeft: "/templates/multinuclear/izquierda.png",
    headerRight: "/templates/multinuclear/derecha.png",
    templatePath: "/templates/Multinuclear.docx",
    fileName: "Hoja-de-vida-Multinuclear.docx",
    fileNamePdf: "Hoja-de-vida-Multinuclear.pdf",
  },
  kurs: {
    titulo: "HOJA DE VIDA EMPRESARIAL",
    headerBanner: "/templates/kurs/image1.png",
    templatePath: "/templates/Kurs.docx",
    fileName: "Hoja-de-vida-Kurs.docx",
    fileNamePdf: "Hoja-de-vida-Kurs.pdf",
  },
  arenzecorp: {
    titulo: "HOJA DE VIDA EMPRESARIAL",
    headerBanner: "/templates/arenzecorp/image1.png",
    templatePath: "/templates/Aranzecorp.docx",
    fileName: "Hoja-de-vida-Aranzecorp.docx",
    fileNamePdf: "Hoja-de-vida-Aranzecorp.pdf",
  },
  duropegasa: {
    titulo: "HOJA DE VIDA EMPRESARIAL",
    headerLeft: "/templates/duropegasa/left.jpg",
    headerRight: "/logos/duropegasa.png",
    templatePath: "/templates/Duropegasa.docx",
    fileName: "Hoja-de-vida-Duropegasa.docx",
    fileNamePdf: "Hoja-de-vida-Duropegasa.pdf",
  },
  ecuasinergy: {
    titulo: "HOJA DE VIDA EMPRESARIAL",
    headerLeft: "/templates/ecuasinergy/left.png",
    headerRight: "/templates/ecuasinergy/right.png",
    templatePath: "/templates/Ecuasinergy.docx",
    fileName: "Hoja-de-vida-Ecuasinergy.docx",
    fileNamePdf: "Hoja-de-vida-Ecuasinergy.pdf",
  },
};

export function getHojaVidaMeta(slug) {
  if (!slug) return null;
  return HOJA_VIDA_BY_SLUG[slug] ?? null;
}
