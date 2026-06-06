-- ============================================================
-- MIGRACIÓN 07 · Correcciones de seguridad (RLS)
-- ------------------------------------------------------------
-- Surge de una auditoría completa de las políticas del aula.
-- Corrige dos cosas:
--
-- 1) CRÍTICO — Escalada de privilegios (auto-ascenso a admin).
--    La política profiles_update_self_o_admin deja que un usuario
--    actualice su propia fila SIN restringir columnas. Eso permitía
--    que cualquier usuario logueado (un alumno) ejecutara desde la
--    consola del navegador:
--        supabase.from('profiles').update({ rol: 'admin' }).eq('id', SU_ID)
--    y se volviera admin → acceso a TODO (datos personales de
--    transferencias y solicitudes, todos los perfiles, etc.).
--    Fix: un trigger BEFORE UPDATE que bloquea el cambio de `rol`
--    salvo que quien lo hace sea admin.
--
-- 2) MEDIO — Material de cursos legible por cualquier logueado.
--    La política de lectura del bucket material-cursos era
--    "cualquier usuario autenticado". Como el path es
--    `cursoId/moduloId/archivo`, ahora la gateamos por pertenencia
--    al curso (admin, profe del curso o alumno inscripto).
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente: se puede correr varias veces.
-- ============================================================


-- ============================================================
-- 1) CRÍTICO · Impedir que un no-admin cambie su propio rol
-- ============================================================

create or replace function public.profiles_guard_rol()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  -- Bloqueamos SOLO cuando el cambio de rol lo hace un usuario final
  -- logueado que no es admin. Dejamos pasar:
  --   · al admin (is_admin() = true), que promueve/degrada desde el panel;
  --   · al dashboard de Supabase / service_role (auth.uid() is null), para
  --     poder crear el primer admin o arreglar roles a mano.
  if (new.rol is distinct from old.rol)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'No tenés permiso para cambiar el rol de un usuario.'
      using errcode = '42501'; -- insufficient_privilege
  end if;
  return new;
end;
$func$;

drop trigger if exists trg_profiles_guard_rol on public.profiles;
create trigger trg_profiles_guard_rol
  before update on public.profiles
  for each row execute procedure public.profiles_guard_rol();

-- Nota: el admin sigue pudiendo promover/degradar usuarios desde el panel
-- (is_admin() = true pasa el chequeo). El trigger solo frena a los no-admin.


-- ============================================================
-- 2) MEDIO · Lectura del bucket material-cursos gateada por curso
-- ============================================================

-- Reemplazamos la política vieja (cualquier autenticado) por una que
-- exige pertenecer al curso. El primer segmento del path es el cursoId.
drop policy if exists "material_lectura_logueados" on storage.objects;
drop policy if exists "material_lectura_por_curso" on storage.objects;

create policy "material_lectura_por_curso"
  on storage.objects for select
  using (
    bucket_id = 'material-cursos'
    and (
      public.is_admin()
      or public.is_profe_de_curso(((storage.foldername(name))[1])::uuid)
      or public.is_alumno_inscripto(((storage.foldername(name))[1])::uuid)
    )
  );

-- La política de escritura (material_escritura_profe_admin) no cambia:
-- subir/borrar sigue siendo solo admin o profe.


-- ============================================================
-- VERIFICACIÓN (opcional, para correr aparte y comprobar)
-- ============================================================
-- Después de aplicar, un usuario NO admin debería recibir un error
-- al intentar cambiarse el rol. Para probarlo, desde la consola del
-- navegador logueado como alumno:
--   await supabase.from('profiles').update({ rol: 'admin' }).eq('id', (await supabase.auth.getUser()).data.user.id)
-- Debe devolver un error (insufficient_privilege), NO actualizar nada.


-- ============================================================
-- FIN
-- ============================================================
