/** Estados de proceso (prototipo). */
export const ESTADOS_PROCESO = {
  borrador: "Borrador",
  en_ejecucion: "En ejecución",
  en_revision: "En revisión",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const ESTADO_STYLES = {
  finalizado: "bg-success-soft text-success ring-1 ring-emerald-200/80",
  en_ejecucion: "bg-sky-soft text-sky ring-1 ring-sky-200/80",
  en_revision: "bg-amber-100 text-amber-800 ring-1 ring-amber-200/80",
  borrador: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
  cancelado: "bg-red-100 text-red-700 ring-1 ring-red-200/80",
};

/** Tipos de documento por proceso (alineados al cliente). */
export const TIPOS_DOCUMENTO = {
  contrato: "Contrato",
  poliza: "Póliza",
  factura: "Factura",
  acta_provisional: "Acta provisional",
  acta_definitiva: "Acta definitiva",
  certificado: "Certificado",
};

export const DOC_TIPO_ORDER = Object.keys(TIPOS_DOCUMENTO);

/** Etiqueta corta para chips del dashboard. */
export const DOC_TIPO_SHORT = {
  contrato: "Contrato",
  poliza: "Póliza",
  factura: "Factura",
  acta_provisional: "Acta P.",
  acta_definitiva: "Acta D.",
  certificado: "Cert.",
};

/** Punto de color en listados / dashboard. */
export const DOC_TIPO_DOT = {
  contrato: "bg-blue-500",
  poliza: "bg-violet-500",
  factura: "bg-emerald-500",
  acta_provisional: "bg-amber-400",
  acta_definitiva: "bg-orange-500",
  certificado: "bg-teal-500",
};

/** Chip / badge de tipo (paneles de documentos). */
export const DOC_TIPO_TONE = {
  contrato: "bg-brand-soft text-brand ring-orange-100",
  poliza: "bg-violet-50 text-violet-700 ring-violet-100",
  factura: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  acta_provisional: "bg-amber-50 text-amber-800 ring-amber-100",
  acta_definitiva: "bg-orange-50 text-orange-800 ring-orange-100",
  certificado: "bg-teal-50 text-teal-800 ring-teal-100",
};
