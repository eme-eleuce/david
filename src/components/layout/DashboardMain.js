"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";
import Header from "@/components/layout/Header";

/** Columna principal: al cambiar de ruta o empresa, scroll al tope. */
export default function DashboardMain({ children }) {
  const pathname = usePathname();
  const { empresa } = useEmpresa();
  const mainRef = useRef(null);
  const empresaSlug = empresa?.slug ?? null;

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, empresaSlug]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <Header />
      <main
        ref={mainRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-3 sm:p-6 md:overflow-hidden"
      >
        {children}
      </main>
    </div>
  );
}
