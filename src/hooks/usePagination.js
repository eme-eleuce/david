"use client";

import { useEffect, useMemo, useState } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

/** 5 en móvil, 10 en tablet/desktop. */
export function usePageSize() {
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setPageSize(mq.matches ? 5 : 10);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return pageSize;
}

/**
 * Paginación que se reinicia al cambiar filtro o pageSize.
 * @param {number} totalItems
 * @param {unknown} resetKey — ej. empresaId
 */
export function usePagination(totalItems, resetKey) {
  const pageSize = usePageSize();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize, totalItems]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalItems);

  return useMemo(
    () => ({
      page: safePage,
      pageSize,
      totalPages,
      start,
      end,
      totalItems,
      setPage,
      goFirst: () => setPage(1),
      goPrev: () => setPage((p) => Math.max(1, p - 1)),
      goNext: () => setPage((p) => Math.min(totalPages, p + 1)),
      goLast: () => setPage(totalPages),
      slice: (items) => items.slice(start, end),
    }),
    [safePage, pageSize, totalPages, start, end, totalItems],
  );
}
