"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Modal({
  open,
  title,
  onClose,
  children,
  wide = false,
  full = false,
  /** Sin padding en el body; útil para previews a pantalla completa */
  flush = false,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const widthClass = full
    ? "sm:max-w-5xl"
    : wide
      ? "sm:max-w-2xl"
      : "sm:max-w-lg";

  const shellClass = full
    ? `relative z-10 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden rounded-none border-0 bg-white shadow-xl sm:mx-4 sm:h-auto sm:max-h-[92dvh] sm:rounded-2xl sm:border sm:border-slate-200 ${widthClass}`
    : `relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:mx-4 sm:rounded-2xl ${widthClass}`;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex justify-center ${
        full ? "items-stretch sm:items-center" : "items-end sm:items-center"
      }`}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={shellClass}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="min-w-0 truncate text-sm font-semibold text-slate-900 sm:text-base">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          className={
            flush
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4"
          }
          style={
            flush
              ? undefined
              : { WebkitOverflowScrolling: "touch" }
          }
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
