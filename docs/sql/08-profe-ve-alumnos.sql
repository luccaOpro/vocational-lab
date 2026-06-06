-- ============================================================
-- MIGRACIÓN 08 · Un profe puede ver el perfil de sus alumnos
-- ------------------------------------------------------------
-- Problema (funcional, no de seguridad): la política profiles_select
-- solo dejaba ver el propio perfil o (si sos admin) todos. Un profe NO
-- podía ver el perfil de sus alumnos, así que en /aula/profe/entregas
-- aparecía "(alumno)" en lugar del nombre real.
--
-- Fix: un profe puede VER (solo lectura, no modificar) el perfil de los
-- alumnos que están activos en cursos que él dicta. No expone perfiles de
-- otros profes/admins ni de alumnos de otros cursos.
--
-- Es una ampliación de lectura acotada y de bajo riesgo: la UPDATE/DELETE
-- de profiles no cambian, y el cruce se hace con un helper SECURITY DEFINER
-- (mismo patrón que is_profe_de_curso / is_alumno_inscripto) para evitar
-- recursión de RLS entre tablas.
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente: se puede correr varias veces.
-- ============================================================


-- Helper: ¿el usuario logueado es profe de algún curso donde este alumno
-- está inscripto y activo?
create or replace function public.is_profe_de_alumno(p_alumno_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $func$
begin
  return exists (
    select 1
    from public.inscripciones i
    join public.cursos_profesores cp on cp.curso_id = i.curso_id
    where i.alumno_id = p_alumno_id
      and i.activo = true
      and cp.profesor_id = auth.uid()
  );
end;
$func$;


-- Reescribimos la policy de SELECT de profiles sumando el caso del profe.
drop policy if exists "profiles_select_self_o_admin" on public.profiles;
create policy "profiles_select_self_o_admin"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    or public.is_profe_de_alumno(id)
  );

-- Nota: las políticas de UPDATE y DELETE de profiles NO cambian. El profe
-- gana solo lectura; no puede modificar perfiles ajenos.


-- ============================================================
-- FIN
-- ============================================================
-- Verificar: logueado como un profe, en /aula/profe/entregas las entregas
-- de sus cursos deberían mostrar el nombre real del alumno (no "(alumno)").
