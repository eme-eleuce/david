"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useData } from "@/components/data/DataProvider";
import {
  applyEmpresaTheme,
  EMPRESA_STORAGE_KEY,
} from "@/lib/empresas-meta";

const EmpresaContext = createContext(null);

/**
 * Empresa activa + picker modal + tema por empresa.
 */
export function EmpresaProvider({ children }) {
  const { empresas, loading } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const [storedSlug, setStoredSlug] = useState(null);
  const [ready, setReady] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    try {
      setStoredSlug(localStorage.getItem(EMPRESA_STORAGE_KEY));
    } catch {
      setStoredSlug(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const match = pathname.match(/^\/empresas\/([^/]+)/);
    if (!match) return;
    const slug = match[1];
    try {
      localStorage.setItem(EMPRESA_STORAGE_KEY, slug);
    } catch {
      /* ignore */
    }
    setStoredSlug(slug);
  }, [pathname]);

  const value = useMemo(() => {
    const match = pathname.match(/^\/empresas\/([^/]+)/);
    const slug = match?.[1] ?? storedSlug;
    const empresa = slug
      ? (empresas.find((e) => e.slug === slug) ?? null)
      : null;

    return {
      empresaId: empresa?.id ?? null,
      empresa,
      empresas,
      isTodas: !empresa,
      isEmpresaRoute: Boolean(match),
      storedSlug,
      ready,
      loadingEmpresas: loading,
      pickerOpen,
    };
  }, [empresas, pathname, storedSlug, ready, loading, pickerOpen]);

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => {
    const match = pathname.match(/^\/empresas\/([^/]+)/);
    const slug = match?.[1] ?? storedSlug;
    const has = Boolean(slug && empresas.some((e) => e.slug === slug));
    if (has) setPickerOpen(false);
  }, [pathname, storedSlug, empresas]);

  const selectEmpresa = useCallback(
    (slug) => {
      try {
        localStorage.setItem(EMPRESA_STORAGE_KEY, slug);
      } catch {
        /* ignore */
      }
      setStoredSlug(slug);
      applyEmpresaTheme(slug);
      setPickerOpen(false);
      router.push(`/empresas/${slug}`);
      requestAnimationFrame(() => {
        const main = document.querySelector("main");
        main?.scrollTo({ top: 0, left: 0, behavior: "auto" });
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    },
    [router],
  );

  // Tema según empresa activa
  useEffect(() => {
    applyEmpresaTheme(value.empresa?.slug ?? null);
  }, [value.empresa?.slug]);

  // Al abrir la app sin empresa → popup obligatorio
  useEffect(() => {
    if (!ready || loading) return;
    if (!value.empresa) setPickerOpen(true);
  }, [ready, loading, value.empresa]);

  const ctx = useMemo(
    () => ({
      ...value,
      openPicker,
      closePicker,
      selectEmpresa,
    }),
    [value, openPicker, closePicker, selectEmpresa],
  );

  return (
    <EmpresaContext.Provider value={ctx}>{children}</EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) {
    throw new Error("useEmpresa debe usarse dentro de EmpresaProvider");
  }
  return ctx;
}
