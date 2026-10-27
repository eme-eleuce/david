"use client";

import { useState } from "react";
import { Building2, Pencil, Plus } from "lucide-react";
import EmpresaFormModal from "@/components/empresas/EmpresaFormModal";
import { useData } from "@/components/data/DataProvider";
import { LoadingBlock } from "@/components/ui/LoadingIcon";

export default function ConfiguracionPage() {
  const { empresas, loading, error } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="hidden text-2xl font-semibold text-slate-900 md:block">
            Configuración
          </h1>
          <p className="text-sm text-slate-500 md:mt-0.5">
            Administra las empresas del repositorio
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" />
          Nueva empresa
        </button>
      </div>

      {loading && <LoadingBlock label="Cargando empresas…" className="justify-start py-2" />}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {empresas.map((empresa) => (
            <li
              key={empresa.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {empresa.nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    {empresa.slug}
                    {empresa.activa ? "" : " · inactiva"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditing(empresa);
                  setOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            </li>
          ))}
          {!loading && empresas.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              No hay empresas. Crea la primera.
            </li>
          )}
        </ul>
      </div>

      <EmpresaFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        empresa={editing}
      />
    </div>
  );
}
