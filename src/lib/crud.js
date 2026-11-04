import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";

/** Días en papelera antes del borrado definitivo (purge). */
export const PAPELERA_RETENTION_DAYS = 90;

function client() {
  return createClient();
}

function nowIso() {
  return new Date().toISOString();
}

export async function createEmpresa({ nombre, activa = true }) {
  const slugBase = slugify(nombre) || `empresa-${Date.now()}`;
  const supabase = client();

  let slug = slugBase;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("empresas")
      .insert({ nombre, slug, activa })
      .select("*")
      .single();

    if (!error) return { data, error: null };
    if (error.code === "23505") {
      slug = `${slugBase}-${i + 2}`;
      continue;
    }
    return { data: null, error };
  }
  return { data: null, error: { message: "No se pudo generar un slug único" } };
}

export async function updateEmpresa(id, { nombre, activa }) {
  const supabase = client();
  const payload = {};
  if (nombre != null) payload.nombre = nombre;
  if (activa != null) payload.activa = activa;

  return supabase.from("empresas").update(payload).eq("id", id).select("*").single();
}

export async function createProceso(fields) {
  const supabase = client();
  return supabase
    .from("procesos")
    .insert({
      empresa_id: Number(fields.empresaId),
      objeto: fields.objeto,
      entidad_contratante: fields.entidadContratante,
      monto: Math.round(Number(fields.monto) || 0),
      anio: Number(fields.anio),
      tipo_proceso: fields.tipoProceso,
      estado: fields.estado,
    })
    .select("*")
    .single();
}

export async function updateProceso(id, fields) {
  const supabase = client();
  const payload = {};
  if (fields.empresaId != null) payload.empresa_id = Number(fields.empresaId);
  if (fields.objeto != null) payload.objeto = fields.objeto;
  if (fields.entidadContratante != null) {
    payload.entidad_contratante = fields.entidadContratante;
  }
  if (fields.monto != null) {
    payload.monto = Math.round(Number(fields.monto) || 0);
  }
  if (fields.anio != null) payload.anio = Number(fields.anio);
  if (fields.tipoProceso != null) payload.tipo_proceso = fields.tipoProceso;
  if (fields.estado != null) payload.estado = fields.estado;

  return supabase
    .from("procesos")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
}

/** Mueve el proceso (y sus documentos activos) a la papelera. */
export async function deleteProceso(id) {
  const supabase = client();
  const deletedAt = nowIso();
  const procesoId = Number(id);

  const { error: docsError } = await supabase
    .from("documentos")
    .update({ deleted_at: deletedAt })
    .eq("proceso_id", procesoId)
    .is("deleted_at", null);

  if (docsError) return { data: null, error: docsError };

  return supabase
    .from("procesos")
    .update({ deleted_at: deletedAt })
    .eq("id", procesoId)
    .select("*")
    .single();
}

/** Restaura un proceso y todos sus documentos desde la papelera. */
export async function restoreProceso(id) {
  const supabase = client();
  const procesoId = Number(id);

  const { error: procError } = await supabase
    .from("procesos")
    .update({ deleted_at: null })
    .eq("id", procesoId);

  if (procError) return { error: procError };

  const { error: docsError } = await supabase
    .from("documentos")
    .update({ deleted_at: null })
    .eq("proceso_id", procesoId);

  return { error: docsError };
}

/** Borra definitivamente un proceso y sus archivos en Storage. */
export async function purgeProceso(id) {
  const supabase = client();
  const procesoId = Number(id);

  const { data: docs } = await supabase
    .from("documentos")
    .select("storage_path")
    .eq("proceso_id", procesoId);

  const paths = (docs ?? [])
    .map((d) => d.storage_path)
    .filter(Boolean);

  if (paths.length) {
    await supabase.storage.from("documentos").remove(paths);
  }

  return supabase.from("procesos").delete().eq("id", procesoId);
}

