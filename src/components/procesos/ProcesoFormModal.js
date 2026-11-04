"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LoadingIcon from "@/components/ui/LoadingIcon";
import Modal, { Field, inputClass } from "@/components/ui/Modal";
import { useData } from "@/components/data/DataProvider";
import { TIPOS_PROCESO } from "@/components/filtros/FiltrosProvider";
import { ESTADOS_PROCESO } from "@/lib/constants";
import { createProceso, updateProceso } from "@/lib/crud";

const currentYear = new Date().getFullYear();

function normalizeEntidad(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export default function ProcesoFormModal({
  open,
  onClose,
  proceso = null,
  defaultEmpresaId = null,
  onSaved,
}) {
  const { refresh, empresas, procesos } = useData();
  const isEdit = Boolean(proceso);

  const [empresaId, setEmpresaId] = useState("");
  const [objeto, setObjeto] = useState("");
  const [entidadContratante, setEntidadContratante] = useState("");
  const [monto, setMonto] = useState("");
  const [anio, setAnio] = useState(String(currentYear));
  const [tipoProceso, setTipoProceso] = useState(TIPOS_PROCESO[0]);
  const [estado, setEstado] = useState("borrador");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [entidadOpen, setEntidadOpen] = useState(false);
  const [entidadHighlight, setEntidadHighlight] = useState(0);
  const entidadWrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setEmpresaId(
      proceso?.empresaId ?? defaultEmpresaId ?? empresas[0]?.id ?? "",
    );
    setObjeto(proceso?.objeto ?? "");
    setEntidadContratante(proceso?.entidadContratante ?? "");
    setMonto(
      proceso != null ? String(Math.round(Number(proceso.monto) || 0)) : "",
    );
    setAnio(String(proceso?.anio ?? currentYear));
    setTipoProceso(proceso?.tipoProceso ?? TIPOS_PROCESO[0]);
    setEstado(proceso?.estado ?? "borrador");
    setError(null);
    setSaving(false);
    setEntidadOpen(false);
    setEntidadHighlight(0);
  }, [open, proceso, defaultEmpresaId, empresas]);

  useEffect(() => {
    if (!entidadOpen) return;
    function onDocClick(e) {
      if (entidadWrapRef.current?.contains(e.target)) return;
      setEntidadOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [entidadOpen]);

  const entidadesSugeridas = useMemo(() => {
    const counts = new Map();
    for (const p of procesos) {
      const name = String(p.entidadContratante || "").trim();
      if (!name) continue;
      const key = normalizeEntidad(name);
      const prev = counts.get(key);
      if (!prev) {
        counts.set(key, {
          label: name,
          total: 1,
          sameEmpresa: p.empresaId === empresaId ? 1 : 0,
        });
      } else {
        prev.total += 1;
        if (p.empresaId === empresaId) prev.sameEmpresa += 1;
        // Prefer the casing from the most used / empresa-local label
        if (p.empresaId === empresaId) prev.label = name;
      }
    }
    return [...counts.values()].sort((a, b) => {
      if (b.sameEmpresa !== a.sameEmpresa) return b.sameEmpresa - a.sameEmpresa;
      if (b.total !== a.total) return b.total - a.total;
      return a.label.localeCompare(b.label, "es");
    });
  }, [procesos, empresaId]);

  const entidadQuery = normalizeEntidad(entidadContratante);
  const entidadOpciones = useMemo(() => {
    const list = !entidadQuery
      ? entidadesSugeridas
      : entidadesSugeridas.filter((e) =>
          normalizeEntidad(e.label).includes(entidadQuery),
        );
    return list.slice(0, 8);
  }, [entidadesSugeridas, entidadQuery]);

  function pickEntidad(label) {
    setEntidadContratante(label);
    setEntidadOpen(false);
    setEntidadHighlight(0);
  }

  function onEntidadKeyDown(e) {
    if (!entidadOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setEntidadOpen(true);
      return;
    }
    if (!entidadOpen || entidadOpciones.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setEntidadHighlight((i) => (i + 1) % entidadOpciones.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setEntidadHighlight(
        (i) => (i - 1 + entidadOpciones.length) % entidadOpciones.length,
      );
    } else if (e.key === "Enter" && entidadOpciones[entidadHighlight]) {
      e.preventDefault();
      pickEntidad(entidadOpciones[entidadHighlight].label);
    } else if (e.key === "Escape") {
      setEntidadOpen(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const fields = {
      empresaId,
      objeto: objeto.trim(),
      entidadContratante: entidadContratante.trim(),
      monto: Math.round(Number(monto) || 0),
      anio,
      tipoProceso,
      estado,
    };

    const result = isEdit
      ? await updateProceso(proceso.id, fields)
      : await createProceso(fields);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    await refresh();
    setSaving(false);
    onSaved?.(result.data);
    onClose();
  }

  const empresasActivas = empresas.filter((e) => e.activa);
  const opcionesEmpresa =
    isEdit && proceso
      ? empresas
      : empresasActivas.length
        ? empresasActivas
        : empresas;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar proceso" : "Nuevo proceso"}
      wide
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Empresa">
          <select
            required
            className={inputClass}
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
          >
            <option value="" disabled>
              Seleccionar…
            </option>
            {opcionesEmpresa.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Objeto de contratación">
          <textarea
            required
            rows={2}
            className={inputClass}
            value={objeto}
            onChange={(e) => setObjeto(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Entidad contratante">
            <div className="relative" ref={entidadWrapRef}>
              <input
                required
                className={inputClass}
                value={entidadContratante}
                autoComplete="off"
                role="combobox"
                aria-expanded={entidadOpen}
                aria-autocomplete="list"
                aria-controls="entidad-sugerencias"
                placeholder="Escribe o elige una existente…"
                onFocus={() => setEntidadOpen(true)}
                onChange={(e) => {
                  setEntidadContratante(e.target.value);
                  setEntidadOpen(true);
                  setEntidadHighlight(0);
                }}
                onKeyDown={onEntidadKeyDown}
              />
              {entidadOpen && entidadOpciones.length > 0 ? (
                <ul
                  id="entidad-sugerencias"
                  role="listbox"
                  className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                >
                  {entidadOpciones.map((opt, idx) => {
                    const active = idx === entidadHighlight;
                    return (
                      <li key={opt.label} role="option" aria-selected={active}>
                        <button
                          type="button"
                          className={`flex w-full px-3 py-2 text-left text-sm ${
                            active
                              ? "bg-[color-mix(in_srgb,var(--brand)_12%,white)] text-slate-900"
                              : "text-slate-800 hover:bg-slate-50"
                          }`}
                          onMouseEnter={() => setEntidadHighlight(idx)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickEntidad(opt.label)}
                        >
                          <span className="min-w-0 truncate">{opt.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </Field>
          <Field label="Monto (USD)">
            <input
              required
              type="number"
              min="0"
              step="1"
              className={inputClass}
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^\d]/g, ""))}
            />
          </Field>
          <Field label="Año">
            <input
              required
              type="number"
              min="2000"
              max="2100"
              className={inputClass}
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
            />
          </Field>
          <Field label="Tipo de proceso">
            <select
              required
              className={inputClass}
              value={tipoProceso}
              onChange={(e) => setTipoProceso(e.target.value)}
            >
              {TIPOS_PROCESO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select
              required
              className={inputClass}
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              {Object.entries(ESTADOS_PROCESO).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !empresaId || !objeto.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {saving ? <LoadingIcon className="h-4 w-4" /> : null}
            {saving ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
