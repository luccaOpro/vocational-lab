-- ============================================================
-- MIGRACIÓN 03 · Auto-inscripción cuando se confirma una transferencia
-- ------------------------------------------------------------
-- Por qué: el flujo de cobro es:
--   1. Alumno paga por transferencia.
--   2. Admin carga la transferencia en el sistema (pendiente).
--   3. Admin confirma → el alumno tiene que tener acceso al curso.
--
-- Si el alumno YA tiene cuenta cuando el admin confirma: el código
-- JS crea la inscripción directamente.
--
-- Si el alumno se registra DESPUÉS de que se le confirmó la
-- transferencia (porque el admin no esperó a que se registrara):
-- el trigger handle_new_user lo detecta acá y crea las inscripciones
-- automáticamente al momento del signup.
--
-- CÓMO APLICARLO:
--   SQL Editor → New query → pegar → Run.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  -- 1) Crear profile (sigue igual que antes).
  insert into public.profiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    'alumno'
  );

  -- 2) Auto-inscripción: si este mail ya tenía transferencias confirmadas
  --    con un curso asociado, le creamos la inscripción activa al toque.
  insert into public.inscripciones (alumno_id, curso_id, activo)
  select new.id, t.curso_id, true
  from public.transferencias t
  where t.alumno_email = new.email
    and t.estado = 'confirmada'
    and t.curso_id is not null
  on conflict (alumno_id, curso_id) do update set activo = true;

  return new;
end;
$func$;
