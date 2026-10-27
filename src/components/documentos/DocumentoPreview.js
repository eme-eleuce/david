"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  ExternalLink,
  FileText,
  FileWarning,
  X,
} from "lucide-react";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import DocumentoShareMenu from "@/components/documentos/DocumentoShareMenu";
import LoadingIcon from "@/components/ui/LoadingIcon";
import { downloadDocumentoFile, getDocumentoSignedUrl } from "@/lib/crud";
import { TIPOS_DOCUMENTO } from "@/lib/constants";

function getPreviewKind(nombre = "") {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(ext)) {
    return "image";
  }
  if (ext === "docx") return "docx";
  if (ext === "doc") return "doc_legacy";
  if (["xlsx", "xls", "csv"].includes(ext)) return "spreadsheet";
  return "other";
}

async function resolveUrl(doc) {
  if (doc.storagePath) {
    const signed = await getDocumentoSignedUrl(doc.storagePath);
    if (signed) return signed;
  }
  return doc.url ?? null;
}

async function fetchArrayBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo descargar el archivo para previsualizar.");
  return res.arrayBuffer();
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return mobile;
}

export default function DocumentoPreview({ doc, open, onClose }) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [officeHtml, setOfficeHtml] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState(null);
  const [workbook, setWorkbook] = useState(null);

  const kind = useMemo(
    () => (doc ? getPreviewKind(doc.nombre) : "other"),
    [doc],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !doc) {
      setUrl(null);
      setError(null);
      setOfficeHtml(null);
      setSheetNames([]);
      setActiveSheet(null);
      setWorkbook(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setUrl(null);
      setOfficeHtml(null);
      setSheetNames([]);
      setActiveSheet(null);
      setWorkbook(null);

      try {
        const resolved = await resolveUrl(doc);
        if (cancelled) return;
        if (!resolved) {
          setError("No se pudo obtener el archivo para previsualizar.");
          setLoading(false);
          return;
        }
        setUrl(resolved);

        const previewKind = getPreviewKind(doc.nombre);

        if (previewKind === "docx") {
          const buffer = await fetchArrayBuffer(resolved);
          if (cancelled) return;
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          if (cancelled) return;
          setOfficeHtml(result.value || "<p>(Documento vacío)</p>");
        } else if (previewKind === "spreadsheet") {
          const buffer = await fetchArrayBuffer(resolved);
          if (cancelled) return;
          const wb = XLSX.read(buffer, { type: "array" });
          if (cancelled) return;
          const names = wb.SheetNames?.length ? wb.SheetNames : ["Hoja1"];
          setWorkbook(wb);
          setSheetNames(names);
          setActiveSheet(names[0]);
          const sheet = wb.Sheets[names[0]];
          setOfficeHtml(
            sheet
              ? XLSX.utils.sheet_to_html(sheet, { editable: false })
              : "<p>(Hoja vacía)</p>",
          );
        } else if (previewKind === "doc_legacy") {
          setError(
            "Los archivos .doc antiguos no se pueden previsualizar. Convierte a .docx o descarga el archivo.",
          );
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Error al cargar la vista previa.");
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [open, doc]);

  useEffect(() => {
    if (!workbook || !activeSheet) return;
    const sheet = workbook.Sheets[activeSheet];
    if (!sheet) return;
    setOfficeHtml(XLSX.utils.sheet_to_html(sheet, { editable: false }));
  }, [workbook, activeSheet]);

  async function onDownloadClick() {
    if (!doc) return;
    setDownloading(true);
    await downloadDocumentoFile(doc);
    setDownloading(false);
  }

  if (!mounted || !open || !doc) return null;

  const tipoLabel = TIPOS_DOCUMENTO[doc.tipo] ?? doc.tipo;
  const showOffice = kind === "docx" || kind === "spreadsheet";
  /** En móvil el PDF embebido no scrollea; usamos el visor nativo */
  const pdfNativeOnly = kind === "pdf" && isMobile;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/50 sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 hidden sm:block"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={doc.nombre}
        className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[90dvh] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-xl"
      >
        {/* Cabecera */}
        <div className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-3 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {tipoLabel}
            </p>
            <h2 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 sm:truncate sm:text-base">
              {doc.nombre}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Acciones */}
        {url && !loading && (
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-2.5 sm:px-5">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-none"
            >
              <ExternalLink className="h-4 w-4" />
              {pdfNativeOnly ? "Ver PDF" : "Abrir"}
            </a>
            <DocumentoShareMenu
              doc={doc}
              iconOnly={false}
              className="[&_button]:rounded-xl [&_button]:border [&_button]:border-slate-200 [&_button]:bg-white [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-sm [&_button]:font-medium [&_button]:text-slate-700"
            />
            <button
              type="button"
              onClick={onDownloadClick}
              disabled={downloading}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60 sm:flex-none"
            >
              <Download className="h-4 w-4" />
              {downloading ? "…" : "Descargar"}
            </button>
          </div>
        )}

        {kind === "spreadsheet" && sheetNames.length > 1 && !loading && !error && (
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2 sm:px-5">
            {sheetNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveSheet(name)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeSheet === name
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Único contenedor con scroll táctil */}
        <div
          className="preview-scroll min-h-0 flex-1 overflow-y-auto overflow-x-auto bg-slate-100"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y pan-x" }}
        >
          {loading && (
            <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
              <LoadingIcon className="h-8 w-8" />
              Cargando vista previa…
            </div>
          )}

          {!loading && error && (
            <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-600">
              <FileWarning className="h-10 w-10 text-amber-500" />
              <p>{error}</p>
              <button
                type="button"
                onClick={onDownloadClick}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloading ? "Descargando…" : "Descargar archivo"}
              </button>
            </div>
          )}

          {!loading && !error && url && pdfNativeOnly && (
            <div className="flex min-h-full flex-col items-center justify-center gap-5 px-6 py-10 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-slate-200">
                <FileText className="h-10 w-10" />
              </span>
              <div className="max-w-sm space-y-1.5">
                <p className="text-base font-semibold text-slate-900">
                  Vista previa de PDF
                </p>
                <p className="text-sm leading-relaxed text-slate-500">
                  En el móvil el PDF se abre en el visor del navegador para que
                  puedas desplazarte con normalidad.
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir PDF
              </a>
              <button
                type="button"
                onClick={onDownloadClick}
                disabled={downloading}
                className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline disabled:opacity-60"
              >
                {downloading ? "Descargando…" : "Descargar en su lugar"}
              </button>
            </div>
          )}

          {!loading && !error && url && kind === "pdf" && !isMobile && (
            <iframe
              title={doc.nombre}
              src={`${url}#view=FitH`}
              className="block h-[min(80dvh,900px)] w-full border-0 bg-white"
            />
          )}

          {!loading && !error && url && kind === "image" && (
            <div className="flex justify-center p-3 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={doc.nombre}
                className="h-auto w-full max-w-full rounded-lg bg-white object-contain shadow-sm sm:max-h-none sm:w-auto sm:max-w-full"
                draggable={false}
              />
            </div>
          )}

          {!loading && !error && showOffice && officeHtml && (
            <div className="bg-white p-4 sm:p-8">
              <div
                className="office-preview mx-auto max-w-3xl text-[15px] leading-relaxed text-slate-800"
                dangerouslySetInnerHTML={{ __html: officeHtml }}
              />
            </div>
          )}

          {!loading && !error && url && kind === "other" && (
            <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center">
              <FileWarning className="h-10 w-10 text-slate-400" />
              <p className="text-sm text-slate-600">
                Este tipo de archivo no se puede previsualizar aquí.
              </p>
              <button
                type="button"
                onClick={onDownloadClick}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloading ? "Descargando…" : "Descargar archivo"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
