"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Plus, Search, X } from "lucide-react";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import FiltrosPanel from "@/components/filtros/FiltrosPanel";
import {
  applyFiltros,
  ORDEN_DEFAULT,
  ORDEN_OPTIONS,
  useFiltros,
} from "@/components/filtros/FiltrosProvider";
import ProcesoFormModal from "@/components/procesos/ProcesoFormModal";
import LoadingIcon from "@/components/ui/LoadingIcon";
import PaginationControls from "@/components/ui/PaginationControls";
import { useData } from "@/components/data/DataProvider";
import { usePagination } from "@/hooks/usePagination";
import {
  DOC_TIPO_DOT,
  DOC_TIPO_ORDER,
  DOC_TIPO_SHORT,
  ESTADOS_PROCESO,
  TIPOS_DOCUMENTO,
} from "@/lib/constants";
import { formatMoney } from "@/lib/format";

const ESTADO_STYLES = {
  finalizado: "bg-success-soft text-success",
  en_ejecucion: "bg-sky-soft text-sky",
  en_revision: "bg-amber-100 text-amber-800",
  borrador: "bg-slate-100 text-slate-600",
  cancelado: "bg-red-100 text-red-700",
};

/**
 * @param {{ showToolbar?: boolean, showTotal?: boolean, compact?: boolean }} props
 */
