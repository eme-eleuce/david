"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
} from "lucide-react";
import ContratacionesTable from "@/components/dashboard/ContratacionesTable";
import { useData } from "@/components/data/DataProvider";
import LoadingIcon from "@/components/ui/LoadingIcon";
import { formatDateTime, formatMoney } from "@/lib/format";

function LastUpdated() {
  const [label, setLabel] = useState(null);

  useEffect(() => {
    setLabel(formatDateTime());
  }, []);

  return (
    <p className="flex items-center gap-1.5 text-xs text-slate-500">
      <CalendarDays className="h-3.5 w-3.5" />
      {label ? `Última actualización ${label}` : "Última actualización …"}
    </p>
  );
}

export default function DashboardContent() {
  const { getKpis, loading } = useData();
  const kpis = getKpis(null);

  return (
    <div className="animate-empresa-change flex min-h-0 flex-col gap-4 md:h-full">
      <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
        <div>
          <h1 className="hidden text-2xl font-semibold text-slate-900 md:block">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 md:mt-0.5">
            Vista consolidada de todas las empresas
            {loading ? (
              <span className="ml-1 inline-flex items-center gap-1.5 align-middle">
                · <LoadingIcon className="h-3.5 w-3.5" /> cargando…
              </span>
            ) : null}
          </p>
        </div>
        <LastUpdated />
      </div>

      <section className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-5">
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

      <ContratacionesTable />
    </div>
  );
}

const TONE = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  purple: "bg-purple-soft text-purple",
  sky: "bg-sky-soft text-sky",
  teal: "bg-teal-soft text-teal",
};

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
