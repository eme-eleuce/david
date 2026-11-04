/**
 * Icono de carga: favicon girando.
 * @param {{ className?: string, label?: string | null }} props
 */
export default function LoadingIcon({ className = "h-7 w-7", label = null }) {
  return (
    <span className="inline-flex items-center gap-2.5" role="status" aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/favicon.ico"
        alt=""
        aria-hidden
        className={`inline-block shrink-0 animate-spin ${className}`}
      />
      {label ? <span className="text-sm text-slate-500">{label}</span> : null}
      <span className="sr-only">Cargando</span>
    </span>
  );
}

/** Bloque centrado de carga (páginas / paneles). */
export function LoadingBlock({
  label = "Cargando…",
  className = "",
  iconClassName = "h-11 w-11",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-10 text-sm text-slate-500 ${className}`}
    >
      <LoadingIcon className={iconClassName} />
      <span>{label}</span>
    </div>
  );
}
