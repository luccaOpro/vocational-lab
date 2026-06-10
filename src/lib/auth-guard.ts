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
    // Sesión válida pero sin profile legible: estado roto (ej: profile
    // borrado a mano, RLS mal aplicada). Antes retornábamos null sin
    // redirigir y la página quedaba colgada en el loader para siempre.
    // Cerramos la sesión rota y mandamos al login para empezar de cero.
    console.error("[auth-guard] No se pudo cargar el profile:", error);
    await supabase.auth.signOut();
    window.location.href = "/aula/login";
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
