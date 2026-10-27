"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Share2 } from "lucide-react";
import LoadingIcon from "@/components/ui/LoadingIcon";
import {
  canShareFiles,
  downloadDocumentoForShare,
  getCachedDocumentoFile,
  prefetchDocumentoFile,
  prepareDocumentoFile,
  shareDocumentoAsFile,
} from "@/lib/share-documento";

/**
 * Comparte cualquier archivo (PDF, Word, Excel, imágenes).
 * Precarga en pointerdown; si hace falta un 2º toque, el botón dice “Enviar ahora”.
 * Si el SO rechaza el tipo, descarga automáticamente.
 */
export default function DocumentoShareMenu({
  doc,
  className = "",
  iconOnly = true,
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [readyToSend, setReadyToSend] = useState(false);
  const [error, setError] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [fileShareOk, setFileShareOk] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setFileShareOk(canShareFiles());
  }, []);

  useEffect(() => {
    setReadyToSend(Boolean(doc && getCachedDocumentoFile(doc)));
  }, [doc]);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    function place() {
      const rect = btnRef.current.getBoundingClientRect();
      const menuW = 240;
      const left = Math.min(
        Math.max(8, rect.right - menuW),
        window.innerWidth - menuW - 8,
      );
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 200 && rect.top > spaceBelow;
      setMenuPos({
        left,
        top: openUp ? undefined : rect.bottom + 4,
        bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (
        btnRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function fallbackDownload() {
    const { error: dlError } = await downloadDocumentoForShare(doc);
    if (dlError) {
      setError(dlError);
      setOpen(true);
      return;
    }
    setOpen(false);
  }

  async function onShareFile() {
    if (!doc || busy) return;
    setBusy(true);
    setError(null);

    // Sin soporte nativo → descargar
    if (!fileShareOk) {
      await fallbackDownload();
      setBusy(false);
      return;
    }

    // Asegurar archivo en cache (Word/Excel suelen necesitar esto)
    if (!getCachedDocumentoFile(doc)) {
      const prepared = await prepareDocumentoFile(doc);
      if (prepared.error || !prepared.file) {
        setBusy(false);
        setError(prepared.error || "No se pudo preparar el archivo");
        setOpen(true);
        return;
      }
      setReadyToSend(true);
      setBusy(false);
      setOpen(true);
      return;
    }

    const result = await shareDocumentoAsFile(doc);
    setBusy(false);

    if (result.status === "shared" || result.status === "aborted") {
      setOpen(false);
      setReadyToSend(Boolean(getCachedDocumentoFile(doc)));
      return;
    }

    if (result.status === "ready") {
      setReadyToSend(true);
      setOpen(true);
      return;
    }

    // El SO no acepta este tipo (a veces Word) → descargar
    if (result.status === "unsupported") {
      await fallbackDownload();
      return;
    }

    setError(result.error || "No se pudo compartir");
    setOpen(true);
  }

  async function onDownloadOnly() {
    if (!doc || busy) return;
    setBusy(true);
    setError(null);
    await fallbackDownload();
    setBusy(false);
  }

  const label = readyToSend ? "Enviar ahora" : "Compartir";

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onPointerDown={() => {
          if (doc) prefetchDocumentoFile(doc);
        }}
        onClick={() => {
          setError(null);
          if (iconOnly) {
            onShareFile();
            return;
          }
          if (doc) prefetchDocumentoFile(doc);
          setOpen((v) => !v);
        }}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-lg p-2 text-slate-500 transition hover:bg-brand-soft hover:text-brand disabled:opacity-50"
        aria-label={label}
        aria-expanded={open}
        title={label}
      >
        {busy ? (
          <LoadingIcon className="h-4 w-4" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {!iconOnly ? (
          <span className="text-xs font-medium">{label}</span>
        ) : null}
      </button>

      {mounted &&
        open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[300] w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            style={{
              left: menuPos.left,
              top: menuPos.top,
              bottom: menuPos.bottom,
            }}
          >
            <p className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Enviar archivo
            </p>

            <button
              type="button"
              onPointerDown={() => {
                if (doc) prefetchDocumentoFile(doc);
              }}
              onClick={onShareFile}
              disabled={busy}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4 shrink-0 text-brand" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800">
                  {readyToSend ? "Enviar ahora" : "Preparar archivo"}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {readyToSend
                    ? "Abre WhatsApp, Gmail, etc."
                    : "Luego pulsa “Enviar ahora”"}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={onDownloadOnly}
              disabled={busy}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800">
                  Solo descargar
                </span>
                <span className="block text-[10px] text-slate-400">
                  Sin abrir el menú de compartir
                </span>
              </span>
            </button>

            {error && (
              <p className="border-t border-red-100 bg-red-50 px-3 py-1.5 text-[11px] text-red-600">
                {error}
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
