"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  ANIOS_DISPONIBLES,
  ORDEN_DEFAULT,
  ORDEN_OPTIONS,
  TIPOS_PROCESO,
  useFiltros,
} from "@/components/filtros/FiltrosProvider";
import { ESTADOS_PROCESO } from "@/lib/constants";

export default function FiltrosPanel() {
  const {
    panelOpen,
    closePanel,
    estado,
    setEstado,
    anio,
    setAnio,
    tipoProceso,
    setTipoProceso,
    orden,
    setOrden,
    clearFiltros,
    activeCount,
  } = useFiltros();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!panelOpen) return;
    function onKey(event) {
      if (event.key === "Escape") closePanel();
    }
    function onPointer(event) {
      if (!panelRef.current?.contains(event.target)) {
        const btn = event.target.closest?.("[data-filtros-trigger]");
        if (!btn) closePanel();
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [panelOpen, closePanel]);

  if (!panelOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-1.5rem,20rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg animate-empresa-change"
      role="dialog"
      aria-label="Filtros de contrataciones"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Filtros</h3>
        <button
          type="button"
          onClick={closePanel}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Cerrar filtros"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <Field label="Ordenar por">
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            {ORDEN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Estado">
          <select
            value={estado ?? ""}
            onChange={(e) => setEstado(e.target.value || null)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Todos</option>
            {Object.entries(ESTADOS_PROCESO).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Año">
          <select
            value={anio ?? ""}
            onChange={(e) =>
              setAnio(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Todos</option>
            {ANIOS_DISPONIBLES.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tipo de proceso">
          <select
            value={tipoProceso ?? ""}
            onChange={(e) => setTipoProceso(e.target.value || null)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Todos</option>
            {TIPOS_PROCESO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={clearFiltros}
          disabled={activeCount === 0}
          className="text-sm text-slate-500 transition hover:text-slate-800 disabled:opacity-40"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={closePanel}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
