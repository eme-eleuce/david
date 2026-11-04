"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import ContratacionesTable from "@/components/dashboard/ContratacionesTable";
import KpiStats, { KpiStatsToggle } from "@/components/dashboard/KpiStats";
import { useData } from "@/components/data/DataProvider";
import LoadingIcon from "@/components/ui/LoadingIcon";
import { formatDateTime } from "@/lib/format";

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
  const [statsOpen, setStatsOpen] = useState(true);

  return (
    <div className="animate-empresa-change flex min-h-0 flex-col gap-4 md:h-full">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
          <div className="mt-1 hidden sm:block">
            <LastUpdated />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block md:hidden">
            <LastUpdated />
          </div>
          <KpiStatsToggle
            open={statsOpen}
            onToggle={() => setStatsOpen((v) => !v)}
          />
        </div>
      </div>

      <KpiStats kpis={kpis} open={statsOpen} />

      <ContratacionesTable />
    </div>
  );
}
