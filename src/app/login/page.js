"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import LoadingIcon from "@/components/ui/LoadingIcon";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hostLabel, setHostLabel] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hostname !== "localhost") {
      setHostLabel(window.location.host);
    }

    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("error");
    if (fromQuery) {
      setError(fromQuery);
      window.history.replaceState(null, "", "/login");
      return;
    }

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const desc = hash.get("error_description");
    if (desc) {
      setError(decodeURIComponent(desc.replace(/\+/g, " ")));
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signError) {
        setError(signError.message);
        return;
      }

      if (!data?.session) {
        setError("No se pudo crear la sesión. Revisa la conexión e intenta de nuevo.");
        return;
      }

      // Refresca el proxy/middleware con las cookies de sesión
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(
        err?.message ||
          "No se pudo conectar. Si entras por IP (celular), revisa Wi‑Fi y que la PC no bloquee la red.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">
            POTTS OS
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Iniciar sesión
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Accede al repositorio de contrataciones
          </p>
          {hostLabel ? (
            <p className="mt-2 text-[11px] text-slate-400">
              Conectado desde {hostLabel}
            </p>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Contraseña
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          <div className="flex justify-end">
            <Link
              href="/recuperar"
              className="text-xs font-medium text-brand hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
          >
            {loading ? <LoadingIcon className="h-4 w-4" /> : null}
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Tras entrar puedes cambiar tu contraseña en Mi perfil
        </p>
      </div>
    </div>
  );
}
