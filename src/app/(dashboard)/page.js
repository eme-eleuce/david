"use client";

import { Building2 } from "lucide-react";
import { useData } from "@/components/data/DataProvider";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import { LoadingBlock } from "@/components/ui/LoadingIcon";
import { themeForSlug } from "@/lib/empresas-meta";

/**
 * Pantalla neutral post-login: solo elegir empresa.
 * Tras elegir, el dashboard (sidebar + rutas) sigue normal.
 */
export default function EscogerEmpresaPage() {
  const { empresas, loading, error } = useData();
  const { selectEmpresa, storedSlug } = useEmpresa();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center gap-4 px-3 py-6 sm:gap-8 sm:px-8 sm:py-10">
      <div className="text-center sm:text-left">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand sm:text-xs">
          POTTS OS
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">
          Escoger empresa
        </h1>
        <p className="mt-1 max-w-xl text-xs text-slate-500 sm:mt-2 sm:text-sm">
          Selecciona la empresa con la que quieres trabajar. Luego podrás
          cambiarla cuando quieras desde el menú.
        </p>
      </div>

      {loading ? <LoadingBlock label="Cargando empresas…" /> : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {empresas.map((item) => {
            const theme = themeForSlug(item.slug);
            const active = storedSlug === item.slug;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectEmpresa(item.slug)}
                  className={`group flex h-full w-full flex-col items-center gap-1.5 rounded-xl border bg-white p-3 text-center shadow-sm transition hover:shadow-md sm:gap-3 sm:rounded-2xl sm:p-6 ${
                    active
                      ? "border-transparent ring-2"
                      : "border-slate-200/80 hover:border-slate-300"
                  }`}
                  style={
                    active
                      ? {
                          boxShadow: `0 0 0 2px ${theme.brand}`,
                          backgroundColor: theme.brandSoft,
                        }
                      : undefined
                  }
                >
                  <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100 sm:h-20 sm:w-20 sm:rounded-xl">
                    {item.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.logoUrl}
                        alt=""
                        className="max-h-9 max-w-9 object-contain sm:max-h-16 sm:max-w-16"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-slate-400 sm:h-8 sm:w-8" />
                    )}
                  </span>
                  <span className="line-clamp-2 text-xs font-semibold leading-tight tracking-wide text-slate-900 sm:text-sm">
                    {item.nombre}
                  </span>
                  {item.slogan ? (
                    <span className="hidden text-xs leading-snug text-slate-500 sm:block">
                      {item.slogan}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && !error && empresas.length === 0 ? (
        <p className="text-center text-sm text-slate-500">
          No hay empresas cargadas. Ejecuta el seed en Supabase.
        </p>
      ) : null}
    </div>
  );
}
