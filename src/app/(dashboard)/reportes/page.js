"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckSquare,
  ChevronDown,
  CircleCheck,
  Download,
  Eye,
  FileText,
  Loader2,
  Share2,
  Square,
} from "lucide-react";
import { useData } from "@/components/data/DataProvider";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import { LoadingBlock } from "@/components/ui/LoadingIcon";
import Modal from "@/components/ui/Modal";
import { ESTADOS_PROCESO } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import {
  downloadBlob,
  generateHojaVidaDocx,
} from "@/lib/generate-hoja-vida";
import { getHojaVidaMeta } from "@/lib/hoja-vida-meta";
import {
  canShareFiles,
  clearCachedFile,
  getCachedFile,
  putCachedFile,
  shareFileDirect,
} from "@/lib/share-documento";

function sortProcesos(list) {
  return [...list].sort((a, b) => {
    const ya = Number(a.anio) || 0;
    const yb = Number(b.anio) || 0;
    if (yb !== ya) return yb - ya;
    return String(a.objeto || "").localeCompare(String(b.objeto || ""), "es");
  });
}

export default function ReportesPage() {
  const { procesos, loading, error } = useData();
  const { empresa, empresaId, isTodas } = useEmpresa();
  const [busyFormat, setBusyFormat] = useState(null); // "docx" | "pdf" | "share-pdf" | null
  const [msg, setMsg] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [fileShareOk, setFileShareOk] = useState(false);
  const [pdfPrep, setPdfPrep] = useState("idle"); // idle | preparing | ready | error
  const [shareGateOpen, setShareGateOpen] = useState(false);
  const [shareGateFile, setShareGateFile] = useState(null);
  const downloadMenuRef = useRef(null);
  const pdfInflightRef = useRef(null);
  const pdfSelectionKeyRef = useRef("");
  const busy = Boolean(busyFormat);

  const slug = empresa?.slug ?? null;
  const hvMeta = getHojaVidaMeta(slug);
  const pdfShareCacheKey = `hv-pdf:${slug || "none"}`;

  useEffect(() => {
    setFileShareOk(canShareFiles());
  }, []);

  useEffect(() => {
    if (!downloadOpen) return;
    function onDocClick(e) {
      if (downloadMenuRef.current?.contains(e.target)) return;
      setDownloadOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setDownloadOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [downloadOpen]);

  const procesosEmpresa = useMemo(() => {
    if (!empresaId) return [];
    return sortProcesos(procesos.filter((p) => p.empresaId === empresaId));
  }, [procesos, empresaId]);

  // Al cambiar empresa o lista: seleccionar todos por defecto
  useEffect(() => {
    setSelectedIds(new Set(procesosEmpresa.map((p) => p.id)));
    setMsg(null);
    setPreviewOpen(false);
    clearCachedFile(pdfShareCacheKey);
    setDownloadOpen(false);
    setPdfPrep("idle");
    pdfInflightRef.current = null;
    pdfSelectionKeyRef.current = "";
    setShareGateOpen(false);
    setShareGateFile(null);
  }, [empresaId, procesosEmpresa, pdfShareCacheKey]);

  const selectedProcesos = useMemo(
    () => procesosEmpresa.filter((p) => selectedIds.has(p.id)),
    [procesosEmpresa, selectedIds],
  );

  const selectionKey = useMemo(
    () =>
      `${slug || ""}:${[...selectedIds].sort().join(",")}`,
    [slug, selectedIds],
  );

  const allSelected =
    procesosEmpresa.length > 0 &&
    selectedIds.size === procesosEmpresa.length;
  const noneSelected = selectedIds.size === 0;

  function toggleOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(procesosEmpresa.map((p) => p.id)));
  }

  function selectFinalizados() {
    setSelectedIds(
      new Set(
        procesosEmpresa.filter((p) => p.estado === "finalizado").map((p) => p.id),
      ),
    );
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const finalizadosCount = useMemo(
    () => procesosEmpresa.filter((p) => p.estado === "finalizado").length,
    [procesosEmpresa],
  );

  async function buildPdfFile(procesosForPdf = selectedProcesos) {
    const result = await generateHojaVidaDocx({
      slug,
      procesos: procesosForPdf,
    });
    if (result.error) return { error: result.error };

    const form = new FormData();
    form.append(
      "file",
      new File([result.blob], result.fileName, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    );

    const res = await fetch("/api/convert-docx-pdf", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      let detail = "No se pudo convertir el Word a PDF.";
      try {
        const data = await res.json();
        if (data?.error) detail = data.error;
      } catch {
        /* ignore */
      }
      return { error: detail };
    }

    const pdfBlob = await res.blob();
    const pdfName =
      hvMeta?.fileNamePdf || result.fileName.replace(/\.docx$/i, ".pdf");
    const file = new File([pdfBlob], pdfName, { type: "application/pdf" });
    return { file, pdfName };
  }

  /** Una sola generación en curso por selección; deja el PDF listo para 1 clic. */
  function ensurePdfReady(procesosForPdf = selectedProcesos) {
    const cached = getCachedFile(pdfShareCacheKey);
    if (cached && pdfSelectionKeyRef.current === selectionKey) {
      return Promise.resolve({ file: cached, pdfName: cached.name });
    }
    if (pdfInflightRef.current) return pdfInflightRef.current;

    setPdfPrep("preparing");
    const job = (async () => {
      const built = await buildPdfFile(procesosForPdf);
      if (built.error) {
        setPdfPrep("error");
        return built;
      }
      putCachedFile(pdfShareCacheKey, built.file);
      pdfSelectionKeyRef.current = selectionKey;
      setPdfPrep("ready");
      return built;
    })().finally(() => {
      pdfInflightRef.current = null;
    });

    pdfInflightRef.current = job;
    return job;
  }

  // Precarga el PDF en segundo plano para que Compartir sea de un solo toque
  useEffect(() => {
    if (!hvMeta || !slug || noneSelected || !fileShareOk) {
      clearCachedFile(pdfShareCacheKey);
      setPdfPrep("idle");
      pdfInflightRef.current = null;
      pdfSelectionKeyRef.current = "";
      return;
    }

    clearCachedFile(pdfShareCacheKey);
    pdfSelectionKeyRef.current = "";
    setPdfPrep("preparing");

    const procesosSnapshot = selectedProcesos;
    const keySnapshot = selectionKey;
    const t = setTimeout(() => {
      if (pdfSelectionKeyRef.current === keySnapshot && getCachedFile(pdfShareCacheKey)) {
        setPdfPrep("ready");
        return;
      }
      const job = (async () => {
        const built = await buildPdfFile(procesosSnapshot);
        if (built.error) {
          setPdfPrep("error");
          return built;
        }
        putCachedFile(pdfShareCacheKey, built.file);
        pdfSelectionKeyRef.current = keySnapshot;
        setPdfPrep("ready");
        return built;
      })().finally(() => {
        if (pdfInflightRef.current === job) pdfInflightRef.current = null;
      });
      pdfInflightRef.current = job;
    }, 600);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar selección
  }, [selectionKey, hvMeta, slug, noneSelected, fileShareOk, pdfShareCacheKey]);

  async function handleDescargar(format) {
    if (!slug || busy || noneSelected) return;
    setDownloadOpen(false);
    setBusyFormat(format);
    setMsg(null);
    try {
      if (format === "docx") {
        const result = await generateHojaVidaDocx({
          slug,
          procesos: selectedProcesos,
        });
        if (result.error) {
          setMsg(result.error);
          return;
        }
        downloadBlob(result.blob, result.fileName);
        setMsg(
          `Descargado: ${result.fileName} (${selectedProcesos.length} proceso${selectedProcesos.length === 1 ? "" : "s"}).`,
        );
        return;
      }

      const built = await ensurePdfReady();
      if (built.error) {
        setMsg(built.error);
        return;
      }
      downloadBlob(built.file, built.pdfName);
      setMsg(
        `Descargado: ${built.pdfName} (convertido desde Word · ${selectedProcesos.length} proceso${selectedProcesos.length === 1 ? "" : "s"}).`,
      );
    } catch (err) {
      setMsg(err?.message || "No se pudo generar el documento.");
    } finally {
      setBusyFormat(null);
    }
  }

  async function finishShare(file) {
    if (!fileShareOk) {
      downloadBlob(file, file.name);
      setMsg(`Este navegador no comparte archivos: se descargó ${file.name}.`);
      setShareGateOpen(false);
      setShareGateFile(null);
      return;
    }
    const result = await shareFileDirect(file, file.name);
    if (result.status === "shared") {
      setMsg(`Compartido: ${file.name}`);
      setShareGateOpen(false);
      setShareGateFile(null);
      return;
    }
    if (result.status === "aborted") {
      setShareGateOpen(false);
      setShareGateFile(null);
      return;
    }
    if (result.status === "unsupported") {
      downloadBlob(file, file.name);
      setMsg(result.error || `Descargado: ${file.name}`);
      setShareGateOpen(false);
      setShareGateFile(null);
      return;
    }
    // Gesto perdido: el modal ya está abierto → un toque en Enviar (mismo flujo)
    setShareGateFile(file);
    setShareGateOpen(true);
  }

  async function handleCompartirPdf() {
    if (!slug || busy || noneSelected) return;
    setDownloadOpen(false);
    setBusyFormat("share-pdf");
    setMsg(null);

    // Si ya está listo → compartir en este mismo clic
    const cached = getCachedFile(pdfShareCacheKey);
    if (cached && pdfSelectionKeyRef.current === selectionKey) {
      try {
        await finishShare(cached);
      } finally {
        setBusyFormat(null);
      }
      return;
    }

    // Aún no: generar y abrir menú automáticamente al terminar
    setShareGateOpen(true);
    setShareGateFile(null);
    try {
      const built = await ensurePdfReady();
      if (built.error) {
        setMsg(built.error);
        setShareGateOpen(false);
        return;
      }
      // Intento automático (funciona en varios móviles)
      const result = await shareFileDirect(built.file, built.file.name);
      if (result.status === "shared") {
        setMsg(`Compartido: ${built.file.name}`);
        setShareGateOpen(false);
        setShareGateFile(null);
        return;
      }
      if (result.status === "aborted") {
        setShareGateOpen(false);
        setShareGateFile(null);
        return;
      }
      if (result.status === "unsupported" || !fileShareOk) {
        downloadBlob(built.file, built.file.name);
        setMsg(
          result.error ||
            `Este navegador no comparte archivos: se descargó ${built.file.name}.`,
        );
        setShareGateOpen(false);
        setShareGateFile(null);
        return;
      }
      // Dejar el modal listo: al pulsar Enviar ya es el gesto válido
      setShareGateFile(built.file);
    } catch (err) {
      setMsg(err?.message || "No se pudo compartir el PDF.");
      setShareGateOpen(false);
      setShareGateFile(null);
    } finally {
      setBusyFormat(null);
    }
  }

  async function handleShareGateSend() {
    if (!shareGateFile || busy) return;
    setBusyFormat("share-pdf");
    try {
      await finishShare(shareGateFile);
    } finally {
      setBusyFormat(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <LoadingBlock label="Cargando reportes…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto">
      <header className="shrink-0">
        <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Reportes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Elige los procesos a incluir, previsualiza y descarga el documento.
        </p>
      </header>

      {isTodas || !empresa ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Selecciona una empresa para ver sus reportes.
        </div>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--brand)_12%,white)] text-[var(--brand)]">
                  <FileText className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Hoja de vida empresarial
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {empresa.nombre}
                    {hvMeta
                      ? ` · ${selectedProcesos.length} de ${procesosEmpresa.length} proceso${procesosEmpresa.length === 1 ? "" : "s"}`
                      : " · plantilla no configurada"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!hvMeta || noneSelected}
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eye className="h-4 w-4" aria-hidden />
                  Previsualizar
                </button>

                <div className="relative" ref={downloadMenuRef}>
                  <button
                    type="button"
                    disabled={!hvMeta || busy || noneSelected}
                    onClick={() => setDownloadOpen((v) => !v)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3.5 py-2 text-sm font-medium text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-expanded={downloadOpen}
                    aria-haspopup="menu"
                  >
                    {busyFormat === "docx" || busyFormat === "pdf" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden />
                    )}
                    {busyFormat === "docx" || busyFormat === "pdf"
                      ? "Generando…"
                      : "Descargar"}
                    <ChevronDown className="h-3.5 w-3.5 opacity-80" aria-hidden />
                  </button>
                  {downloadOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        disabled={busy}
                        onClick={() => handleDescargar("docx")}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <FileText className="h-4 w-4 text-slate-500" aria-hidden />
                        Word (.docx)
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={busy}
                        onClick={() => handleDescargar("pdf")}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <FileText className="h-4 w-4 text-slate-500" aria-hidden />
                        PDF
                      </button>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={!hvMeta || busy || noneSelected}
                  onClick={handleCompartirPdf}
                  onPointerDown={() => {
                    if (hvMeta && !noneSelected) void ensurePdfReady();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Un toque: espera el PDF y abre compartir"
                >
                  {busyFormat === "share-pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Share2 className="h-4 w-4" aria-hidden />
                  )}
                  {busyFormat === "share-pdf" ? "Compartiendo…" : "Compartir"}
                </button>
              </div>
            </div>
          </div>

          {hvMeta ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5 sm:px-5">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={allSelected || procesosEmpresa.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <CheckSquare className="h-3.5 w-3.5" aria-hidden />
                  Todos
                </button>
                <button
                  type="button"
                  onClick={selectFinalizados}
                  disabled={finalizadosCount === 0}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                  Solo finalizados
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={noneSelected}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden />
                  Ninguno
                </button>
                <span className="text-xs text-slate-400">
                  Marca los procesos que irán en EXPERIENCIA
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                {procesosEmpresa.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-500">
                    No hay procesos para esta empresa.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {procesosEmpresa.map((p) => {
                      const checked = selectedIds.has(p.id);
                      return (
                        <li key={p.id}>
                          <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-[var(--brand)]"
                              checked={checked}
                              onChange={() => toggleOne(p.id)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-slate-900">
                                {p.objeto}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {p.entidadContratante}
                                {" · "}
                                {formatMoney(p.monto ?? 0)}
                                {" · "}
                                {ESTADOS_PROCESO[p.estado] ?? p.estado}
                                {" · "}
                                {p.anio ?? "—"}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="p-6 text-sm text-amber-700">
              Aún no hay plantilla de hoja de vida para esta empresa. Por ahora
              solo Multinuclear.
            </p>
          )}

          {msg ? (
            <p
              className={`shrink-0 border-t border-slate-100 px-4 py-3 text-xs sm:px-5 ${
                msg.startsWith("Descargado") || msg.startsWith("Compartido")
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
              role="status"
            >
              {msg}
            </p>
          ) : null}
          {hvMeta && fileShareOk && !noneSelected && pdfPrep === "ready" ? (
            <p className="shrink-0 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400 sm:px-5">
              PDF listo: un toque en Compartir abre el menú al instante.
            </p>
          ) : null}
        </section>
      )}

      <Modal
        open={shareGateOpen}
        onClose={() => {
          if (busyFormat === "share-pdf" && !shareGateFile) return;
          setShareGateOpen(false);
          setShareGateFile(null);
        }}
        title="Compartir PDF"
      >
        {!shareGateFile ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
            <p className="text-sm text-slate-600">
              Generando el PDF… en cuanto esté listo se abrirá compartir.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-slate-600">
              PDF listo. Confirma para abrir WhatsApp, Gmail u otra app.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={handleShareGateSend}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-3 text-sm font-medium text-white transition enabled:hover:opacity-90 disabled:opacity-50"
            >
              {busyFormat === "share-pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Share2 className="h-4 w-4" aria-hidden />
              )}
              Enviar ahora
            </button>
          </div>
        )}
      </Modal>

      {hvMeta && previewOpen ? (
        <Modal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title="Vista previa — Hoja de vida empresarial"
          full
          flush
        >
          <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4 sm:p-6">
            <article
              className="relative mx-auto max-w-3xl overflow-hidden bg-white pb-10 text-black shadow-sm"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              {(hvMeta.headerLeft || hvMeta.headerRight) && (
                <div className="relative mb-8 flex min-h-[4.5rem] items-start justify-between">
                  {hvMeta.headerLeft ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hvMeta.headerLeft}
                      alt=""
                      className="relative z-10 ml-2 mt-3 h-12 w-auto max-w-[45%] object-contain object-left sm:ml-3 sm:h-14"
                    />
                  ) : (
                    <span />
                  )}
                  {hvMeta.headerRight ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hvMeta.headerRight}
                      alt=""
                      className="absolute top-0 right-0 h-16 w-auto max-w-[48%] object-contain object-right sm:h-20"
                    />
                  ) : null}
                </div>
              )}
              <div className="px-8 sm:px-12">
              <h1 className="mb-8 text-center text-xl font-bold tracking-wide uppercase">
                {hvMeta.titulo}
              </h1>
              <p className="text-[9pt] leading-relaxed">
                <strong>RAZÓN SOCIAL:</strong> {hvMeta.razonSocial}
              </p>
              <p className="text-[9pt] leading-relaxed">
                <strong>REPRESENTANTE LEGAL:</strong>{" "}
                {hvMeta.representanteLegal}
              </p>
              <p className="mb-6 text-[9pt] leading-relaxed">
                <strong>RUC:</strong> {hvMeta.ruc}
              </p>

              <h2 className="mb-2 border-b border-black pb-1 text-[11pt] font-bold uppercase">
                Servicios
              </h2>
              <ul className="mb-6 list-disc space-y-1 pl-5 text-[9pt]">
                {hvMeta.servicios.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>

              <h2 className="mb-3 border-b border-black pb-1 text-[11pt] font-bold uppercase">
                Experiencia
              </h2>
              {selectedProcesos.length === 0 ? (
                <p className="text-[9pt] italic text-slate-600">
                  Sin procesos seleccionados.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[9pt]">
                    <thead>
                      <tr className="bg-neutral-200">
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold">
                          Objeto de contratación
                        </th>
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold">
                          Entidad contratante
                        </th>
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold">
                          Monto
                        </th>
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold">
                          Estado
                        </th>
                        <th className="border border-black px-2 py-2 text-center align-middle font-bold">
                          Año
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProcesos.map((p) => (
                        <tr key={p.id}>
                          <td className="border border-black px-2 py-2 text-center align-middle">
                            {p.objeto}
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-middle">
                            {p.entidadContratante}
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-middle whitespace-nowrap">
                            {formatMoney(p.monto ?? 0)}
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-middle">
                            {ESTADOS_PROCESO[p.estado] ?? p.estado}
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-middle">
                            {p.anio ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            </article>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