export async function uploadDocumento({ procesoId, tipo, file }) {
  const supabase = client();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `${procesoId}/${tipo}/${unique}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(storagePath, file, { upsert: false });

  if (uploadError) return { data: null, error: uploadError };

  const { data, error } = await supabase
    .from("documentos")
    .insert({
      proceso_id: Number(procesoId),
      tipo,
      nombre: file.name,
      storage_path: storagePath,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from("documentos").remove([storagePath]);
    return { data: null, error };
  }

  return { data, error: null };
}

/** Mueve un documento de proceso a la papelera (no borra Storage aún). */
export async function deleteDocumento(doc) {
  const supabase = client();
  return supabase
    .from("documentos")
    .update({ deleted_at: nowIso() })
    .eq("id", doc.id)
    .select("*")
    .single();
}

export async function restoreDocumento(id) {
  const supabase = client();
  return supabase
    .from("documentos")
    .update({ deleted_at: null })
    .eq("id", id)
    .select("*")
    .single();
}

/** Borra definitivamente un documento y su archivo en Storage. */
export async function purgeDocumento(doc) {
  const supabase = client();

  if (doc.storagePath) {
    await supabase.storage.from("documentos").remove([doc.storagePath]);
  }

  return supabase.from("documentos").delete().eq("id", doc.id);
}

/** Sube archivo al expediente de una empresa (aparte de docs de proceso). */
export async function uploadExpedienteDocumento({ empresaId, file }) {
  const supabase = client();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `expediente/${empresaId}/${unique}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(storagePath, file, { upsert: false });

  if (uploadError) return { data: null, error: uploadError };

  const { data, error } = await supabase
    .from("expediente_documentos")
    .insert({
      empresa_id: Number(empresaId),
      nombre: file.name,
      storage_path: storagePath,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from("documentos").remove([storagePath]);
    return { data: null, error };
  }

  return { data, error: null };
}

/** Mueve un documento de expediente a la papelera. */
export async function deleteExpedienteDocumento(doc) {
  const supabase = client();
  return supabase
    .from("expediente_documentos")
    .update({ deleted_at: nowIso() })
    .eq("id", doc.id)
    .select("*")
    .single();
}

export async function restoreExpedienteDocumento(id) {
  const supabase = client();
  return supabase
    .from("expediente_documentos")
    .update({ deleted_at: null })
    .eq("id", id)
    .select("*")
    .single();
}

export async function purgeExpedienteDocumento(doc) {
  const supabase = client();

  if (doc.storagePath) {
    await supabase.storage.from("documentos").remove([doc.storagePath]);
  }

  return supabase.from("expediente_documentos").delete().eq("id", doc.id);
}

/**
 * Lista ítems en papelera (deleted_at no nulo), más recientes primero.
 * Documentos de proceso: solo los cuyo proceso NO está en papelera
 * (los del proceso borrado se restauran junto con el proceso).
 */
export async function fetchPapelera() {
  const supabase = client();

  const [procesosRes, documentosRes, expedienteRes] = await Promise.all([
    supabase
      .from("procesos")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("documentos")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("expediente_documentos")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ]);

  const error =
    procesosRes.error || documentosRes.error || expedienteRes.error || null;

  return {
    data: {
      procesos: procesosRes.data ?? [],
      documentos: documentosRes.data ?? [],
      expediente: expedienteRes.error ? [] : expedienteRes.data ?? [],
    },
    error,
  };
}

/** TTL por defecto para vista previa / descarga: 10 minutos */
export const SIGNED_URL_TTL_SHORT = 60 * 10;
/** TTL para compartir por WhatsApp / email / enlace: 7 días */
export const SIGNED_URL_TTL_SHARE = 60 * 60 * 24 * 7;

export async function getDocumentoSignedUrl(storagePath, options = {}) {
  if (!storagePath) return null;
  const supabase = client();
  const expiresIn = options.expiresIn ?? SIGNED_URL_TTL_SHORT;
  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(storagePath, expiresIn, {
      download: options.download === true ? true : options.download || undefined,
    });

  if (error) return null;
  return data?.signedUrl ?? null;
}

/** Obtiene URL del documento (storage firmada o url demo). */
async function resolveDocumentoUrl(doc, { forDownload = false } = {}) {
  if (doc.storagePath) {
    const signed = await getDocumentoSignedUrl(doc.storagePath, {
      download: forDownload ? doc.nombre || true : undefined,
    });
    if (signed) return signed;
  }
  return doc.url ?? null;
}

/**
 * Descarga el archivo en el dispositivo (no abre pestaña).
 * La vista previa es para ver; esto solo guarda.
 */
export async function downloadDocumentoFile(doc) {
  const url = await resolveDocumentoUrl(doc, { forDownload: true });
  if (!url) {
    return { error: { message: "No se pudo obtener el archivo" } };
  }

  const filename = doc.nombre || "documento";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo descargar el archivo");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    return { error: null };
  } catch (err) {
    // Fallback: enlace con download (puede fallar en cross-origin)
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return { error: err?.message ? err : null };
  }
}
