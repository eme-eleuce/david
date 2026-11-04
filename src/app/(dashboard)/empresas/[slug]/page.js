"use client";

import { use, useState } from "react";
import { Building2 } from "lucide-react";
import ContratacionesTable from "@/components/dashboard/ContratacionesTable";
import KpiStats, { KpiStatsToggle } from "@/components/dashboard/KpiStats";
import { useData } from "@/components/data/DataProvider";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import { LoadingBlock } from "@/components/ui/LoadingIcon";

export default function EmpresaPage({ params }) {
  const { slug } = use(params);
  const { loading, error, getEmpresaBySlug, getKpis } = useData();
  const { empresa } = useEmpresa();
  const [statsOpen, setStatsOpen] = useState(true);

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
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-slate-900 md:text-2xl">
              {nombre}
            </h1>
            {slogan ? (
              <p className="mt-0.5 text-xs leading-snug text-slate-500 md:text-sm">
                {slogan}
              </p>
            ) : null}
          </div>
          <KpiStatsToggle
            open={statsOpen}
            onToggle={() => setStatsOpen((v) => !v)}
          />
        </div>
        <p className="hidden text-sm font-medium text-slate-600 md:block">
          Vista general
        </p>
      </div>

      <KpiStats kpis={kpis} open={statsOpen} />

      <ContratacionesTable showToolbar={false} />
    </div>
  );
}
