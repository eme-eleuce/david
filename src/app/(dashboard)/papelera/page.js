"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  FolderOpen,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useData } from "@/components/data/DataProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingIcon, { LoadingBlock } from "@/components/ui/LoadingIcon";
import {
  PAPELERA_RETENTION_DAYS,
  fetchPapelera,
  purgeDocumento,
  purgeExpedienteDocumento,
  purgeProceso,
  restoreDocumento,
  restoreExpedienteDocumento,
  restoreProceso,
} from "@/lib/crud";
import { TIPOS_DOCUMENTO } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import {
  mapDocumento,
  mapExpedienteDocumento,
  mapProceso,
} from "@/lib/mappers";

const TABS = [
  { id: "procesos", label: "Procesos" },
  { id: "documentos", label: "Documentos" },
  { id: "expediente", label: "Expediente" },
];

function daysLeft(deletedAt) {
  if (!deletedAt) return PAPELERA_RETENTION_DAYS;
  const deleted = new Date(deletedAt).getTime();
  const expires =
    deleted + PAPELERA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function PapeleraPage() {
  const { empresas, refresh } = useData();
  const [tab, setTab] = useState("procesos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesos, setProcesos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [expediente, setExpediente] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [purgeTarget, setPurgeTarget] = useState(null);
  const [purging, setPurging] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await fetchPapelera();
    if (err) {
      setError(
        err.message?.includes("deleted_at")
          ? "Falta aplicar la migración de papelera en Supabase (deleted_at)."
          : err.message,
      );
      setProcesos([]);
      setDocumentos([]);
      setExpediente([]);
      setLoading(false);
      return;
    }

    const mappedProcesos = (data.procesos ?? []).map(mapProceso);
    const deletedProcesoIds = new Set(mappedProcesos.map((p) => p.id));

    setProcesos(mappedProcesos);
    // Docs sueltos: no listar los que van con un proceso ya en papelera
    setDocumentos(
      (data.documentos ?? [])
        .map(mapDocumento)
        .filter((d) => !deletedProcesoIds.has(d.procesoId)),
    );
    setExpediente((data.expediente ?? []).map(mapExpedienteDocumento));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const empresaName = useMemo(() => {
    const map = new Map(empresas.map((e) => [e.id, e.nombre]));
    return (empresaId) => map.get(String(empresaId)) ?? "—";
  }, [empresas]);

  async function onRestore(kind, id) {
    setBusyId(`${kind}-${id}`);
    setError(null);
    let result;
    if (kind === "proceso") result = await restoreProceso(id);
    else if (kind === "documento") result = await restoreDocumento(id);
    else result = await restoreExpedienteDocumento(id);

    if (result?.error) {
      setError(result.error.message);
      setBusyId(null);
      return;
    }
    await Promise.all([load(), refresh()]);
    setBusyId(null);
  }

  async function confirmPurge() {
    if (!purgeTarget) return;
    setPurging(true);
    setError(null);
    const { kind, item } = purgeTarget;
    let result;
    if (kind === "proceso") result = await purgeProceso(item.id);
    else if (kind === "documento") result = await purgeDocumento(item);
    else result = await purgeExpedienteDocumento(item);

    if (result?.error) {
      setError(result.error.message);
      setPurging(false);
      return;
    }
    setPurgeTarget(null);
    await Promise.all([load(), refresh()]);
    setPurging(false);
  }

  const counts = {
    procesos: procesos.length,
    documentos: documentos.length,
    expediente: expediente.length,
  };

  if (loading) {
    return <LoadingBlock label="Cargando papelera…" />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5">
        <h1 className="text-lg font-semibold text-slate-900">Papelera</h1>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
          Los elementos eliminados se conservan {PAPELERA_RETENTION_DAYS} días.
          Puedes restaurarlos o borrarlos de forma definitiva.
        </p>
      </div>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-100 px-2 py-2 sm:px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              tab === t.id
                ? "bg-brand-soft text-brand"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                tab === t.id
                  ? "bg-white/80 text-brand"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <p className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-5">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
        {tab === "procesos" ? (
          procesos.length === 0 ? (
            <EmptyState label="No hay procesos en la papelera" />
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {procesos.map((p) => (
                <PapeleraRow
                  key={p.id}
                  title={p.objeto}
                  meta={`${p.entidadContratante || "—"} · ${empresaName(p.empresaId)} · ${p.anio}`}
                  deletedAt={p.deletedAt}
                  busy={busyId === `proceso-${p.id}`}
                  onRestore={() => onRestore("proceso", p.id)}
                  onPurge={() => setPurgeTarget({ kind: "proceso", item: p })}
                />
              ))}
            </ul>
          )
        ) : null}

        {tab === "documentos" ? (
          documentos.length === 0 ? (
            <EmptyState label="No hay documentos de proceso en la papelera" />
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {documentos.map((d) => (
                <PapeleraRow
                  key={d.id}
                  icon={FileText}
                  title={d.nombre}
                  meta={TIPOS_DOCUMENTO[d.tipo] ?? d.tipo}
                  deletedAt={d.deletedAt}
                  busy={busyId === `documento-${d.id}`}
                  onRestore={() => onRestore("documento", d.id)}
                  onPurge={() =>
                    setPurgeTarget({ kind: "documento", item: d })
                  }
                />
              ))}
            </ul>
          )
        ) : null}

        {tab === "expediente" ? (
          expediente.length === 0 ? (
            <EmptyState label="No hay archivos de expediente en la papelera" />
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {expediente.map((d) => (
                <PapeleraRow
                  key={d.id}
                  icon={FolderOpen}
                  title={d.nombre}
                  meta={empresaName(d.empresaId)}
                  deletedAt={d.deletedAt}
                  busy={busyId === `expediente-${d.id}`}
                  onRestore={() => onRestore("expediente", d.id)}
                  onPurge={() =>
                    setPurgeTarget({ kind: "expediente", item: d })
                  }
                />
              ))}
            </ul>
          )
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(purgeTarget)}
        onClose={() => !purging && setPurgeTarget(null)}
        onConfirm={confirmPurge}
        loading={purging}
        title="Borrar definitivamente"
        message="Esta acción no se puede deshacer. El elemento y sus archivos se eliminarán por completo."
        confirmLabel="Sí, borrar"
      />
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Trash2 className="h-8 w-8 text-slate-300" aria-hidden />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function PapeleraRow({
  title,
  meta,
  deletedAt,
  busy,
  onRestore,
  onPurge,
  icon: Icon = FileText,
}) {
  const [expanded, setExpanded] = useState(false);
  const left = daysLeft(deletedAt);

  return (
    <li className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left sm:pointer-events-none"
        aria-expanded={expanded}
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-slate-100">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium text-slate-900 ${
              expanded ? "whitespace-normal break-words" : "truncate"
            } sm:whitespace-normal sm:break-words`}
          >
            {title}
          </p>
          <p
            className={`text-xs text-slate-500 ${
              expanded ? "whitespace-normal break-words" : "truncate"
            } sm:whitespace-normal sm:break-words`}
          >
            {meta}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Eliminado {formatDate(deletedAt)}
            {" · "}
            {left === 0
              ? "Se puede purgar"
              : `${left} día${left === 1 ? "" : "s"} restantes`}
            <span className="ml-1 text-slate-300 sm:hidden">
              · {expanded ? "Toque para ocultar" : "Toque para ver todo"}
            </span>
          </p>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
        <button
          type="button"
          disabled={busy}
          onClick={onRestore}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? (
            <LoadingIcon className="h-3.5 w-3.5" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          )}
          Restaurar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onPurge}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200/80 bg-red-50/50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Borrar
        </button>
      </div>
    </li>
  );
}
