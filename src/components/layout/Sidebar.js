"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Building2,
  FolderOpen,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import EmpresaSelectModal from "@/components/empresas/EmpresaSelectModal";
import { useSidebarNav } from "@/components/layout/SidebarNavContext";
import LoadingIcon from "@/components/ui/LoadingIcon";
import Modal from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";

const NAV_STATIC = [
  { href: "/documentoteca", label: "Documentoteca", icon: FolderOpen },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
  { href: "/perfil", label: "Mi perfil", icon: UserRound },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open, close } = useSidebarNav();
  const { empresa, openPicker } = useEmpresa();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const vistaHref = empresa?.slug ? `/empresas/${empresa.slug}` : "/";
  const nav = [
    { href: vistaHref, label: "Vista general", icon: LayoutDashboard, match: "/empresas/" },
    ...NAV_STATIC,
  ];

  async function confirmLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <aside
        id="app-sidebar"
        className={`fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-sidebar text-white transition-transform duration-300 ease-out md:static md:inset-auto md:z-auto md:h-full md:w-60 md:shrink-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 80%, white 0, transparent 40%)",
          }}
        />

        <div className="relative flex shrink-0 items-start justify-between gap-2 border-b border-white/10 px-4 py-5">
          {empresa ? (
            <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
              <div className="flex w-full min-w-0 items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
                  {empresa.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={empresa.logoUrl}
                      alt=""
                      className="max-h-11 max-w-11 object-contain"
                    />
                  ) : (
                    <Building2 className="h-7 w-7 text-slate-500" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold leading-tight tracking-wide text-white">
                    {empresa.nombre}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-sidebar-muted">
                    {empresa.slogan}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-lg font-bold tracking-wide">POTTS OS</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-sidebar-muted">
                Gestión contractual
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-md p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          <button
            type="button"
            onClick={() => {
              openPicker();
              close();
            }}
            className="mb-3 flex w-full items-center gap-3 rounded-r-full bg-white/10 px-4 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/15"
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            Escoger empresa
          </button>

          {nav.map(({ href, label, icon: Icon, match }) => {
            const active = pathname.startsWith(match ?? href);

            return (
              <Link
                key={label}
                href={href}
                onClick={close}
                className={`flex items-center gap-3 rounded-r-full px-4 py-2.5 text-sm transition ${
                  active
                    ? "bg-sidebar-active font-medium text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="relative shrink-0 space-y-2 border-t border-white/10 px-4 py-4">
          <button
            type="button"
            onClick={() => {
              close();
              setLogoutOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <EmpresaSelectModal />

      <Modal
        open={logoutOpen}
        onClose={() => !loggingOut && setLogoutOpen(false)}
        title="Cerrar sesión"
      >
        <p className="text-sm text-slate-600">
          ¿Seguro que quieres cerrar sesión?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => setLogoutOpen(false)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loggingOut}
            onClick={confirmLogout}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loggingOut ? (
              <LoadingIcon className="h-4 w-4" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {loggingOut ? "Saliendo…" : "Sí, cerrar sesión"}
          </button>
        </div>
      </Modal>
    </>
  );
}
