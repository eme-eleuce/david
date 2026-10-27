"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

function pageWindow(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export default function PaginationControls({
  page,
  totalPages,
  totalItems,
  start,
  end,
  goFirst,
  goPrev,
  goNext,
  goLast,
  setPage,
}) {
  if (totalItems === 0) {
    return (
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500 sm:px-5">
        <span>Sin registros</span>
      </div>
    );
  }

  const pages = pageWindow(page, totalPages);
  const disabled = "opacity-40 pointer-events-none";

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500 sm:px-5">
      <span>
        Mostrando{" "}
        <span className="font-medium text-slate-700">
          {start + 1}–{end}
        </span>{" "}
        de{" "}
        <span className="font-medium text-slate-700">{totalItems}</span>{" "}
        registro{totalItems === 1 ? "" : "s"}
      </span>

      <div className="flex items-center gap-1">
        <NavButton
          label="Primera página"
          onClick={goFirst}
          disabled={page <= 1}
          disabledClass={disabled}
        >
          <ChevronsLeft className="h-4 w-4" />
        </NavButton>
        <NavButton
          label="Página anterior"
          onClick={goPrev}
          disabled={page <= 1}
          disabledClass={disabled}
        >
          <ChevronLeft className="h-4 w-4" />
        </NavButton>

        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const showGap = prev != null && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {showGap && <span className="px-1 text-slate-400">…</span>}
              <button
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={`min-w-8 rounded-md px-2 py-1.5 text-sm font-medium transition ${
                  p === page
                    ? "bg-brand text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}

        <NavButton
          label="Página siguiente"
          onClick={goNext}
          disabled={page >= totalPages}
          disabledClass={disabled}
        >
          <ChevronRight className="h-4 w-4" />
        </NavButton>
        <NavButton
          label="Última página"
          onClick={goLast}
          disabled={page >= totalPages}
          disabledClass={disabled}
        >
          <ChevronsRight className="h-4 w-4" />
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({ label, onClick, disabled, disabledClass, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 ${
        disabled ? disabledClass : ""
      }`}
    >
      {children}
    </button>
  );
}
