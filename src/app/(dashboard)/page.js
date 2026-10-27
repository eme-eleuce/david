"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";

/** Si ya hay empresa, entra a su panel; si no, el popup se encarga. */
export default function DashboardPage() {
  const router = useRouter();
  const { empresa, ready, openPicker } = useEmpresa();

  useEffect(() => {
    if (!ready) return;
    if (empresa) {
      router.replace(`/empresas/${empresa.slug}`);
    } else {
      openPicker();
    }
  }, [ready, empresa, router, openPicker]);

  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
      {empresa ? "Entrando…" : "Elige una empresa para continuar"}
    </div>
  );
}
