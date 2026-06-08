-- ============================================================
-- MIGRACIÓN 10 · Foto de perfil (avatar)
-- ------------------------------------------------------------
-- Suma la posibilidad de que un usuario (protagonista, profe o
-- admin) suba una foto de perfil para reemplazar las iniciales
-- que se muestran por default en el aula.
--
-- Qué hace:
--   1) Agrega la columna `avatar_url` (text, nullable) en profiles.
--   2) Crea el bucket público `avatares` en Storage.
--   3) RLS de storage:
--        · escritura: solo el propio dueño (carpeta = su uid).
--        · lectura:   pública (cualquiera con la URL puede ver).
--   4) RLS para borrar también está cubierta por la policy general
--      del dueño.
--
-- Path convention: avatares/{userId}/avatar.{ext}
--   Mantenemos solo UN archivo por usuario (siempre se sobrescribe).
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente: se puede correr varias veces.
-- ============================================================


-- ============================================================
-- 1) Columna avatar_url en profiles
-- ============================================================

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'URL pública del avatar del usuario (bucket Storage "avatares"). Null si todavía no subió foto, en cuyo caso la UI muestra iniciales.';


-- ============================================================
-- 2) Bucket público "avatares"
-- ============================================================

-- Bucket público — la URL se sirve directo sin necesidad de firmar.
-- Las fotos de perfil son visibles para cualquiera con el link.
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;


-- ============================================================
-- 3) Policies de storage para el bucket "avatares"
-- ============================================================

-- Cualquiera puede LEER (bucket público). Lo dejamos explícito en
-- una policy para que el comportamiento sea claro y auditable.
drop policy if exists "avatares_lectura_publica" on storage.objects;
create policy "avatares_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'avatares');

-- Solo el dueño puede subir/actualizar/borrar su propio avatar.
-- El path debe arrancar con su uid: "{userId}/...".
drop policy if exists "avatares_escritura_dueno" on storage.objects;
create policy "avatares_escritura_dueno"
  on storage.objects for all
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================
-- FIN
-- ============================================================
-- Verificar:
--   · select column_name from information_schema.columns
--       where table_name='profiles' and column_name='avatar_url';
--   · select id, name, public from storage.buckets where id='avatares';
