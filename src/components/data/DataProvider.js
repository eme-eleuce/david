"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeKpis,
  mapDocumento,
  mapEmpresa,
  mapExpedienteDocumento,
  mapProceso,
} from "@/lib/mappers";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [empresas, setEmpresas] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [expedienteDocumentos, setExpedienteDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    const supabase = createClient();

    const [empresasRes, procesosRes, documentosRes, expedienteRes] =
      await Promise.all([
        supabase.from("empresas").select("*").order("nombre"),
        supabase
          .from("procesos")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("documentos").select("*").order("id"),
        supabase
          .from("expediente_documentos")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    if (empresasRes.error || procesosRes.error || documentosRes.error) {
      const msg =
        empresasRes.error?.message ||
        procesosRes.error?.message ||
        documentosRes.error?.message ||
        "Error al cargar datos";
      setError(msg);
      setEmpresas([]);
      setProcesos([]);
      setDocumentos([]);
      setExpedienteDocumentos([]);
      setLoading(false);
      return;
    }

    setEmpresas((empresasRes.data ?? []).map(mapEmpresa));
    setProcesos((procesosRes.data ?? []).map(mapProceso));
    setDocumentos((documentosRes.data ?? []).map(mapDocumento));
    // Tabla nueva: si aún no existe en Supabase, no tumbar el resto de la app
    if (expedienteRes.error) {
      setExpedienteDocumentos([]);
    } else {
      setExpedienteDocumentos(
        (expedienteRes.data ?? []).map(mapExpedienteDocumento),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      empresas,
      procesos,
      documentos,
      expedienteDocumentos,
      loading,
      error,
      refresh,
      getKpis(empresaId = null) {
        const list = empresaId
          ? procesos.filter((p) => p.empresaId === empresaId)
          : procesos;
        return computeKpis(list);
      },
      getProcesoById(id) {
        return procesos.find((p) => p.id === id) ?? null;
      },
      getDocumentosByProceso(procesoId) {
        return documentos.filter((d) => d.procesoId === procesoId);
      },
      getExpedienteByEmpresa(empresaId) {
        return expedienteDocumentos.filter(
          (d) => String(d.empresaId) === String(empresaId),
        );
      },
      getEmpresaBySlug(slug) {
        return empresas.find((e) => e.slug === slug) ?? null;
      },
    }),
    [
      empresas,
      procesos,
      documentos,
      expedienteDocumentos,
      loading,
      error,
      refresh,
    ],
  );

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData debe usarse dentro de DataProvider");
  }
  return ctx;
}
