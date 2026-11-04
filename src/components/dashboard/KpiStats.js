"use client";

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  FileText,
} from "lucide-react";
import { formatMoney } from "@/lib/format";

const TONE = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  purple: "bg-purple-soft text-purple",
  sky: "bg-sky-soft text-sky",
  teal: "bg-teal-soft text-teal",
};

/**
 * Botón móvil (derecha del header) para mostrar/ocultar stats.
 */
export function KpiStatsToggle({ open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="kpi-stats-panel"
      title={open ? "Ocultar estadísticas" : "Mostrar estadísticas"}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-brand md:hidden"
    >
      {open ? (
        <ChevronUp className="h-5 w-5" aria-hidden />
      ) : (
        <ChevronDown className="h-5 w-5" aria-hidden />
      )}
      <span className="sr-only">
        {open ? "Ocultar estadísticas" : "Mostrar estadísticas"}
      </span>
    </button>
  );
}

/**
 * Stats / KPIs del overview. En móvil se muestra según `open` (default abierto).
 * @param {{
 *   kpis: { totalProcesos: number, montoTotal: number, finalizados: number, enEjecucion: number, entidades: number },
 *   open?: boolean,
 * }} props
 */
export default function KpiStats({ kpis, open = true }) {
  return (
    <section
      id="kpi-stats-panel"
      className={`grid shrink-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-5 ${
        open ? "" : "max-md:hidden"
      }`}
    >
      <KpiCard
        label="Total de procesos"
        value={kpis.totalProcesos}
        icon={FileText}
        tone="brand"
      />
      <KpiCard
        label="Monto total contratado"
        value={formatMoney(kpis.montoTotal)}
        icon={CircleDollarSign}
        tone="success"
      />
      <KpiCard
        label="Procesos finalizados"
        value={kpis.finalizados}
        icon={CheckCircle2}
        tone="purple"
      />
      <KpiCard
        label="Procesos en ejecución"
        value={kpis.enEjecucion}
        icon={CalendarDays}
        tone="sky"
      />
      <KpiCard
        label="Entidades contratantes"
        value={kpis.entidades}
        icon={Building2}
        tone="teal"
        className="col-span-2 xl:col-span-1"
      />
    </section>
  );
}

function KpiCard({ label, value, icon: Icon, tone, className = "" }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-2.5 py-2.5 shadow-sm sm:gap-3 sm:px-4 sm:py-3.5 ${className}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${TONE[tone]}`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] leading-tight text-slate-500 sm:truncate sm:text-xs">
          {label}
        </p>
        <p className="truncate text-base font-semibold text-slate-900 sm:text-lg">
          {value}
        </p>
      </div>
    </div>
  );
}
