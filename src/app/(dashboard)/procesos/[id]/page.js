"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CircleDollarSign,
  FileType,
  Landmark,
  Pencil,
  Trash2,
} from "lucide-react";
import DocumentosPanel from "@/components/documentos/DocumentosPanel";
import ProcesoFormModal from "@/components/procesos/ProcesoFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { LoadingBlock } from "@/components/ui/LoadingIcon";
import { useData } from "@/components/data/DataProvider";
import { deleteProceso, updateProceso } from "@/lib/crud";
import { ESTADO_STYLES, ESTADOS_PROCESO } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

export default function ProcesoPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { loading, error, refresh, getProcesoById, empresas } = useData();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingEstado, setSavingEstado] = useState(false);
  const [actionError, setActionError] = useState(null);

  if (loading) {
    return <LoadingBlock label="Cargando proceso…" />;
  }

  if (error) {
    return <p className="text-sm text-red-600">Error: {error}</p>;
  }

  const proceso = getProcesoById(id);
  if (!proceso) {
    return (
      <div className="space-y-2">
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Volver
        </Link>
        <p className="text-sm text-slate-600">Proceso no encontrado.</p>
      </div>
    );
  }

  const empresa = empresas.find((e) => e.id === proceso.empresaId);
  const backHref = empresa ? `/empresas/${empresa.slug}` : "/";

  async function confirmDelete() {
    setDeleting(true);
    setActionError(null);
    const { error: delError } = await deleteProceso(proceso.id);
    if (delError) {
      setActionError(delError.message);
      setDeleting(false);
      return;
    }
    await refresh();
    router.push(backHref);
  }

  async function onEstadoChange(nuevoEstado) {
    if (nuevoEstado === proceso.estado) return;
    setSavingEstado(true);
    setActionError(null);
    const { error: updError } = await updateProceso(proceso.id, {
      estado: nuevoEstado,
    });
    if (updError) {
      setActionError(updError.message);
      setSavingEstado(false);
      return;
    }
    await refresh();
    setSavingEstado(false);
  }

  const estadoActual = ESTADOS_PROCESO[proceso.estado] ?? proceso.estado;

  return (
    <div className="flex min-h-0 flex-col gap-2 overflow-auto md:h-full md:gap-4 md:overflow-hidden">
      <Link
        href={backHref}
        className="inline-flex w-fit shrink-0 items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-brand sm:gap-1.5 sm:text-sm md:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver
      </Link>

      <div className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-brand"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-8 -top-10 hidden h-28 w-28 rounded-full bg-brand-soft/40 md:block"
          aria-hidden
        />

        <div className="relative space-y-2.5 p-3 sm:space-y-3 sm:p-4 md:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={backHref}
                className="mb-1.5 hidden items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-brand md:inline-flex"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver
              </Link>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="min-w-0 text-base font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl md:text-2xl">
                  {proceso.objeto}
                </h1>
                <span
                  className={`inline-flex w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-0.5 sm:text-xs ${
                    ESTADO_STYLES[proceso.estado] ??
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {estadoActual}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-brand px-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-brand-hover sm:h-9 sm:px-3 sm:text-sm"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-200/80 bg-red-50/50 px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60 sm:h-9 sm:px-3 sm:text-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            </div>
          </div>

          {actionError && (
            <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
              {actionError}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3 xl:grid-cols-5">
            <MetaField
              icon={Building2}
              label="Empresa"
              value={empresa?.nombre ?? "—"}
            />
            <MetaField
              icon={Landmark}
              label="Entidad"
              value={proceso.entidadContratante}
            />
            <MetaField
              icon={CircleDollarSign}
              label="Monto"
              value={formatMoney(proceso.monto)}
              emphasize
            />
            <MetaField
              icon={Calendar}
              label="Año"
              value={String(proceso.anio)}
            />
            <MetaField
              icon={FileType}
              label="Tipo"
              value={proceso.tipoProceso}
              className="col-span-2 sm:col-span-2 lg:col-span-1"
            />
          </dl>

          <div className="border-t border-slate-100 pt-2.5 sm:pt-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
              Cambiar estado
            </p>
            <div className="flex flex-wrap gap-1 rounded-lg bg-slate-50/90 p-1 ring-1 ring-slate-100">
              {Object.entries(ESTADOS_PROCESO).map(([value, label]) => {
                const active = proceso.estado === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={savingEstado}
                    onClick={() => onEstadoChange(value)}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition sm:px-2.5 sm:py-1.5 sm:text-xs ${
                      active
                        ? `${ESTADO_STYLES[value]} shadow-sm`
                        : "text-slate-500 hover:bg-white hover:text-slate-800"
                    } disabled:opacity-60`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <section className="flex min-h-[18rem] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm md:min-h-0 md:rounded-2xl">
        <DocumentosPanel procesoId={proceso.id} />
      </section>

      <ProcesoFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        proceso={proceso}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Eliminar proceso"
        message="¿Seguro que quieres eliminar este proceso y sus documentos? Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
      />
    </div>
  );
}

function MetaField({
  icon: Icon,
  label,
  value,
  emphasize = false,
  className = "",
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-lg bg-slate-50/90 px-2 py-1.5 ring-1 ring-slate-100/80 sm:px-3 sm:py-2 ${className}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-brand shadow-sm ring-1 ring-slate-100 sm:h-9 sm:w-9">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[9px] font-medium uppercase tracking-wide text-slate-400 sm:text-[10px]">
          {label}
        </dt>
        <dd
          className={`truncate text-xs leading-snug sm:text-sm sm:whitespace-normal ${
            emphasize
              ? "font-semibold text-slate-900"
              : "font-medium text-slate-800"
          }`}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
