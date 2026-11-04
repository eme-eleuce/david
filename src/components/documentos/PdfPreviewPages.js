"use client";

import { useEffect, useRef, useState } from "react";
import LoadingIcon from "@/components/ui/LoadingIcon";

/**
 * Renderiza un PDF página a página (canvas) — funciona en iOS/Android
 * donde el iframe/embed nativo falla o no hace scroll.
 */
export default function PdfPreviewPages({ url, title = "PDF" }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const canvases = [];

    async function render() {
      setLoading(true);
      setError(null);
      setPageCount(0);

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const res = await fetch(url);
        if (!res.ok) throw new Error("No se pudo descargar el PDF.");
        const data = new Uint8Array(await res.arrayBuffer());
        if (cancelled) return;

        const pdf = await pdfjs.getDocument({ data }).promise;
        if (cancelled) {
          pdf.destroy();
          return;
        }

        setPageCount(pdf.numPages);
        const host = containerRef.current;
        if (!host) {
          pdf.destroy();
          return;
        }
        host.innerHTML = "";

        const maxWidth = Math.min(host.clientWidth || 360, 900);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) break;
          const page = await pdf.getPage(pageNum);
          const unscaled = page.getViewport({ scale: 1 });
          const scale = maxWidth / unscaled.width;
          const viewport = page.getViewport({
            scale: Math.min(Math.max(scale, 1), 2.5),
          });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className =
            "mb-3 w-full max-w-full rounded-lg bg-white shadow-sm ring-1 ring-slate-200";
          canvas.setAttribute("aria-label", `${title} — página ${pageNum}`);

          const ctx = canvas.getContext("2d", { alpha: false });
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) break;

          host.appendChild(canvas);
          canvases.push(canvas);
        }

        pdf.destroy();
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "No se pudo mostrar el PDF.");
        setLoading(false);
      }
    }

    render();

    return () => {
      cancelled = true;
      canvases.length = 0;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [url, title]);

  return (
    <div className="p-3 sm:p-4">
      {loading ? (
        <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
          <LoadingIcon className="h-8 w-8" />
          Cargando PDF…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={loading || error ? "hidden" : "mx-auto max-w-3xl"}
      />

      {!loading && !error && pageCount > 0 ? (
        <p className="mt-2 text-center text-[11px] text-slate-400">
          {pageCount} página{pageCount === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}
