"use client";

import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Shield, User } from "lucide-react";
import LoadingIcon, { LoadingBlock } from "@/components/ui/LoadingIcon";
import { Field, inputClass } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !user) {
        setProfileError("No se pudo cargar la sesión.");
        setLoading(false);
        return;
      }

      setEmail(user.email ?? "");
      setNombre(user.user_metadata?.full_name ?? "");
      setCargo(user.user_metadata?.cargo ?? "");
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSaveProfile(event) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    setProfileError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: nombre.trim(),
        cargo: cargo.trim(),
      },
    });

    if (error) {
      setProfileError(error.message);
      setProfileBusy(false);
      return;
    }

    setProfileMsg("Perfil actualizado.");
    setProfileBusy(false);
  }

  async function onChangePassword(event) {
    event.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("La nueva contraseña debe ser distinta a la actual.");
      return;
    }

    setPasswordBusy(true);
    const supabase = createClient();

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (reauthError) {
      setPasswordError("La contraseña actual no es correcta.");
      setPasswordBusy(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordError(error.message);
      setPasswordBusy(false);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMsg("Contraseña actualizada. Guárdala en un lugar seguro.");
    setPasswordBusy(false);
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <LoadingBlock label="Cargando perfil…" className="py-0" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col gap-4 overflow-auto">
      <div className="shrink-0">
        <h1 className="hidden text-2xl font-semibold text-slate-900 md:block">
          Mi perfil
        </h1>
        <p className="text-sm text-slate-500 md:mt-0.5">
          Datos de tu cuenta y seguridad de acceso
        </p>
      </div>

      {/* Cuenta */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white">
            <User className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">
              {nombre.trim() || "Usuario"}
            </p>
            <p className="truncate text-sm text-slate-500">{email}</p>
          </div>
        </div>

        <form onSubmit={onSaveProfile} className="space-y-3">
          <Field label="Email">
            <input
              type="email"
              value={email}
              disabled
              className={`${inputClass} cursor-not-allowed opacity-70`}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              El email es el usuario de acceso; no se puede cambiar aquí.
            </p>
          </Field>

          <Field label="Nombre">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className={inputClass}
              maxLength={80}
            />
          </Field>

          <Field label="Cargo">
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ej. Administrador"
              className={inputClass}
              maxLength={80}
            />
          </Field>

          {profileError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {profileError}
            </p>
          )}
          {profileMsg && (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <Check className="h-4 w-4 shrink-0" />
              {profileMsg}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={profileBusy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {profileBusy ? <LoadingIcon className="h-4 w-4" /> : null}
              {profileBusy ? "Guardando…" : "Guardar perfil"}
            </button>
          </div>
        </form>
      </section>

      {/* Contraseña */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold text-slate-900">
            Cambiar contraseña
          </h2>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Usa una clave privada. Tras cambiarla, solo tú la conocerás.
        </p>

        <form onSubmit={onChangePassword} className="space-y-3">
          <Field label="Contraseña actual">
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                aria-label={showCurrent ? "Ocultar" : "Mostrar"}
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>

          <Field label="Nueva contraseña">
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                aria-label={showNew ? "Ocultar" : "Mostrar"}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Mínimo 8 caracteres</p>
          </Field>

          <Field label="Confirmar nueva contraseña">
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              minLength={8}
            />
          </Field>

          {passwordError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordError}
            </p>
          )}
          {passwordMsg && (
            <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <Shield className="h-4 w-4 shrink-0" />
              {passwordMsg}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordBusy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
            >
              {passwordBusy ? <LoadingIcon className="h-4 w-4" /> : null}
              {passwordBusy ? "Actualizando…" : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
