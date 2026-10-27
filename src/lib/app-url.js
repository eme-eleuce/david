/**
 * URL pública de la app (local o dominio).
 * Preferir NEXT_PUBLIC_APP_URL; en el navegador usa el origin actual.
 */
export function getAppUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return fromEnv || "http://localhost:3000";
}
