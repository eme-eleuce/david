"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Search,
  X,
} from "lucide-react";
import DocumentoPreview from "@/components/documentos/DocumentoPreview";
import DocumentoShareMenu from "@/components/documentos/DocumentoShareMenu";
import { useData } from "@/components/data/DataProvider";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import { LoadingBlock } from "@/components/ui/LoadingIcon";
import PaginationControls from "@/components/ui/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import { downloadDocumentoFile } from "@/lib/crud";
import { TIPOS_DOCUMENTO } from "@/lib/constants";

const TIPO_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  ...Object.entries(TIPOS_DOCUMENTO).map(([value, label]) => ({
    value,
    label,
  })),
];

export default function DocumentotecaPage() {
  const router = useRouter();
  const {
    documentos,
    procesos,
    empresas,
    loading,
    error,
  } = useData();
  const { empresaId, empresa, storedSlug } = useEmpresa();

  useEffect(() => {
    if (!empresaId && storedSlug === null) return;
    if (!empresaId) router.replace("/");
  }, [empresaId, storedSlug, router]);


  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const enriched = useMemo(() => {
    const procesoMap = Object.fromEntries(procesos.map((p) => [p.id, p]));
    const empresaMap = Object.fromEntries(empresas.map((e) => [e.id, e]));

    return documentos
      .map((doc) => {
        const proceso = procesoMap[doc.procesoId] ?? null;
        const empresa = proceso
          ? empresaMap[proceso.empresaId] ?? null
          : null;
        return { doc, proceso, empresa };
      })
      .filter((row) => {
        if (!empresaId || row.empresa?.id !== empresaId) return false;
        if (tipo && row.doc.tipo !== tipo) return false;

        const q = query.trim().toLowerCase();
        if (!q) return true;

        const haystack = [
          row.doc.nombre,
          TIPOS_DOCUMENTO[row.doc.tipo] ?? row.doc.tipo,
          row.empresa?.nombre,
          row.proceso?.objeto,
          row.proceso?.entidadContratante,
          row.proceso?.anio != null ? String(row.proceso.anio) : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      })
      .sort((a, b) =>
        (a.doc.nombre || "").localeCompare(b.doc.nombre || "", "es", {
          sensitivity: "base",
        }),
      );
  }, [documentos, procesos, empresas, empresaId, tipo, query]);

  const resetKey = `${empresaId ?? "ninguna"}|${query}|${tipo}`;
  const pagination = usePagination(enriched.length, resetKey);
  const pageRows = pagination.slice(enriched);

  async function onDownload(doc) {
    setBusyId(doc.id);
    try {
      await downloadDocumentoFile(doc);
    } finally {
      setBusyId(null);
    }
  }

  if (!empresaId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-slate-600">
          Primero escoge una empresa para ver sus documentos.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-brand hover:underline"
        >
          Escoger empresa
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0">
        <h1 className="hidden text-2xl font-semibold text-slate-900 md:block">
          Documentoteca
        </h1>
        <p className="text-sm text-slate-500 md:mt-0.5">
          {empresa?.nombre} · busca y descarga archivos del expediente
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre de archivo, empresa, objeto…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {TIPO_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        {loading && <LoadingBlock label="Cargando documentos…" />}
        {error && (
          <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && enriched.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200">
              <FolderOpen className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium text-slate-700">
              No hay documentos
            </p>
            <p className="max-w-sm text-xs text-slate-400">
              {query || tipo
                ? "Prueba otro término o quita el filtro de tipo."
                : "Cuando subas archivos en un proceso, aparecerán aquí."}
            </p>
          </div>
        ) : null}

        {!loading && !error && enriched.length > 0 ? (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              {/* Desktop table */}
              <table className="hidden w-full min-w-[40rem] text-left text-sm md:table">
                <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 text-[11px] uppercase tracking-wide text-slate-500 backdrop-blur">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Archivo</th>
                    <th className="px-3 py-2.5 font-medium">Tipo</th>
                    <th className="px-3 py-2.5 font-medium">Empresa</th>
                    <th className="px-3 py-2.5 font-medium">Proceso</th>
                    <th className="px-3 py-2.5 text-right font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map(({ doc, proceso, empresa }) => (
                    <tr
                      key={doc.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="max-w-[14rem] px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                            <FileText className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate font-medium text-slate-800">
                            {doc.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                        {TIPOS_DOCUMENTO[doc.tipo] ?? doc.tipo}
                      </td>
                      <td className="max-w-[9rem] truncate px-3 py-2.5 text-slate-600">
                        {empresa?.nombre ?? "—"}
                      </td>
                      <td className="max-w-[14rem] px-3 py-2.5">
                        {proceso ? (
                          <Link
                            href={`/procesos/${proceso.id}`}
                            className="block truncate text-brand hover:underline"
                            title={proceso.objeto}
                          >
                            {proceso.objeto}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {proceso?.entidadContratante ? (
                          <p className="truncate text-[11px] text-slate-400">
                            {proceso.entidadContratante}
                            {proceso.anio != null ? ` · ${proceso.anio}` : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <div className="inline-flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex rounded-md p-1.5 text-slate-500 hover:bg-brand-soft hover:text-brand"
                            aria-label="Vista previa"
                            title="Vista previa"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <DocumentoShareMenu doc={doc} />
                          <button
                            type="button"
                            onClick={() => onDownload(doc)}
                            disabled={busyId === doc.id}
                            className="inline-flex rounded-md p-1.5 text-slate-500 hover:bg-brand-soft hover:text-brand disabled:opacity-50"
                            aria-label="Descargar"
                            title="Descargar"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {pageRows.map(({ doc, proceso, empresa }) => (
                  <li key={doc.id} className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {doc.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {TIPOS_DOCUMENTO[doc.tipo] ?? doc.tipo}
                          {empresa ? ` · ${empresa.nombre}` : ""}
                        </p>
                        {proceso ? (
                          <Link
                            href={`/procesos/${proceso.id}`}
                            className="mt-0.5 block truncate text-xs text-brand"
                          >
                            {proceso.objeto}
                          </Link>
                        ) : null}
                        {proceso?.entidadContratante ? (
                          <p className="truncate text-[11px] text-slate-400">
                            {proceso.entidadContratante}
                            {proceso.anio != null ? ` · ${proceso.anio}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-brand-soft hover:text-brand"
                          aria-label="Vista previa"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <DocumentoShareMenu doc={doc} />
                        <button
                          type="button"
                          onClick={() => onDownload(doc)}
                          disabled={busyId === doc.id}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-brand-soft hover:text-brand disabled:opacity-50"
                          aria-label="Descargar"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <PaginationControls {...pagination} />
          </>
        ) : null}
      </section>

      <DocumentoPreview
        doc={previewDoc}
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
