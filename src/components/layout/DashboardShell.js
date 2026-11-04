"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import DashboardMain from "@/components/layout/DashboardMain";

/**
 * En `/` (elegir empresa) pantalla neutral a pantalla completa.
 * En el resto, sidebar + header habituales.
 */
export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const isPickEmpresa = pathname === "/";

  if (isPickEmpresa) {
    return (
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-slate-50">
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-background">
      <Sidebar />
      <DashboardMain>{children}</DashboardMain>
    </div>
  );
}
