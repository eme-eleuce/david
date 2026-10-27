"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ESTADOS_PROCESO } from "@/lib/constants";

const FiltrosContext = createContext(null);

export const TIPOS_PROCESO = [
  "Licitación pública",
  "Contratación directa",
  "Cotización",
];

export const ANIOS_DISPONIBLES = [2026, 2025, 2024, 2023];

export const ORDEN_OPTIONS = [
  { value: "recientes", label: "Más recientes primero" },
  { value: "antiguos", label: "Más antiguos primero" },
  { value: "monto_desc", label: "Mayor monto" },
  { value: "monto_asc", label: "Menor monto" },
  { value: "objeto", label: "Objeto A–Z" },
];

export const ORDEN_DEFAULT = "recientes";

function sortProcesos(list, orden) {
  const sorted = [...list];
  const byCreated = (a, b, dir = -1) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id) || 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id) || 0;
    if (ta !== tb) return (ta - tb) * dir;
    return (Number(a.id) - Number(b.id)) * dir;
  };

  switch (orden) {
    case "antiguos":
      return sorted.sort((a, b) => byCreated(a, b, 1));
    case "monto_desc":
      return sorted.sort((a, b) => b.monto - a.monto || byCreated(a, b, -1));
    case "monto_asc":
      return sorted.sort((a, b) => a.monto - b.monto || byCreated(a, b, -1));
    case "objeto":
      return sorted.sort(
        (a, b) =>
          a.objeto.localeCompare(b.objeto, "es") || byCreated(a, b, -1),
      );
    case "recientes":
    default:
      return sorted.sort((a, b) => byCreated(a, b, -1));
  }
}

export function applyFiltros(procesos, filtros, empresaId = null) {
  const q = filtros.query.trim().toLowerCase();

  const filtered = procesos.filter((p) => {
    if (empresaId && p.empresaId !== empresaId) return false;
    if (filtros.estado && p.estado !== filtros.estado) return false;
    if (filtros.anio != null && p.anio !== filtros.anio) return false;
    if (filtros.tipoProceso && p.tipoProceso !== filtros.tipoProceso) {
      return false;
    }
    if (!q) return true;

    const estadoLabel = ESTADOS_PROCESO[p.estado] ?? p.estado;
    const haystack = [
      p.objeto,
      p.entidadContratante,
      p.tipoProceso,
      String(p.anio),
      estadoLabel,
      p.id,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  return sortProcesos(filtered, filtros.orden ?? ORDEN_DEFAULT);
}

export function FiltrosProvider({ children }) {
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState(null);
  const [anio, setAnio] = useState(null);
  const [tipoProceso, setTipoProceso] = useState(null);
  const [orden, setOrden] = useState(ORDEN_DEFAULT);
  const [panelOpen, setPanelOpen] = useState(false);

  const clearFiltros = useCallback(() => {
    setQuery("");
    setEstado(null);
    setAnio(null);
    setTipoProceso(null);
    setOrden(ORDEN_DEFAULT);
  }, []);

  const value = useMemo(() => {
    const activeCount = [
      query.trim() ? 1 : 0,
      estado ? 1 : 0,
      anio != null ? 1 : 0,
      tipoProceso ? 1 : 0,
      orden !== ORDEN_DEFAULT ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    return {
      query,
      setQuery,
      estado,
      setEstado,
      anio,
      setAnio,
      tipoProceso,
      setTipoProceso,
      orden,
      setOrden,
      clearFiltros,
      activeCount,
      hasFiltros: activeCount > 0,
      panelOpen,
      setPanelOpen,
      togglePanel: () => setPanelOpen((v) => !v),
      closePanel: () => setPanelOpen(false),
      filtros: { query, estado, anio, tipoProceso, orden },
    };
  }, [query, estado, anio, tipoProceso, orden, clearFiltros, panelOpen]);

  return (
    <FiltrosContext.Provider value={value}>{children}</FiltrosContext.Provider>
  );
}

export function useFiltros() {
  const ctx = useContext(FiltrosContext);
  if (!ctx) {
    throw new Error("useFiltros debe usarse dentro de FiltrosProvider");
  }
  return ctx;
}
