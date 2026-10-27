import {
  getDocumentoSignedUrl,
  SIGNED_URL_TTL_SHORT,
} from "@/lib/crud";

const MIME_BY_EXT = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  txt: "text/plain",
};

/** Cache en memoria: el share debe llamarse en el mismo gesto del click. */
const fileCache = new Map();
const inflight = new Map();

export function mimeForDocumento(nombre = "", fallback = "") {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? "";
  if (MIME_BY_EXT[ext]) return MIME_BY_EXT[ext];
  if (
    fallback &&
    fallback !== "application/octet-stream" &&
    fallback !== "application/zip" &&
    fallback !== "application/x-zip-compressed"
  ) {
    return fallback;
  }
  return fallback || "application/octet-stream";
}

/** Word/Excel: el share nativo falla a menudo → solo descarga. */
export function isDownloadOnlyShare(doc) {
  const ext = (doc?.nombre || "").split(".").pop()?.toLowerCase() ?? "";
  return ["doc", "docx", "xls", "xlsx"].includes(ext);
}

/** PDF e imágenes sí pueden ir por el menú Compartir del sistema. */
export function supportsNativeFileShare(doc) {
  return canShareFiles() && !isDownloadOnlyShare(doc);
}

function cacheKey(doc) {
  return String(doc?.id ?? doc?.storagePath ?? doc?.nombre ?? "");
}

export function getCachedDocumentoFile(doc) {
  return fileCache.get(cacheKey(doc)) ?? null;
}

/**
 * Baja el archivo a memoria (Blob → File) y lo cachea.
 */
export async function prepareDocumentoFile(doc) {
  const key = cacheKey(doc);
  if (fileCache.has(key)) {
    return { file: fileCache.get(key), error: null };
  }
  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const job = (async () => {
    let url = null;
    if (doc.storagePath) {
      url = await getDocumentoSignedUrl(doc.storagePath, {
        expiresIn: SIGNED_URL_TTL_SHORT,
      });
    }
    if (!url) url = doc.url ?? null;
    if (!url) {
      return { file: null, error: "No se pudo obtener el archivo" };
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo descargar el archivo");
      const blob = await res.blob();
      const type = mimeForDocumento(doc.nombre, blob.type);
      const file = new File([blob], doc.nombre || "documento", { type });
      fileCache.set(key, file);
      return { file, error: null };
    } catch (err) {
      return {
        file: null,
        error: err?.message || "Error al preparar el archivo",
      };
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, job);
  return job;
}

/** Precarga en pointerdown / al abrir menú (antes del share). */
export function prefetchDocumentoFile(doc) {
  if (!doc) return;
  void prepareDocumentoFile(doc);
}

export function canShareFiles() {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    const probe = new File(["x"], "probe.txt", { type: "text/plain" });
    return Boolean(navigator.canShare?.({ files: [probe] }));
  } catch {
    return false;
  }
}

function isGestureError(err) {
  const msg = String(err?.message || err || "");
  return (
    err?.name === "NotAllowedError" ||
    /user gesture|user activation|not allowed/i.test(msg)
  );
}

/**
 * Comparte el archivo. Si aún no está en cache, lo prepara y pide un 2º toque
 * (Chrome exige share() dentro del gesto del usuario; el fetch lo rompe).
 *
 * @returns {{ status: 'shared'|'aborted'|'unsupported'|'error'|'ready', error?: string, hint?: string }}
 */
export async function shareDocumentoAsFile(doc) {
  if (!canShareFiles()) {
    return {
      status: "unsupported",
      error:
        "Este navegador no permite enviar el archivo directo. Usa “Descargar para enviar”.",
    };
  }

  let file = getCachedDocumentoFile(doc);
  if (!file) {
    const prepared = await prepareDocumentoFile(doc);
    if (prepared.error || !prepared.file) {
      return {
        status: "error",
        error: prepared.error || "No se pudo preparar el archivo",
      };
    }
    // Tras el await el gesto ya no vale: pedir un segundo toque
    return {
      status: "ready",
      hint: "Archivo listo. Pulsa Compartir otra vez para enviarlo.",
    };
  }

  if (navigator.canShare && !navigator.canShare({ files: [file] })) {
    return {
      status: "unsupported",
      error:
        "Este dispositivo no puede adjuntar este tipo de archivo. Usa “Descargar para enviar”.",
    };
  }

  try {
    await navigator.share({ files: [file] });
    return { status: "shared" };
  } catch (err) {
    if (err?.name === "AbortError") return { status: "aborted" };

    if (isGestureError(err)) {
      return {
        status: "ready",
        hint: "Archivo listo. Pulsa Compartir otra vez para enviarlo.",
      };
    }

    try {
      await navigator.share({
        files: [file],
        title: doc.nombre || "Documento",
      });
      return { status: "shared" };
    } catch (err2) {
      if (err2?.name === "AbortError") return { status: "aborted" };
      if (isGestureError(err2)) {
        return {
          status: "ready",
          hint: "Archivo listo. Pulsa Compartir otra vez para enviarlo.",
        };
      }
      return {
        status: "error",
        error:
          err2?.message ||
          err?.message ||
          "No se pudo abrir el menú de compartir",
      };
    }
  }
}

export async function downloadDocumentoForShare(doc) {
  const { file, error } = await prepareDocumentoFile(doc);
  if (error || !file) return { error: error || "No se pudo descargar" };

  const objectUrl = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = file.name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
  return { error: null };
}

/** Guarda un File generado (p. ej. PDF de reportes) en el cache de share. */
export function putCachedFile(key, file) {
  if (!key || !file) return;
  fileCache.set(String(key), file);
}

export function getCachedFile(key) {
  return fileCache.get(String(key)) ?? null;
}

export function clearCachedFile(key) {
  fileCache.delete(String(key));
}

function isShareGestureError(err) {
  const msg = String(err?.message || err || "");
  return (
    err?.name === "NotAllowedError" ||
    /user gesture|user activation|not allowed/i.test(msg)
  );
}

/**
 * Comparte un File ya en memoria (idealmente en el mismo gesto del click).
 * @returns {{ status: 'shared'|'aborted'|'unsupported'|'needs_gesture'|'error', error?: string }}
 */
export async function shareFileDirect(file, title = "") {
  if (!file) {
    return { status: "error", error: "No hay archivo para compartir" };
  }
  if (!canShareFiles()) {
    return {
      status: "unsupported",
      error:
        "Este navegador no permite enviar el archivo directo. Descárgalo y envíalo a mano.",
    };
  }
  if (navigator.canShare && !navigator.canShare({ files: [file] })) {
    return {
      status: "unsupported",
      error:
        "Este dispositivo no puede adjuntar este tipo de archivo. Descárgalo y envíalo a mano.",
    };
  }

  try {
    await navigator.share({
      files: [file],
      title: title || file.name || "Documento",
    });
    return { status: "shared" };
  } catch (err) {
    if (err?.name === "AbortError") return { status: "aborted" };
    if (isShareGestureError(err)) {
      return {
        status: "needs_gesture",
        error: "El navegador pide un toque más para abrir compartir.",
      };
    }
    return {
      status: "error",
      error: err?.message || "No se pudo abrir el menú de compartir",
    };
  }
}
