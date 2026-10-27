"use client";

import { Building2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import { LoadingBlock } from "@/components/ui/LoadingIcon";
import { themeForSlug } from "@/lib/empresas-meta";

export default function EmpresaSelectModal() {
  const {
    empresas,
    empresa,
    pickerOpen,
    closePicker,
    selectEmpresa,
    ready,
    loadingEmpresas,
  } = useEmpresa();
  const [mounted, setMounted] = useState(false);
  const required = !empresa;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pickerOpen]);

  if (!mounted || !ready || !pickerOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={required ? undefined : "Cerrar"}
        className="absolute inset-0 bg-slate-900/55"
        onClick={() => {
          if (!required) closePicker();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Elegir empresa"
        className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:mx-4 sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">
            POTTS OS
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Elija empresa
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {required
              ? "Selecciona una empresa para continuar"
              : "Cambia de empresa activa"}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loadingEmpresas ? (
            <LoadingBlock label="Cargando empresas…" />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {empresas.map((item) => {
                const theme = themeForSlug(item.slug);
                const active = empresa?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectEmpresa(item.slug)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition hover:shadow-sm ${
                        active
                          ? "border-transparent shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
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
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-100">
                        {item.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.logoUrl}
                            alt=""
                            className="max-h-9 max-w-9 object-contain"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-slate-400" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {item.nombre}
                        </span>
                        {item.slogan ? (
                          <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                            {item.slogan}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!loadingEmpresas && empresas.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No hay empresas configuradas.
            </p>
          )}
        </div>

        {!required && (
          <div className="shrink-0 border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              onClick={closePicker}
              className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
