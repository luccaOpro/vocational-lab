/*
  auth-guard.ts — helpers para proteger las páginas privadas del aula.
  ---
  Usan el cliente de Supabase (lib/supabase.ts). Pensados para correr
  en el navegador (en un <script> de Astro), no en el server.

  Patrón típico en una página privada:

    import { requireSession } from "../../lib/auth-guard";
    const auth = await requireSession();
    if (!auth) return; // ya redirigió a /aula/login
    // ... usar auth.session y auth.profile ...
*/

import { supabase } from "./supabase";

export type Rol = "alumno" | "profe" | "admin";

export interface AuthInfo {
  session: import("@supabase/supabase-js").Session;
  profile: {
    id: string;
    nombre: string;
    rol: Rol;
  };
}

/** Adónde manda cada rol después del login. */
export const homePorRol: Record<Rol, string> = {
  alumno: "/aula/mis-cursos",
  profe: "/aula/profe",
  admin: "/aula/admin",
};

/**
 * Chequea que haya sesión activa y carga el profile del user.
 * Si no hay sesión → redirige a /aula/login y retorna null.
 * Si hay sesión pero el profile no se puede leer → muestra error y retorna null.
 */
export async function requireSession(): Promise<AuthInfo | null> {
  const { data: sesionData } = await supabase.auth.getSession();
  if (!sesionData.session) {
    window.location.href = "/aula/login";
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, nombre, rol")
    .eq("id", sesionData.session.user.id)
    .single();

  if (error || !profile) {
    console.error("[auth-guard] No se pudo cargar el profile:", error);
    return null;
  }

  return {
    session: sesionData.session,
    profile: profile as AuthInfo["profile"],
  };
}

/**
 * Como requireSession pero además requiere que el rol esté en la lista.
 * Si el rol no coincide → redirige al home del rol del user.
 */
export async function requireRol(roles: Rol[]): Promise<AuthInfo | null> {
  const auth = await requireSession();
  if (!auth) return null;
  if (!roles.includes(auth.profile.rol)) {
    window.location.href = homePorRol[auth.profile.rol];
    return null;
  }
  return auth;
}

/**
 * Muestra el banner "vista de alumno" cuando un admin/profe está
 * navegando una página de alumno. Si el user es alumno, no hace nada.
 *
 * Llamar desde páginas de alumno (mis-cursos, curso) después de
 * requireSession().
 */
export function mostrarBannerSiPreview(profile: AuthInfo["profile"]) {
  if (profile.rol === "alumno") return;

  const banner = document.createElement("div");
  banner.className = "preview-banner";

  const etiqueta = profile.rol === "admin" ? "Administrador" : "Profesor";
  const destino = homePorRol[profile.rol];

  banner.innerHTML = `
    <span class="preview-banner__icono" aria-hidden="true">👁</span>
    <span class="preview-banner__texto">
      Estás viendo el aula como alumno · eres <strong>${etiqueta}</strong>.
    </span>
    <a href="${destino}" class="preview-banner__link">Volver a tu panel →</a>
  `;

  // Lo metemos arriba de todo, dentro del body.
  document.body.insertBefore(banner, document.body.firstChild);
}
