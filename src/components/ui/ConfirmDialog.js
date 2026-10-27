"use client";

import { Trash2 } from "lucide-react";
import LoadingIcon from "@/components/ui/LoadingIcon";
import Modal from "@/components/ui/Modal";

/**
 * Confirmación in-app (sin alert/confirm del navegador).
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar",
  message,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  loading = false,
  danger = true,
}) {
  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title={title}
    >
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
            danger
              ? "bg-red-600 hover:bg-red-700"
              : "bg-brand hover:bg-brand-hover"
          }`}
        >
          {loading ? (
            <LoadingIcon className="h-4 w-4" />
          ) : (
            danger && <Trash2 className="h-4 w-4" />
          )}
          {loading ? "Procesando…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
