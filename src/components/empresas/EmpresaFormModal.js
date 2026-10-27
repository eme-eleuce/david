"use client";

import { useEffect, useState } from "react";
import LoadingIcon from "@/components/ui/LoadingIcon";
import Modal, { Field, inputClass } from "@/components/ui/Modal";
import { useData } from "@/components/data/DataProvider";
import { createEmpresa, updateEmpresa } from "@/lib/crud";

export default function EmpresaFormModal({
  open,
  onClose,
  empresa = null,
  onSaved,
}) {
  const { refresh } = useData();
  const isEdit = Boolean(empresa);
  const [nombre, setNombre] = useState("");
  const [activa, setActiva] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setNombre(empresa?.nombre ?? "");
    setActiva(empresa?.activa ?? true);
    setError(null);
    setSaving(false);
  }, [open, empresa]);

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = isEdit
      ? await updateEmpresa(empresa.id, { nombre, activa })
      : await createEmpresa({ nombre, activa });

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar empresa" : "Nueva empresa"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nombre">
          <input
            required
            className={inputClass}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Empresa Alpha"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={activa}
            onChange={(e) => setActiva(e.target.checked)}
            className="rounded border-slate-300"
          />
          Empresa activa
        </label>

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
            disabled={saving || !nombre.trim()}
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
