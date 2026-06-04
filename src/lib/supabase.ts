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

export const supabase = createClient(supabaseUrl, supabaseKey);
