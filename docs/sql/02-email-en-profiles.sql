-- ============================================================
-- MIGRACIÓN 02 · Agregar email a profiles + actualizar trigger
-- ------------------------------------------------------------
-- Por qué: tener el mail del user en profiles evita tener que
-- joinear con auth.users (que tiene políticas restrictivas).
-- Esto simplifica el panel admin que lista usuarios con sus mails.
--
-- CÓMO APLICARLO:
--   1. SQL Editor → New query → pegar TODO esto → Run.
--   2. Si "Potential issue detected" → Run query (es por los DROPs).
-- ============================================================

-- 1) Sumar columna email a profiles (nullable por compatibilidad).
alter table public.profiles
  add column if not exists email text;

-- 2) Backfill: copiar el email de cada user existente.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- 3) Una vez backfilleado, lo hacemos NOT NULL (a partir de acá nuevos
--    profiles SIEMPRE traen email).
alter table public.profiles
  alter column email set not null;

-- 4) Reescribir el trigger para que copie el email del auth.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  insert into public.profiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    'alumno'
  );
  return new;
end;
$func$;

-- El trigger on_auth_user_created ya está creado, solo cambia la función.
