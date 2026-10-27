"use client";

import { LayoutGrid, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import { useSidebarNav } from "@/components/layout/SidebarNavContext";

function usePageTitle() {
  const pathname = usePathname();

  if (pathname === "/") return "Escoger empresa";
  if (pathname.startsWith("/empresas/")) return "Vista general";
  if (pathname.startsWith("/documentoteca")) return "Documentoteca";
  if (pathname.startsWith("/reportes")) return "Reportes";
  if (pathname.startsWith("/configuracion")) return "Configuración";
  if (pathname.startsWith("/perfil")) return "Mi perfil";
  if (pathname.startsWith("/procesos/")) return "Proceso";
  return "POTTS OS";
}

/** Menú + título + cambiar empresa (móvil). */
export default function Header() {
  const { open, toggle } = useSidebarNav();
  const { openPicker } = useEmpresa();
  const title = usePageTitle();

  return (
    <header className="flex shrink-0 items-center gap-1 border-b border-slate-200/80 bg-white px-2 py-2 md:hidden">
      <button
        type="button"
        onClick={toggle}
        className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="app-sidebar"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">
        {title}
      </h1>
      <button
        type="button"
        onClick={openPicker}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        aria-label="Cambiar empresa"
      >
        <LayoutGrid className="h-3.5 w-3.5 text-brand" />
        Empresa
      </button>
    </header>
  );
}
