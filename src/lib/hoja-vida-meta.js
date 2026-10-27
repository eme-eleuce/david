/**
 * Datos fijos de “Hoja de vida empresarial” por slug.
 * La EXPERIENCIA se arma con los procesos de la app.
 */

export const HOJA_VIDA_BY_SLUG = {
  multinuclear: {
    titulo: "HOJA DE VIDA EMPRESARIAL",
    razonSocial: "MULTINUCLEAR S.A.",
    representanteLegal: "NELSON WILLIAM PLUAS CORREA",
    ruc: "0992821272001",
    servicios: [
      "CONSULTORIA EN GESTION DE LA PRODUCCION",
      "CONSULTORIA DEL MEDIO AMBIENTE",
      "DISEÑO DE INGENIERIA PARA OBRAS DE INGENIERIA CIVIL",
    ],
    /** Preview / PDF (mismas piezas visuales del encabezado) */
    headerLeft: "/templates/multinuclear/izquierda.png",
    headerRight: "/templates/multinuclear/derecha.png",
    /** Word: plantilla con encabezado/pie ya configurados */
    templatePath: "/templates/Multinuclear.docx",
    fileName: "Hoja-de-vida-Multinuclear.docx",
    fileNamePdf: "Hoja-de-vida-Multinuclear.pdf",
  },
};

export function getHojaVidaMeta(slug) {
  if (!slug) return null;
  return HOJA_VIDA_BY_SLUG[slug] ?? null;
}
