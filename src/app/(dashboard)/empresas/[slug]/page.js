"use client";

import { use } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
} from "lucide-react";
import ContratacionesTable from "@/components/dashboard/ContratacionesTable";
import { useData } from "@/components/data/DataProvider";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import { LoadingBlock } from "@/components/ui/LoadingIcon";
import { formatMoney } from "@/lib/format";

export default function EmpresaPage({ params }) {
  const { slug } = use(params);
  const { loading, error, getEmpresaBySlug, getKpis } = useData();
  const { empresa } = useEmpresa();

  const found = getEmpresaBySlug(slug);

  if (loading) {
    return <LoadingBlock label="Cargando…" />;
  }

  if (error) {
    return <p className="text-sm text-red-600">Error: {error}</p>;
  }

  if (!found) {
    return <p className="text-sm text-slate-600">Empresa no encontrada.</p>;
  }

  const kpis = getKpis(found.id);
  const nombre = empresa?.nombre ?? found.nombre;
  const slogan = empresa?.slogan ?? found.slogan;
  const logoUrl = empresa?.logoUrl ?? found.logoUrl;

  return (
    <div
      key={found.id}
      className="animate-empresa-change flex min-h-0 flex-col gap-4 md:h-full"
    >
      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="max-h-9 max-w-9 object-contain"
              />
            ) : (
              <Building2 className="h-6 w-6 text-slate-400" />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-slate-900 md:text-2xl">
              {nombre}
            </h1>
            {slogan ? (
              <p className="mt-0.5 text-xs leading-snug text-slate-500 md:text-sm">
                {slogan}
              </p>
            ) : null}
          </div>
        </div>
        <p className="hidden text-sm font-medium text-slate-600 md:block">
          Vista general
        </p>
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

      <ContratacionesTable showToolbar={false} />
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
