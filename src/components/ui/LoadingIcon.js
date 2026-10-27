/**
 * Icono de carga: favicon girando.
 * @param {{ className?: string, label?: string | null }} props
 */
export default function LoadingIcon({ className = "h-5 w-5", label = null }) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
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
  iconClassName = "h-6 w-6",
}) {
  return (
    <div
      className={`flex items-center justify-center gap-2.5 py-8 text-sm text-slate-500 ${className}`}
    >
      <LoadingIcon className={iconClassName} />
      <span>{label}</span>
    </div>
  );
}
