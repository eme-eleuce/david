"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmpresa } from "@/components/empresas/EmpresaProvider";

/** Redirige a la vista general de la empresa activa. */
export default function ContratacionesRedirectPage() {
  const router = useRouter();
  const { empresa, storedSlug, ready } = useEmpresa();

  useEffect(() => {
    if (!ready) return;
    if (empresa?.slug) {
      router.replace(`/empresas/${empresa.slug}`);
      return;
    }
    if (storedSlug === null) return;
    router.replace("/");
  }, [ready, empresa?.slug, storedSlug, router]);

  return <p className="text-sm text-slate-500">Redirigiendo…</p>;
}