export default function ContratacionesTable({
  showToolbar = true,
  showTotal = true,
  compact = false,
}) {
  const { empresaId, isTodas } = useEmpresa();
  const { procesos: todosProcesos, documentos, loading, error } = useData();
  const router = useRouter();
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const {
    filtros,
    activeCount,
    hasFiltros,
    togglePanel,
    clearFiltros,
    estado,
    setEstado,
    anio,
    setAnio,
    tipoProceso,
    setTipoProceso,
    orden,
    setOrden,
    query,
    setQuery,
  } = useFiltros();

  const sectionRef = useRef(null);
  const skipScrollRef = useRef(true);

  const procesos = useMemo(
    () => applyFiltros(todosProcesos, filtros, isTodas ? null : empresaId),
    [todosProcesos, filtros, isTodas, empresaId],
  );

  const resetKey = `${empresaId ?? "todas"}|${filtros.query}|${filtros.estado}|${filtros.anio}|${filtros.tipoProceso}|${filtros.orden}`;
  const pagination = usePagination(procesos.length, resetKey);
  const pageRows = pagination.slice(procesos);

  const montoFiltrado = useMemo(
    () => procesos.reduce((sum, p) => sum + p.monto, 0),
    [procesos],
  );

  // Al cambiar empresa, no bajar a la tabla (queremos el tope de vista general)
  useEffect(() => {
    skipScrollRef.current = true;
  }, [empresaId]);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    sectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [pagination.page]);

  return (
    <section
      ref={sectionRef}
      className="flex min-h-0 flex-1 scroll-mt-3 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
    >
      {(loading || error) && (
        <div
          className={`shrink-0 border-b px-4 py-2 text-sm sm:px-5 ${
            error
              ? "border-red-100 bg-red-50 text-red-700"
              : "border-slate-100 bg-slate-50 text-slate-500"
          }`}
        >
          {error ? (
            `No se pudieron cargar los datos: ${error}. ¿Corriste la migración y el seed en Supabase?`
          ) : (
            <span className="inline-flex items-center gap-2">
              <LoadingIcon className="h-4 w-4" />
              Cargando contrataciones…
            </span>
          )}
        </div>
      )}
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
        <div className="relative w-full min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por objeto, entidad, contrato..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {showToolbar ? (
            <h2 className="text-base font-semibold text-slate-900">
              Contrataciones
            </h2>
          ) : (
            <p className="text-sm text-slate-500">
              {procesos.length} resultado{procesos.length === 1 ? "" : "s"}
            </p>
          )}
          <div className="relative flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNuevoOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </button>
            <button
              type="button"
              data-filtros-trigger
              onClick={togglePanel}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                hasFiltros
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeCount > 0 && (
                <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </button>
            <FiltrosPanel />
          </div>
        </div>
      </div>

      {hasFiltros && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2 sm:px-5">
          {query.trim() && (
            <Chip
              label={`Buscar: “${query.trim()}”`}
              onRemove={() => setQuery("")}
            />
          )}
          {estado && (
            <Chip
              label={ESTADOS_PROCESO[estado] ?? estado}
              onRemove={() => setEstado(null)}
            />
          )}
          {anio != null && (
            <Chip label={`Año ${anio}`} onRemove={() => setAnio(null)} />
          )}
          {tipoProceso && (
            <Chip
              label={tipoProceso}
              onRemove={() => setTipoProceso(null)}
            />
          )}
          {orden !== ORDEN_DEFAULT && (
            <Chip
              label={
                ORDEN_OPTIONS.find((o) => o.value === orden)?.label ?? orden
              }
              onRemove={() => setOrden(ORDEN_DEFAULT)}
            />
          )}
          <button
            type="button"
            onClick={clearFiltros}
            className="text-xs font-medium text-brand hover:underline"
          >
            Limpiar todo
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-slate-50 px-4 py-2 text-[10px] text-slate-400 sm:px-5">
          {DOC_TIPO_ORDER.map((tipo) => (
            <span key={tipo} className="inline-flex items-center gap-1">
              <span
                className={`h-1.5 w-1.5 rounded-full ${DOC_TIPO_DOT[tipo]}`}
              />
              {TIPOS_DOCUMENTO[tipo]}
            </span>
          ))}
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Objeto de contratación</th>
              <th className="px-4 py-3 font-medium">
                {compact ? "Entidad" : "Entidad contratante"}
              </th>
              <th className="px-4 py-3 font-medium">Monto</th>
              {!compact && (
                <th className="px-4 py-3 font-medium">Año</th>
              )}
              <th className="px-4 py-3 font-medium">
                {compact ? "Tipo" : "Tipo de proceso"}
              </th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Documentos</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={compact ? 6 : 7}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  {hasFiltros
                    ? "Ningún proceso coincide con la búsqueda o los filtros."
                    : "No hay procesos para esta empresa."}
                </td>
              </tr>
            ) : (
              pageRows.map((proceso) => {
                const docsProceso = documentos.filter(
                  (d) => d.procesoId === proceso.id,
                );
                const tiposPresentes = [
                  ...DOC_TIPO_ORDER.filter((tipo) =>
                    docsProceso.some((d) => d.tipo === tipo),
                  ),
                  ...[
                    ...new Set(
                      docsProceso
                        .map((d) => d.tipo)
                        .filter((t) => !DOC_TIPO_ORDER.includes(t)),
                    ),
                  ],
                ];

                return (
                <tr
                  key={proceso.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50/60"
                >
                  <td className="max-w-xs px-4 py-3">
                    <Link
                      href={`/procesos/${proceso.id}`}
                      className="font-medium text-slate-900 hover:text-brand hover:underline"
                    >
                      {proceso.objeto}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {proceso.entidadContratante}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                    {formatMoney(proceso.monto)}
                  </td>
                  {!compact && (
                    <td className="px-4 py-3 text-slate-600">{proceso.anio}</td>
                  )}
                  <td className="px-4 py-3 text-slate-600">
                    {proceso.tipoProceso}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ESTADO_STYLES[proceso.estado] ??
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ESTADOS_PROCESO[proceso.estado] ?? proceso.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {tiposPresentes.length === 0 ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <Link
                        href={`/procesos/${proceso.id}`}
                        className="inline-flex max-w-[11rem] flex-wrap items-center gap-1.5"
                        title={tiposPresentes
                          .map((t) => TIPOS_DOCUMENTO[t])
                          .join(", ")}
                      >
                        {tiposPresentes.map((tipo) => (
                          <span
                            key={tipo}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-100"
                          >
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${DOC_TIPO_DOT[tipo] ?? "bg-slate-400"}`}
                              aria-hidden
                            />
                            <span className="text-[10px] font-medium text-slate-600">
                              {DOC_TIPO_SHORT[tipo] ?? tipo}
                            </span>
                          </span>
                        ))}
                      </Link>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="shrink-0">
        {showTotal && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-4 py-2 text-xs sm:px-5">
            <span className="font-medium text-slate-700">
              Total{hasFiltros ? " filtrado" : " contratado"}:{" "}
              {formatMoney(montoFiltrado)}
            </span>
          </div>
        )}
        <PaginationControls {...pagination} />
      </div>

      <ProcesoFormModal
        open={nuevoOpen}
        onClose={() => setNuevoOpen(false)}
        defaultEmpresaId={isTodas ? null : empresaId}
        onSaved={(row) => {
          if (row?.id) router.push(`/procesos/${row.id}`);
        }}
      />
    </section>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Quitar ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
