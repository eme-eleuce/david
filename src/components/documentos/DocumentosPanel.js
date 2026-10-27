"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  ArrowLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Receipt,
  ScrollText,
  Search,
  Shield,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import DocumentoPreview from "@/components/documentos/DocumentoPreview";
import DocumentoShareMenu from "@/components/documentos/DocumentoShareMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingIcon from "@/components/ui/LoadingIcon";
import Modal, { Field, inputClass } from "@/components/ui/Modal";
import { useData } from "@/components/data/DataProvider";
import {
  deleteDocumento,
  downloadDocumentoFile,
  uploadDocumento,
} from "@/lib/crud";
import {
  DOC_TIPO_ORDER,
  DOC_TIPO_TONE,
  TIPOS_DOCUMENTO,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";

const TIPO_ICON = {
  poliza: Shield,
  factura: Receipt,
  contrato: FileText,
  acta_provisional: ScrollText,
  acta_definitiva: ScrollText,
  certificado: Award,
  acta: ScrollText,
};

const filterInputClass =
  "rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 sm:text-sm";

export default function DocumentosPanel({ procesoId }) {
  const { getDocumentosByProceso, refresh } = useData();
  const docs = getDocumentosByProceso(procesoId);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [tipo, setTipo] = useState("contrato");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  /** null = listado de carpetas; string = tipo de carpeta abierta */
  const [activeFolder, setActiveFolder] = useState(null);

  const [filterQuery, setFilterQuery] = useState("");
  const hasSearch = Boolean(filterQuery.trim());

  const filteredDocs = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();

    let list = docs.filter((doc) => {
      if (q && !(doc.nombre || "").toLowerCase().includes(q)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (ta !== tb) return tb - ta;
      return (a.nombre || "").localeCompare(b.nombre || "", "es");
    });

    return list;
  }, [docs, filterQuery]);

  const folders = useMemo(() => {
    const map = {};
    for (const doc of filteredDocs) {
      if (!map[doc.tipo]) map[doc.tipo] = [];
      map[doc.tipo].push(doc);
    }

    const known = DOC_TIPO_ORDER.filter((t) => (map[t] ?? []).length > 0).map(
      (tipoKey) => ({
        tipo: tipoKey,
        label: TIPOS_DOCUMENTO[tipoKey] ?? tipoKey,
        items: map[tipoKey],
      }),
    );

    const extras = Object.keys(map)
      .filter((t) => !DOC_TIPO_ORDER.includes(t) && map[t].length > 0)
      .map((tipoKey) => ({
        tipo: tipoKey,
        label: TIPOS_DOCUMENTO[tipoKey] ?? tipoKey,
        items: map[tipoKey],
      }));

    return [...known, ...extras];
  }, [filteredDocs]);

  const currentFolder = useMemo(
    () => folders.find((f) => f.tipo === activeFolder) ?? null,
    [folders, activeFolder],
  );

  // Si la carpeta activa queda vacía (o la búsqueda la oculta), volver al listado
  useEffect(() => {
    if (activeFolder && !folders.some((f) => f.tipo === activeFolder)) {
      setActiveFolder(null);
    }
  }, [activeFolder, folders]);

  function openFolder(tipoKey) {
    setActiveFolder(tipoKey);
  }

  function backToFolders() {
    setActiveFolder(null);
  }

  function removeSelectedFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onUpload(event) {
    event.preventDefault();
    if (!files.length) return;
    setBusy(true);
    setError(null);

    const failures = [];
    for (const file of files) {
      const { error: uploadError } = await uploadDocumento({
        procesoId,
        tipo,
        file,
      });
      if (uploadError) {
        failures.push(`${file.name}: ${uploadError.message}`);
      }
    }

    if (failures.length === files.length) {
      setError(failures.join("\n"));
      setBusy(false);
      return;
    }

    setFiles([]);
    setTipo("contrato");
    setUploadOpen(false);
    setActiveFolder(tipo);
    await refresh();
    setBusy(false);

    if (failures.length > 0) {
      setError(
        `Algunos archivos no se subieron:\n${failures.join("\n")}`,
      );
    }
  }

  async function onDownload(doc) {
    setBusy(true);
    await downloadDocumentoFile(doc);
    setBusy(false);
  }

  async function confirmDeleteDoc() {
    if (!docToDelete) return;
    setDeleting(true);
    setError(null);
    const { error: delError } = await deleteDocumento(docToDelete);
    if (delError) {
      setError(delError.message);
      setDeleting(false);
      return;
    }
    setDocToDelete(null);
    await refresh();
    setDeleting(false);
  }

  const FolderTypeIcon = currentFolder
    ? (TIPO_ICON[currentFolder.tipo] ?? FileText)
    : Folder;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 md:py-3.5">
        <div className="min-w-0">
          {currentFolder ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={backToFolders}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Volver a carpetas"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Documentos
                </p>
                <h2 className="flex items-center gap-1.5 truncate text-base font-semibold text-slate-900 md:text-lg">
                  <FolderTypeIcon className="hidden h-4 w-4 shrink-0 text-brand sm:block" />
                  {currentFolder.label}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentFolder.items.length} documento
                  {currentFolder.items.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-base font-semibold text-slate-900 md:text-lg">
                Documentos
              </h2>
              <p className="text-xs text-slate-400 sm:text-sm">
                {docs.length === 0
                  ? "Ningún archivo aún"
                  : hasSearch
                    ? `${filteredDocs.length} de ${docs.length} archivo${docs.length === 1 ? "" : "s"}`
                    : `${docs.length} archivo${docs.length === 1 ? "" : "s"} · ${folders.length} carpeta${folders.length === 1 ? "" : "s"}`}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setFiles([]);
            if (currentFolder) setTipo(currentFolder.tipo);
            setUploadOpen(true);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-white transition hover:bg-brand-hover md:h-10 md:rounded-xl md:px-3.5"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {docs.length > 0 && (
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:px-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={
                currentFolder
                  ? `Buscar en ${currentFolder.label}…`
                  : "Buscar por nombre de archivo…"
              }
              className={`${filterInputClass} w-full py-2 pl-9 pr-9`}
            />
            {filterQuery ? (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-4 md:p-4">
        {error && !uploadOpen && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
              <FolderOpen className="h-7 w-7" />
            </span>
            <div>
              <p className="text-base font-medium text-slate-700">
                Sin documentos
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Agrega contrato, póliza, factura, actas o certificado
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-brand/40 hover:text-brand"
            >
              <Upload className="h-4 w-4" />
              Subir primer documento
            </button>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-base font-medium text-slate-700">
              Ningún documento coincide
            </p>
            <p className="text-sm text-slate-400">
              Prueba otro nombre de archivo
            </p>
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="mt-1 text-sm font-medium text-brand hover:underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : currentFolder ? (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {currentFolder.items.map((doc) => (
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
                    disabled={busy}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-soft hover:text-brand"
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
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder) => {
              const count = folder.items.length;
              return (
                <li key={folder.tipo}>
                  <button
                    type="button"
                    onClick={() => openFolder(folder.tipo)}
                    className="group flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-brand/40 hover:bg-brand-soft/30 hover:shadow-sm"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1 ${
                        DOC_TIPO_TONE[folder.tipo] ??
                        "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      <Folder className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {folder.label}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {count} doc{count === 1 ? "" : "s"}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => !busy && setUploadOpen(false)}
        title="Agregar documentos"
      >
        <form onSubmit={onUpload} className="space-y-4">
          <Field label="Tipo de documento">
            <select
              className={inputClass}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              disabled={busy}
            >
              {Object.entries(TIPOS_DOCUMENTO).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Archivos">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
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
            {files.length > 0 && (
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
            )}
          </Field>

          {error && (
            <p className="whitespace-pre-line rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => setUploadOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
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
        title="Eliminar documento"
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
