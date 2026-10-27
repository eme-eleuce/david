import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Intercambia el ?code= del correo de recuperación (PKCE)
 * y redirige a /restablecer (o el next indicado).
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/restablecer";
  const safeNext = next.startsWith("/") ? next : "/restablecer";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, origin));
    }
  }

  const login = new URL("/login", origin);
  login.searchParams.set(
    "error",
    "El enlace no es válido o ya expiró. Solicita uno nuevo.",
  );
  return NextResponse.redirect(login);
}
