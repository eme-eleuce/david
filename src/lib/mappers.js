import { logoForSlug, sloganForSlug } from "@/lib/empresas-meta";

export function mapEmpresa(row) {
  return {
    id: String(row.id),
    nombre: row.nombre,
    slug: row.slug,
    activa: row.activa,
    logoUrl: logoForSlug(row.slug),
    slogan: sloganForSlug(row.slug),
  };
}

export function mapProceso(row) {
  return {
    id: String(row.id),
    empresaId: String(row.empresa_id),
    objeto: row.objeto,
    entidadContratante: row.entidad_contratante,
    monto: Number(row.monto),
    anio: row.anio,
    tipoProceso: row.tipo_proceso,
    estado: row.estado,
    createdAt: row.created_at ?? null,
  };
}

export function mapDocumento(row) {
  return {
    id: String(row.id),
    procesoId: String(row.proceso_id),
    tipo: row.tipo,
    nombre: row.nombre,
    createdAt: row.created_at ?? null,
    url: row.storage_path
      ? null
      : `/demo/${
          row.nombre.includes("factura") || row.tipo === "factura"
            ? "factura"
            : row.tipo === "poliza"
              ? "poliza"
              : row.tipo === "acta_provisional" ||
                  row.tipo === "acta_definitiva" ||
                  row.tipo === "certificado" ||
                  row.tipo === "acta"
                ? "acta"
                : "contrato"
        }-ejemplo.pdf`,
    storagePath: row.storage_path,
  };
}

export function computeKpis(procesos) {
  return {
    totalProcesos: procesos.length,
    montoTotal: procesos.reduce((sum, p) => sum + p.monto, 0),
    finalizados: procesos.filter((p) => p.estado === "finalizado").length,
    enEjecucion: procesos.filter((p) => p.estado === "en_ejecucion").length,
    entidades: new Set(procesos.map((p) => p.entidadContratante)).size,
  };
}
