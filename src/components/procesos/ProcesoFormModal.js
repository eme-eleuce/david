"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import LoadingIcon from "@/components/ui/LoadingIcon";
import Modal, { Field, inputClass } from "@/components/ui/Modal";
import { useData } from "@/components/data/DataProvider";
import { TIPOS_PROCESO } from "@/components/filtros/FiltrosProvider";
import { ESTADOS_PROCESO, TIPOS_DOCUMENTO } from "@/lib/constants";
import { createProceso, updateProceso, uploadDocumento } from "@/lib/crud";

const currentYear = new Date().getFullYear();
const DOC_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

function fileKey(file) {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

const DOC_TIPO_DEFAULT = "contrato";

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
  /** @type {[{ key: string, tipo: string, file: File }]} */
  const [pendingDocs, setPendingDocs] = useState([]);
  /** Si el proceso ya se creó pero falló alguna subida, no reintentar el alta. */
  const [createdId, setCreatedId] = useState(null);

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
    setPendingDocs([]);
    setCreatedId(null);
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

  function addPendingFiles(fileList) {
    const next = Array.from(fileList ?? []);
    if (!next.length) return;
    setPendingDocs((prev) => {
      const seen = new Set(prev.map((d) => fileKey(d.file)));
      const merged = [...prev];
      for (const file of next) {
        const key = fileKey(file);
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push({
          key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          tipo: DOC_TIPO_DEFAULT,
          file,
        });
      }
      return merged;
    });
  }

  function removePendingDoc(key) {
    setPendingDocs((prev) => prev.filter((d) => d.key !== key));
  }

  function setPendingDocTipo(key, tipo) {
    setPendingDocs((prev) =>
      prev.map((d) => (d.key === key ? { ...d, tipo } : d)),
    );
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
    if (createdId) {
      onClose();
      return;
    }
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

    if (!isEdit && pendingDocs.length > 0) {
      const procesoId = result.data?.id;
      const failures = [];
      for (const item of pendingDocs) {
        const { error: uploadError } = await uploadDocumento({
          procesoId,
          tipo: item.tipo,
          file: item.file,
        });
        if (uploadError) {
          failures.push(`${item.file.name}: ${uploadError.message}`);
        }
      }
      if (failures.length > 0) {
        await refresh();
        setPendingDocs([]);
        setCreatedId(procesoId);
        setError(
          `Proceso creado, pero algunos documentos no se subieron:\n${failures.join("\n")}`,
        );
        setSaving(false);
        onSaved?.(result.data);
        return;
      }
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
          <div className="grid grid-cols-2 gap-3 sm:contents sm:gap-0">
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
          </div>
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

        {!isEdit && !createdId ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Documentos
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Opcional. Agrega los archivos y luego indica el tipo de cada
                uno.
              </p>
            </div>

            <Field label="Archivos">
              <input
                type="file"
                multiple
                accept={DOC_ACCEPT}
                disabled={saving}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                onChange={(e) => {
                  addPendingFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </Field>

            {pendingDocs.length > 0 ? (
              <ul className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                {pendingDocs.map((item) => (
                  <li
                    key={item.key}
                    className="flex flex-col gap-1.5 rounded-md px-2 py-2 ring-1 ring-slate-100 sm:flex-row sm:items-center sm:gap-2"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1 truncate text-xs text-slate-700">
                        {item.file.name}
                      </span>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => removePendingDoc(item.key)}
                        className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 sm:hidden"
                        aria-label={`Quitar ${item.file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 sm:w-40 sm:flex-none"
                        value={item.tipo}
                        disabled={saving}
                        aria-label={`Tipo de ${item.file.name}`}
                        onChange={(e) =>
                          setPendingDocTipo(item.key, e.target.value)
                        }
                      >
                        {Object.entries(TIPOS_DOCUMENTO).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => removePendingDoc(item.key)}
                        className="hidden shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 sm:inline-flex"
                        aria-label={`Quitar ${item.file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">
                Sin documentos por ahora. Puedes agregarlos después en el
                proceso.
              </p>
            )}
          </div>
        ) : null}

        {error && (
          <p className="whitespace-pre-line rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
            disabled={
              saving ||
              (!createdId && (!empresaId || !objeto.trim()))
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {saving ? <LoadingIcon className="h-4 w-4" /> : null}
            {saving
              ? "Guardando…"
              : createdId
                ? "Cerrar"
                : isEdit
                  ? "Guardar"
                  : "Crear"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
