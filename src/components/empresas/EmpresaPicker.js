"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { useData } from "@/components/data/DataProvider";
import { LoadingBlock } from "@/components/ui/LoadingIcon";
import { EMPRESA_STORAGE_KEY } from "@/lib/empresas-meta";

export default function EmpresaPicker() {
  const { empresas, loading, error } = useData();

  function remember(slug) {
    try {
      localStorage.setItem(EMPRESA_STORAGE_KEY, slug);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return <LoadingBlock label="Cargando empresas…" />;
  }

  if (error) {
    return (
      <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col gap-6 overflow-auto p-1 sm:p-2">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Escoger empresa
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Selecciona la empresa para ver sus contrataciones y documentos
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {empresas.map((empresa) => (
          <li key={empresa.id}>
            <Link
              href={`/empresas/${empresa.slug}`}
              onClick={() => remember(empresa.slug)}
              className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm transition hover:border-brand/40 hover:shadow-md"
            >
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
                {empresa.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={empresa.logoUrl}
                    alt={empresa.nombre}
                    className="max-h-16 max-w-16 object-contain"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-slate-400" />
                )}
              </span>
              <span className="text-sm font-semibold tracking-wide text-slate-900 group-hover:text-brand">
                {empresa.nombre}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {empresas.length === 0 && (
        <p className="text-center text-sm text-slate-500">
          No hay empresas. Créalas en Configuración o ejecuta el seed en
          Supabase.
        </p>
      )}
    </div>
  );
}
