/**
 * Datos fake para el prototipo.
 * Más adelante se reemplaza por queries a Supabase.
 */

export const empresas = [
  {
    id: "e1",
    nombre: "MULTINUCLEAR",
    slug: "multinuclear",
    activa: true,
    logoUrl: "/logos/multinuclear.png",
  },
  {
    id: "e2",
    nombre: "KURS",
    slug: "kurs",
    activa: true,
    logoUrl: "/logos/kurs-2.png",
  },
  {
    id: "e3",
    nombre: "ARANZECORP",
    slug: "arenzecorp",
    activa: true,
    logoUrl: "/logos/arenzecorp.png",
  },
  {
    id: "e4",
    nombre: "DUROPEGASA",
    slug: "duropegasa",
    activa: true,
    logoUrl: "/logos/duropegasa.png",
  },
  {
    id: "e5",
    nombre: "ECUASINERGY",
    slug: "ecuasinergy",
    activa: true,
    logoUrl: "/logos/ecuasinergy.png",
  },
];

export const procesos = [
  {
    id: "p1",
    empresaId: "e1",
    objeto: "Construcción de sistema de detección de incendios",
    entidadContratante: "AQUAGOLD",
    monto: 125000,
    anio: 2025,
    tipoProceso: "Licitación pública",
    estado: "finalizado",
  },
  {
    id: "p2",
    empresaId: "e1",
    objeto: "Mantenimiento de redes eléctricas industriales",
    entidadContratante: "GAD Municipal",
    monto: 48200.5,
    anio: 2025,
    tipoProceso: "Contratación directa",
    estado: "en_ejecucion",
  },
  {
    id: "p3",
    empresaId: "e2",
    objeto: "Suministro de equipos de protección personal",
    entidadContratante: "Petroindustrial",
    monto: 31500,
    anio: 2024,
    tipoProceso: "Cotización",
    estado: "finalizado",
  },
  {
    id: "p4",
    empresaId: "e2",
    objeto: "Instalación de tableros de control automatizado",
    entidadContratante: "AQUAGOLD",
    monto: 89000,
    anio: 2026,
    tipoProceso: "Licitación pública",
    estado: "en_revision",
  },
  {
    id: "p5",
    empresaId: "e3",
    objeto: "Servicio de ingeniería y supervisión de obra",
    entidadContratante: "Consorcio Andino",
    monto: 156000,
    anio: 2025,
    tipoProceso: "Licitación pública",
    estado: "finalizado",
  },
  {
    id: "p6",
    empresaId: "e3",
    objeto: "Reparación de transformadores de media tensión",
    entidadContratante: "GAD Provincial",
    monto: 27800,
    anio: 2026,
    tipoProceso: "Contratación directa",
    estado: "borrador",
  },
  {
    id: "p7",
    empresaId: "e4",
    objeto: "Cableado estructurado y fibra óptica",
    entidadContratante: "TechCorp Latam",
    monto: 64200,
    anio: 2025,
    tipoProceso: "Cotización",
    estado: "finalizado",
  },
  {
    id: "p8",
    empresaId: "e4",
    objeto: "Auditoría de seguridad eléctrica en planta",
    entidadContratante: "AQUAGOLD",
    monto: 19500,
    anio: 2026,
    tipoProceso: "Contratación directa",
    estado: "en_ejecucion",
  },
  {
    id: "p9",
    empresaId: "e5",
    objeto: "Diseño e instalación de UPS industriales",
    entidadContratante: "Minera del Pacífico",
    monto: 210000,
    anio: 2024,
    tipoProceso: "Licitación pública",
    estado: "finalizado",
  },
  {
    id: "p10",
    empresaId: "e5",
    objeto: "Capacitación en normas NEC y seguridad",
    entidadContratante: "GAD Municipal",
    monto: 8500,
    anio: 2026,
    tipoProceso: "Cotización",
    estado: "en_revision",
  },
  {
    id: "p11",
    empresaId: "e1",
    objeto: "Ampliación de subestación eléctrica 13.8 kV",
    entidadContratante: "Consorcio Andino",
    monto: 178500,
    anio: 2026,
    tipoProceso: "Licitación pública",
    estado: "en_ejecucion",
  },
  {
    id: "p12",
    empresaId: "e2",
    objeto: "Suministro de cable de potencia XLPE",
    entidadContratante: "Minera del Pacífico",
    monto: 42300,
    anio: 2025,
    tipoProceso: "Cotización",
    estado: "finalizado",
  },
  {
    id: "p13",
    empresaId: "e3",
    objeto: "Mantenimiento preventivo de generadores",
    entidadContratante: "Petroindustrial",
    monto: 26750,
    anio: 2026,
    tipoProceso: "Contratación directa",
    estado: "en_ejecucion",
  },
  {
    id: "p14",
    empresaId: "e4",
    objeto: "Instalación de sistema de puesta a tierra",
    entidadContratante: "TechCorp Latam",
    monto: 18900,
    anio: 2024,
    tipoProceso: "Cotización",
    estado: "finalizado",
  },
  {
    id: "p15",
    empresaId: "e5",
    objeto: "Estudios de cortocircuito y coordinación de protecciones",
    entidadContratante: "GAD Provincial",
    monto: 33400,
    anio: 2026,
    tipoProceso: "Licitación pública",
    estado: "borrador",
  },
  {
    id: "p16",
    empresaId: "e1",
    objeto: "Reemplazo de luminarias LED industriales",
    entidadContratante: "AQUAGOLD",
    monto: 51200,
    anio: 2025,
    tipoProceso: "Contratación directa",
    estado: "finalizado",
  },
  {
    id: "p17",
    empresaId: "e2",
    objeto: "Certificación de calidad de soldadura estructural",
    entidadContratante: "Consorcio Andino",
    monto: 12400,
    anio: 2026,
    tipoProceso: "Cotización",
    estado: "en_revision",
  },
  {
    id: "p18",
    empresaId: "e3",
    objeto: "Montaje de bandejas porta cables y canalizaciones",
    entidadContratante: "GAD Municipal",
    monto: 67800,
    anio: 2025,
    tipoProceso: "Licitación pública",
    estado: "finalizado",
  },
  {
    id: "p19",
    empresaId: "e4",
    objeto: "Servicio de termografía en tableros críticos",
    entidadContratante: "Petroindustrial",
    monto: 9800,
    anio: 2026,
    tipoProceso: "Contratación directa",
    estado: "en_ejecucion",
  },
  {
    id: "p20",
    empresaId: "e5",
    objeto: "Diseño de sistema fotovoltaico para planta",
    entidadContratante: "Minera del Pacífico",
    monto: 145000,
    anio: 2026,
    tipoProceso: "Licitación pública",
    estado: "en_revision",
  },
  {
    id: "p21",
    empresaId: "e1",
    objeto: "Actualización de planos as-built eléctricos",
    entidadContratante: "TechCorp Latam",
    monto: 15600,
    anio: 2024,
    tipoProceso: "Cotización",
    estado: "finalizado",
  },
  {
    id: "p22",
    empresaId: "e2",
    objeto: "Pruebas de aceptación de equipos MCC",
    entidadContratante: "AQUAGOLD",
    monto: 22100,
    anio: 2025,
    tipoProceso: "Contratación directa",
    estado: "finalizado",
  },
];

