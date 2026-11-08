"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import LoadingIcon from "@/components/ui/LoadingIcon";
import {
  canShareFiles,
  downloadDocumentoForShare,
  getCachedDocumentoFile,
  prefetchDocumentoFile,
  shareDocumentoAsFile,
} from "@/lib/share-documento";

/**
 * Un clic: prepara el archivo (si hace falta) y abre compartir,
 * manteniendo el loading hasta terminar.
 */
export default function DocumentoShareMenu({
  doc,
  className = "",
  iconOnly = true,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fileShareOk, setFileShareOk] = useState(false);

  useEffect(() => {
    setFileShareOk(canShareFiles());
  }, []);

  useEffect(() => {
    setError(null);
    if (doc) prefetchDocumentoFile(doc);
  }, [doc]);

  async function onShareFile() {
    if (!doc || busy) return;
    setBusy(true);
    setError(null);

    if (!fileShareOk) {
      const { error: dlError } = await downloadDocumentoForShare(doc);
      if (dlError) setError(dlError);
      setBusy(false);
      return;
    }

    // Prefetch en paralelo por si el pointerdown no alcanzó a terminar
    prefetchDocumentoFile(doc);

    const result = await shareDocumentoAsFile(doc);

    if (result.status === "shared" || result.status === "aborted") {
      setBusy(false);
      return;
    }

    if (result.status === "ready") {
      // Último recurso: archivo ya en cache → un toque más suele bastar
      const cached = getCachedDocumentoFile(doc);
      if (cached) {
        const retry = await shareDocumentoAsFile(doc);
        if (retry.status === "shared" || retry.status === "aborted") {
          setBusy(false);
          return;
        }
        if (retry.status === "unsupported") {
          const { error: dlError } = await downloadDocumentoForShare(doc);
          if (dlError) setError(dlError);
          setBusy(false);
          return;
        }
      }
      setError(
        result.hint ||
          "El archivo está listo. Vuelve a tocar Compartir para enviarlo.",
      );
      setBusy(false);
      return;
    }

    if (result.status === "unsupported") {
      const { error: dlError } = await downloadDocumentoForShare(doc);
      if (dlError) setError(dlError);
      setBusy(false);
      return;
    }

    setError(result.error || "No se pudo compartir");
    setBusy(false);
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onPointerDown={() => {
          if (doc) prefetchDocumentoFile(doc);
        }}
        onClick={onShareFile}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg p-2 text-slate-500 transition hover:bg-brand-soft hover:text-brand disabled:opacity-50"
        aria-label={busy ? "Compartiendo…" : "Compartir"}
        title={error || (busy ? "Compartiendo…" : "Compartir")}
      >
        {busy ? (
          <LoadingIcon className="h-4 w-4" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {!iconOnly ? (
          <span className="text-sm font-medium">
            {busy ? "Compartiendo…" : "Compartir"}
          </span>
        ) : null}
      </button>
    </div>
  );
}
