"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import DocumentoPreview from "@/components/documentos/DocumentoPreview";
import DocumentoShareMenu from "@/components/documentos/DocumentoShareMenu";
import { useData } from "@/components/data/DataProvider";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingIcon, { LoadingBlock } from "@/components/ui/LoadingIcon";
import Modal, { Field, inputClass } from "@/components/ui/Modal";
import {
  deleteExpedienteDocumento,
  downloadDocumentoFile,
  uploadExpedienteDocumento,
} from "@/lib/crud";
import { formatDate } from "@/lib/format";

export default function ExpedientePage() {
  const router = useRouter();
  const { getExpedienteByEmpresa, loading, error, refresh } = useData();
  const { empresaId, empresa, storedSlug } = useEmpresa();

  useEffect(() => {
    if (!empresaId && storedSlug === null) return;
    if (!empresaId) router.replace("/");
  }, [empresaId, storedSlug, router]);

  const docs = useMemo(
    () => (empresaId ? getExpedienteByEmpresa(empresaId) : []),
    [getExpedienteByEmpresa, empresaId],
  );

  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  function removeSelectedFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onUpload(event) {
    event.preventDefault();
    if (!files.length || !empresaId) return;
    setBusy(true);
    setUploadError(null);

    const failures = [];
    for (const file of files) {
      const { error: err } = await uploadExpedienteDocumento({
        empresaId,
        file,
      });
      if (err) failures.push(`${file.name}: ${err.message}`);
    }

    if (failures.length === files.length) {
      setUploadError(failures.join("\n"));
      setBusy(false);
      return;
    }

    setFiles([]);
    setUploadOpen(false);
    await refresh();
    setBusy(false);

    if (failures.length > 0) {
      setUploadError(`Algunos archivos no se subieron:\n${failures.join("\n")}`);
    }
  }

  async function onDownload(doc) {
    setBusyId(doc.id);
    try {
      await downloadDocumentoFile(doc);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDeleteDoc() {
    if (!docToDelete) return;
    setDeleting(true);
    setUploadError(null);
    const { error: delError } = await deleteExpedienteDocumento(docToDelete);
    if (delError) {
      setUploadError(delError.message);
      setDeleting(false);
      return;
    }
    setDocToDelete(null);
    await refresh();
    setDeleting(false);
  }

  if (!empresaId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-slate-600">
          Primero escoge una empresa para ver su expediente.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-brand hover:underline"
        >
          Cambiar empresa
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 md:py-3.5">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-900 md:text-lg">
            Expediente
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">
            {empresa?.nombre}
            {loading
              ? " · cargando…"
              : docs.length === 0
                ? " · sin archivos aún"
                : ` · ${docs.length} archivo${docs.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setUploadError(null);
            setFiles([]);
            setUploadOpen(true);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-white transition hover:bg-brand-hover md:h-10 md:rounded-xl md:px-3.5"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-4">
        {loading ? <LoadingBlock label="Cargando expediente…" /> : null}

        {error && !loading ? (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {uploadError && !uploadOpen ? (
          <p className="mb-3 whitespace-pre-line rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {uploadError}
          </p>
        ) : null}

        {!loading && !error && docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
              <FolderOpen className="h-7 w-7" />
            </span>
            <div>
              <p className="text-base font-medium text-slate-700">
                Expediente vacío
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Agrega documentos legales, tributarios u otros archivos de la
                empresa
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setFiles([]);
                setUploadOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:text-brand"
            >
              <Upload className="h-4 w-4" />
              Agregar documento
            </button>
          </div>
        ) : null}

        {!loading && !error && docs.length > 0 ? (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3"
              >
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {doc.nombre}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400 sm:text-xs">
                      <span>{formatDate(doc.createdAt)}</span>
                      <span className="inline-flex items-center gap-1 text-brand">
                        <Eye className="h-3 w-3" />
                        Vista previa
                      </span>
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 items-center">
                  <DocumentoShareMenu doc={doc} />
                  <button
                    type="button"
                    onClick={() => onDownload(doc)}
                    disabled={busyId === doc.id}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-soft hover:text-brand disabled:opacity-50"
                    aria-label="Descargar"
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocToDelete(doc)}
                    disabled={busy || deleting}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Eliminar"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => !busy && setUploadOpen(false)}
        title="Agregar al expediente"
      >
        <form onSubmit={onUpload} className="space-y-4">
          <Field label="Archivos">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white`}
              onChange={(e) => {
                const next = Array.from(e.target.files ?? []);
                setFiles((prev) => {
                  const names = new Set(prev.map((f) => `${f.name}-${f.size}`));
                  const merged = [...prev];
                  for (const f of next) {
                    const key = `${f.name}-${f.size}`;
                    if (!names.has(key)) {
                      names.add(key);
                      merged.push(f);
                    }
                  }
                  return merged;
                });
                e.target.value = "";
              }}
              disabled={busy}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Puedes seleccionar varios a la vez
            </p>
            {files.length > 0 ? (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80 p-2">
                {files.map((f, index) => (
                  <li
                    key={`${f.name}-${f.size}-${index}`}
                    className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-xs text-slate-700 ring-1 ring-slate-100"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeSelectedFile(index)}
                      className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      aria-label={`Quitar ${f.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Field>

          {uploadError ? (
            <p className="whitespace-pre-line rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {uploadError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => setUploadOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || files.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {busy ? (
                <LoadingIcon className="h-4 w-4" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {busy
                ? "Subiendo…"
                : files.length > 1
                  ? `Subir ${files.length} archivos`
                  : "Subir archivo"}
            </button>
          </div>
        </form>
      </Modal>

      <DocumentoPreview
        doc={previewDoc}
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
      />

      <ConfirmDialog
        open={Boolean(docToDelete)}
        onClose={() => !deleting && setDocToDelete(null)}
        onConfirm={confirmDeleteDoc}
        loading={deleting}
        title="Eliminar del expediente"
        message={
          docToDelete
            ? `¿Seguro que quieres eliminar “${docToDelete.nombre}”?`
            : ""
        }
        confirmLabel="Sí, eliminar"
      />
    </div>
  );
}
