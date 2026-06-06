-- ============================================================
-- MIGRACIÓN 09 · Profe ve por entrega + admin puede borrar usuarios
-- ------------------------------------------------------------
-- Dos cosas:
--
-- 1) Arregla "(alumno desconocido)" en el panel de profe. La 08 dejaba
--    ver al alumno solo si tenía INSCRIPCIÓN activa en el curso del profe.
--    Pero un profe puede estar viendo la ENTREGA de alguien que (por data
--    incompleta o flujo distinto) no tiene la inscripción cargada. Ahora
--    el profe ve el perfil de cualquier alumno que tenga una entrega en
--    un curso que él dicta (además del caso de inscripción activa).
--
-- 2) Permite que un admin elimine un usuario por completo (cuenta + todo
--    lo asociado), vía una función admin_delete_user con chequeo de rol.
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente.
-- ============================================================


-- ============================================================
-- 1) is_profe_de_alumno: sumar el caso "tiene entrega en mi curso"
-- ============================================================

create or replace function public.is_profe_de_alumno(p_alumno_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $func$
begin
  return exists (
    -- a) inscripto activo en un curso del profe
    select 1
    from public.inscripciones i
    join public.cursos_profesores cp on cp.curso_id = i.curso_id
    where i.alumno_id = p_alumno_id
      and i.activo = true
      and cp.profesor_id = auth.uid()
  ) or exists (
    -- b) tiene una entrega en un curso del profe
    select 1
    from public.entregas e
    join public.tareas t   on t.id = e.tarea_id
    join public.modulos m  on m.id = t.modulo_id
    join public.cursos_profesores cp on cp.curso_id = m.curso_id
    where e.alumno_id = p_alumno_id
      and cp.profesor_id = auth.uid()
  );
end;
$func$;

-- La policy profiles_select (migración 08) ya usa esta función, no hay que tocarla.


-- ============================================================
-- 2) admin_delete_user: borrar un usuario por completo
-- ------------------------------------------------------------
-- Borra de auth.users; gracias a los ON DELETE CASCADE, se llevan también
-- el profile, sus entregas, inscripciones, etc. SECURITY DEFINER para
-- poder tocar el schema auth; el chequeo is_admin() asegura que solo un
-- admin pueda ejecutarla. No se puede auto-eliminar.
-- ============================================================

create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $func$
begin
  if not public.is_admin() then
    raise exception 'Solo un admin puede eliminar usuarios.' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'No podés eliminarte a vos mismo.' using errcode = '42501';
  end if;

  delete from auth.users where id = p_user_id;
end;
$func$;

-- Que solo usuarios logueados puedan invocarla (igual el is_admin() la blinda).
revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;


-- ============================================================
-- FIN
-- ============================================================
