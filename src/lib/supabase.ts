/*
  Cliente de Supabase — punto único de conexión a la base de datos.
  ---
  Cualquier página o componente que necesite hablar con Supabase
  importa de acá: `import { supabase } from "../lib/supabase"`.

  Las credenciales viven en .env (NO se suben a GitHub).
  Para producción (Cloudflare Pages) las cargamos en Settings → Environment variables.
*/

import { createClient } from "@supabase/supabase-js";

// Astro expone las variables de entorno con prefijo PUBLIC_ al cliente.
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan las variables de entorno de Supabase. " +
      "Asegurate de tener PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env"
  );
}

/*
  "Mantener la sesión iniciada" (checkbox del login):
  ---
  · Marcado (default)  → la sesión se guarda en localStorage: sobrevive
    al cierre del navegador, como siempre.
  · Desmarcado         → la sesión se guarda en sessionStorage: muere al
    cerrar el navegador. Pensado para computadoras compartidas.

  El login guarda la preferencia en PERSISTENCIA_KEY ANTES de hacer el
  signIn, y este adaptador decide dónde escribir los tokens según eso.
  La lectura mira ambos lados (el token está en uno solo); el borrado
  limpia ambos por las dudas.
*/
export const PERSISTENCIA_KEY = "vl_sesion_persistencia";

const storageAdapter = {
  getItem: (key: string): string | null =>
    window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key),
  setItem: (key: string, value: string): void => {
    if (window.localStorage.getItem(PERSISTENCIA_KEY) === "session") {
      window.sessionStorage.setItem(key, value);
    } else {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: storageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
