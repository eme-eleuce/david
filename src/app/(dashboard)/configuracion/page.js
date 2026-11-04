import { redirect } from "next/navigation";

/** Ruta retirada: las empresas son fijas. */
export default function ConfiguracionRedirectPage() {
  redirect("/");
}