export const documentos = [
  {
    id: "d1",
    procesoId: "p1",
    tipo: "contrato",
    nombre: "contrato-incendios.pdf",
    url: "/demo/contrato-ejemplo.pdf",
  },
  {
    id: "d2",
    procesoId: "p1",
    tipo: "poliza",
    nombre: "poliza-cumplimiento.pdf",
    url: "/demo/poliza-ejemplo.pdf",
  },
  {
    id: "d3",
    procesoId: "p1",
    tipo: "factura",
    nombre: "factura-001.pdf",
    url: "/demo/factura-ejemplo.pdf",
  },
  {
    id: "d4",
    procesoId: "p1",
    tipo: "acta_definitiva",
    nombre: "acta-definitiva-entrega.pdf",
    url: "/demo/acta-ejemplo.pdf",
  },
  {
    id: "d4b",
    procesoId: "p1",
    tipo: "certificado",
    nombre: "certificado-cumplimiento.pdf",
    url: "/demo/acta-ejemplo.pdf",
  },
  {
    id: "d5",
    procesoId: "p2",
    tipo: "contrato",
    nombre: "contrato-mantenimiento.pdf",
    url: "/demo/contrato-ejemplo.pdf",
  },
  {
    id: "d5b",
    procesoId: "p2",
    tipo: "acta_provisional",
    nombre: "acta-provisional-avance.pdf",
    url: "/demo/acta-ejemplo.pdf",
  },
  {
    id: "d6",
    procesoId: "p4",
    tipo: "factura",
    nombre: "factura-avance-01.pdf",
    url: "/demo/factura-ejemplo.pdf",
  },
];

export function getEmpresaBySlug(slug) {
  return empresas.find((e) => e.slug === slug) ?? null;
}

export function getProcesoById(id) {
  return procesos.find((p) => p.id === id) ?? null;
}

export function getProcesosByEmpresa(empresaId) {
  return procesos.filter((p) => p.empresaId === empresaId);
}

export function getDocumentosByProceso(procesoId) {
  return documentos.filter((d) => d.procesoId === procesoId);
}

export function getKpis(empresaId = null) {
  const list = empresaId
    ? procesos.filter((p) => p.empresaId === empresaId)
    : procesos;

  return {
    totalProcesos: list.length,
    montoTotal: list.reduce((sum, p) => sum + p.monto, 0),
    finalizados: list.filter((p) => p.estado === "finalizado").length,
    enEjecucion: list.filter((p) => p.estado === "en_ejecucion").length,
    entidades: new Set(list.map((p) => p.entidadContratante)).size,
  };
}
