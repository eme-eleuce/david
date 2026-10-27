"use client";

import { useEffect, useState } from "react";
import LoadingIcon from "@/components/ui/LoadingIcon";
import Modal, { Field, inputClass } from "@/components/ui/Modal";
import { useData } from "@/components/data/DataProvider";
import { TIPOS_PROCESO } from "@/components/filtros/FiltrosProvider";
import { ESTADOS_PROCESO } from "@/lib/constants";
import { createProceso, updateProceso } from "@/lib/crud";

const currentYear = new Date().getFullYear();

export default function ProcesoFormModal({
  open,
  onClose,
  proceso = null,
  defaultEmpresaId = null,
  onSaved,
}) {
  const { refresh, empresas } = useData();
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

  useEffect(() => {
    if (!open) return;
    setEmpresaId(
      proceso?.empresaId ?? defaultEmpresaId ?? empresas[0]?.id ?? "",
    );
    setObjeto(proceso?.objeto ?? "");
    setEntidadContratante(proceso?.entidadContratante ?? "");
    setMonto(proceso != null ? String(proceso.monto) : "");
    setAnio(String(proceso?.anio ?? currentYear));
    setTipoProceso(proceso?.tipoProceso ?? TIPOS_PROCESO[0]);
    setEstado(proceso?.estado ?? "borrador");
    setError(null);
    setSaving(false);
  }, [open, proceso, defaultEmpresaId, empresas]);

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const fields = {
      empresaId,
      objeto: objeto.trim(),
      entidadContratante: entidadContratante.trim(),
      monto,
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
            <input
              required
              className={inputClass}
              value={entidadContratante}
              onChange={(e) => setEntidadContratante(e.target.value)}
            />
          </Field>
          <Field label="Monto (USD)">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
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
