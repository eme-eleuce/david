"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useData } from "@/components/data/DataProvider";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import {
  ORDEN_OPTIONS,
  TIPOS_PROCESO,
  useFiltros,
} from "@/components/filtros/FiltrosProvider";
import { ESTADOS_PROCESO } from "@/lib/constants";

function useIsMobileSheet() {
  const [mobile, setMobile] = useState(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return mobile;
}

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
  const { procesos } = useData();
  const { empresaId, isTodas } = useEmpresa();
  const panelRef = useRef(null);
  const isMobile = useIsMobileSheet();
  const [mounted, setMounted] = useState(false);
  const [desktopPos, setDesktopPos] = useState(null);

  const aniosDisponibles = useMemo(() => {
    const list = isTodas
      ? procesos
      : procesos.filter((p) => p.empresaId === empresaId);
    const years = new Set();
    for (const p of list) {
      const y = Number(p.anio);
      if (Number.isFinite(y) && y > 0) years.add(y);
    }
    return [...years].sort((a, b) => b - a);
  }, [procesos, empresaId, isTodas]);

  useEffect(() => {
    if (anio != null && !aniosDisponibles.includes(anio)) {
      setAnio(null);
    }
  }, [anio, aniosDisponibles, setAnio]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    function onKey(event) {
      if (event.key === "Escape") closePanel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen, closePanel]);

  // Desktop: cerrar al clic fuera
  useEffect(() => {
    if (!panelOpen || isMobile !== false) return;
    function onPointer(event) {
      if (panelRef.current?.contains(event.target)) return;
      const btn = event.target.closest?.("[data-filtros-trigger]");
      if (!btn) closePanel();
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [panelOpen, closePanel, isMobile]);

  useEffect(() => {
    if (!panelOpen || isMobile !== true) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [panelOpen, isMobile]);

  // Desktop: anclar al botón Filtros (portal fixed, evita clip por overflow)
  useLayoutEffect(() => {
    if (!panelOpen || isMobile !== false) {
      setDesktopPos(null);
      return;
    }

    function place() {
      const btn = document.querySelector("[data-filtros-trigger]");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const width = Math.min(22 * 16, window.innerWidth - 24);
      let left = rect.right - width;
      left = Math.min(Math.max(12, left), window.innerWidth - width - 12);
      const top = rect.bottom + 8;
      const maxHeight = Math.max(
        220,
        Math.min(window.innerHeight - top - 16, window.innerHeight * 0.72),
      );
      setDesktopPos({ left, top, width, maxHeight });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [panelOpen, isMobile]);

  if (!panelOpen || !mounted) return null;

  const fields = (
    <div className="space-y-4">
      <Field label="Ordenar por">
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className={selectClass}
        >
          {ORDEN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Estado">
        <div className="flex flex-wrap gap-1.5">
          <ChipOption
            active={!estado}
            onClick={() => setEstado(null)}
            label="Todos"
          />
          {Object.entries(ESTADOS_PROCESO).map(([value, label]) => (
            <ChipOption
              key={value}
              active={estado === value}
              onClick={() => setEstado(value)}
              label={label}
            />
          ))}
        </div>
      </Field>

      <Field label="Año">
        <div className="flex flex-wrap gap-1.5">
          <ChipOption
            active={anio == null}
            onClick={() => setAnio(null)}
            label="Todos"
          />
          {aniosDisponibles.map((y) => (
            <ChipOption
              key={y}
              active={anio === y}
              onClick={() => setAnio(y)}
              label={String(y)}
            />
          ))}
        </div>
      </Field>

      <Field label="Tipo de proceso">
        <div className="flex flex-wrap gap-1.5">
          <ChipOption
            active={!tipoProceso}
            onClick={() => setTipoProceso(null)}
            label="Todos"
          />
          {TIPOS_PROCESO.map((t) => (
            <ChipOption
              key={t}
              active={tipoProceso === t}
              onClick={() => setTipoProceso(t)}
              label={t}
            />
          ))}
        </div>
      </Field>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={clearFiltros}
        disabled={activeCount === 0}
        className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40"
      >
        Limpiar
      </button>
      <button
        type="button"
        onClick={closePanel}
        className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
      >
        Aplicar
      </button>
    </div>
  );

  // Móvil: bottom sheet
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col justify-end">
        <button
          type="button"
          aria-label="Cerrar filtros"
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          onClick={closePanel}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Filtros de contrataciones"
          className="relative z-10 flex max-h-[min(92dvh,40rem)] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex shrink-0 justify-center pt-2.5 pb-1">
            <span className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Filtros
              </h3>
              {activeCount > 0 ? (
                <p className="text-xs text-slate-500">
                  {activeCount} activo{activeCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar filtros"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {fields}
          </div>
          <div className="shrink-0 border-t border-slate-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // Desktop: portal fixed con scroll interno (no lo corta overflow del dashboard)
  if (!desktopPos) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Filtros de contrataciones"
      className="fixed z-[200] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-empresa-change"
      style={{
        left: desktopPos.left,
        top: desktopPos.top,
        width: desktopPos.width,
        maxHeight: desktopPos.maxHeight,
      }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {fields}
      </div>
      <div className="shrink-0 border-t border-slate-100 px-4 py-3">
        {footer}
      </div>
    </div>,
    document.body,
  );
}

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function Field({ label, children }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function ChipOption({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-brand text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
