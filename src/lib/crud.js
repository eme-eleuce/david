import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";

function client() {
  return createClient();
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
      monto: Number(fields.monto) || 0,
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
  if (fields.monto != null) payload.monto = Number(fields.monto) || 0;
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

export async function deleteProceso(id) {
  const supabase = client();
  return supabase.from("procesos").delete().eq("id", id);
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

export async function deleteDocumento(doc) {
  const supabase = client();

  if (doc.storagePath) {
    await supabase.storage.from("documentos").remove([doc.storagePath]);
  }

  return supabase.from("documentos").delete().eq("id", doc.id);
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
