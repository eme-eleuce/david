/** Metadatos de marca por slug (logos en /public/logos). */

export const EMPRESA_STORAGE_KEY = "potts-empresa-slug";

export const EMPRESA_LOGOS = {
  multinuclear: "/logos/multinuclear.png",
  kurs: "/logos/kurs-2.png",
  arenzecorp: "/logos/arenzecorp.png",
  duropegasa: "/logos/duropegasa.png",
  ecuasinergy: "/logos/ecuasinergy.png",
};

export const EMPRESA_SLOGANS = {
  multinuclear: "Consultora",
  kurs: "Estudios de Ingeniería",
  arenzecorp: "Progressus scientia",
  duropegasa: "Fortalecimiento Institucional",
  ecuasinergy: "Protección Industrial",
};

/** Colores de marca por empresa (sidebar + botones). */
export const EMPRESA_THEMES = {
  multinuclear: {
    brand: "#6902d6",
    brandSoft: "#f3e8ff",
    brandHover: "#5402ab",
    sidebar: "#14081f",
    sidebarMuted: "#b39bc9",
    sidebarActive: "#4c1d95",
  },
  kurs: {
    brand: "#9a3412",
    brandSoft: "#ffedd5",
    brandHover: "#7c2d12",
    sidebar: "#141210",
    sidebarMuted: "#a8a29e",
    sidebarActive: "#3f2e22",
  },
  arenzecorp: {
    brand: "#2572c4",
    brandSoft: "#dbeafe",
    brandHover: "#1d5a9c",
    sidebar: "#0c1524",
    sidebarMuted: "#8ba3c4",
    sidebarActive: "#1a4f8c",
  },
  duropegasa: {
    brand: "#1f8732",
    brandSoft: "#dcfce7",
    brandHover: "#176628",
    sidebar: "#0c1a10",
    sidebarMuted: "#7da88a",
    sidebarActive: "#156628",
  },
  ecuasinergy: {
    brand: "#c70000",
    brandSoft: "#fee2e2",
    brandHover: "#a30000",
    sidebar: "#1c0808",
    sidebarMuted: "#d4a0a0",
    sidebarActive: "#8b0000",
  },
};

export const DEFAULT_THEME = EMPRESA_THEMES.kurs;

export function logoForSlug(slug) {
  if (!slug) return null;
  return EMPRESA_LOGOS[slug] ?? null;
}

export function sloganForSlug(slug) {
  if (!slug) return "Gestión contractual";
  return EMPRESA_SLOGANS[slug] ?? "Gestión contractual";
}

export function themeForSlug(slug) {
  if (!slug) return DEFAULT_THEME;
  return EMPRESA_THEMES[slug] ?? DEFAULT_THEME;
}

export function applyEmpresaTheme(slug) {
  if (typeof document === "undefined") return;
  const t = themeForSlug(slug);
  const root = document.documentElement;
  root.style.setProperty("--brand", t.brand);
  root.style.setProperty("--brand-soft", t.brandSoft);
  root.style.setProperty("--brand-hover", t.brandHover);
  root.style.setProperty("--sidebar", t.sidebar);
  root.style.setProperty("--sidebar-muted", t.sidebarMuted);
  root.style.setProperty("--sidebar-active", t.sidebarActive);
}
