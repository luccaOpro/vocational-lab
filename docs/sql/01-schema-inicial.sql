-- ============================================================
-- ESQUEMA INICIAL · Aula Vocational Lab
-- ------------------------------------------------------------
-- Crea las 9 tablas, sus reglas de seguridad (RLS) y los dos
-- buckets de Storage. Diseñado para Fase 1.
--
-- CÓMO APLICARLO:
--   1. Entrar al dashboard de Supabase del proyecto.
--   2. Menú lateral → SQL Editor → New query.
--   3. Pegar TODO este archivo.
--   4. Click en "Run".
--   5. Verificar que dice "Success. No rows returned" y que en
--      Table Editor aparezcan las nuevas tablas.
--
-- Este script es IDEMPOTENTE: se puede correr varias veces sin
-- romper nada (los "IF NOT EXISTS" y "DROP POLICY IF EXISTS"
-- evitan errores en re-ejecuciones).
-- ============================================================


-- ─── Extensiones ──────────────────────────────────────────────
-- pgcrypto provee gen_random_uuid() para los IDs.
create extension if not exists "pgcrypto";


-- ============================================================
-- TABLAS
-- ============================================================

-- 1. profiles — datos extra del usuario (rol, nombre).
-- Conectado 1-a-1 con auth.users (que maneja login y contraseñas).
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  rol         text not null check (rol in ('alumno', 'profe', 'admin')),
  avatar_url  text,
  creado_en   timestamptz not null default now()
);
comment on table public.profiles is 'Perfil de cada usuario del aula (rol + nombre + avatar).';


-- 2. cursos — cursos publicados.
create table if not exists public.cursos (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  titulo      text not null,
  resumen     text,
  periodo     text,
  publicado   boolean not null default false,
  creado_en   timestamptz not null default now()
);
comment on table public.cursos is 'Cursos publicados (o en borrador) del aula.';


-- 3. cursos_profesores — relación curso ↔ profe (un curso puede tener varios profes).
create table if not exists public.cursos_profesores (
  curso_id     uuid not null references public.cursos(id) on delete cascade,
  profesor_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (curso_id, profesor_id)
);
comment on table public.cursos_profesores is 'Tabla puente: qué profe enseña qué curso.';


-- 4. modulos — bloques dentro de un curso.
create table if not exists public.modulos (
  id           uuid primary key default gen_random_uuid(),
  curso_id     uuid not null references public.cursos(id) on delete cascade,
  numero       int not null,
  titulo       text not null,
  descripcion  text,
  creado_en    timestamptz not null default now(),
  unique (curso_id, numero)
);
comment on table public.modulos is 'Bloques numerados dentro de un curso.';


-- 5. archivos_modulo — material descargable (PDFs, videos, audios).
create table if not exists public.archivos_modulo (
  id             uuid primary key default gen_random_uuid(),
  modulo_id      uuid not null references public.modulos(id) on delete cascade,
  nombre         text not null,
  tipo           text not null check (tipo in ('pdf', 'video', 'audio', 'link')),
  storage_path   text not null,
  peso_kb        int,
  creado_en      timestamptz not null default now()
);
comment on table public.archivos_modulo is 'Archivos del módulo (apuntan a Storage).';


-- 6. tareas — consignas a entregar.
create table if not exists public.tareas (
  id              uuid primary key default gen_random_uuid(),
  modulo_id       uuid not null unique references public.modulos(id) on delete cascade,
  titulo          text not null,
  consigna        text not null,
  fecha_entrega   date,
  creado_en       timestamptz not null default now()
);
comment on table public.tareas is 'Consigna asociada a un módulo (0 o 1 tarea por módulo).';


-- 7. inscripciones — qué alumno está en qué curso.
create table if not exists public.inscripciones (
  id            uuid primary key default gen_random_uuid(),
  alumno_id     uuid not null references public.profiles(id) on delete cascade,
  curso_id      uuid not null references public.cursos(id) on delete cascade,
  inscripto_en  timestamptz not null default now(),
  activo        boolean not null default false,
  unique (alumno_id, curso_id)
);
comment on table public.inscripciones is 'Vínculo alumno ↔ curso. "activo=true" cuando admin confirmó el pago.';


-- 8. entregas — lo que sube el alumno + devolución del profe.
create table if not exists public.entregas (
  id                uuid primary key default gen_random_uuid(),
  tarea_id          uuid not null references public.tareas(id) on delete cascade,
  alumno_id         uuid not null references public.profiles(id) on delete cascade,
  storage_path      text not null,
  archivo_nombre    text not null,
  enviada_en        timestamptz not null default now(),
  nota              text,
  comentario        text,
  corregida_en      timestamptz,
  corregida_por     uuid references public.profiles(id) on delete set null,
  unique (tarea_id, alumno_id)
);
comment on table public.entregas is 'Entrega del alumno + corrección del profe.';


-- 9. transferencias — bandeja de pagos para que admin confirme.
create table if not exists public.transferencias (
  id              uuid primary key default gen_random_uuid(),
  alumno_nombre   text not null,
  alumno_email    text not null,
  monto           text,
  curso_id        uuid references public.cursos(id) on delete set null,
  recibida_en     date,
  estado          text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'rechazada')),
  confirmada_por  uuid references public.profiles(id) on delete set null,
  confirmada_en   timestamptz
);
comment on table public.transferencias is 'Transferencias bancarias por confirmar (gestión admin).';


-- ============================================================
-- FUNCIONES HELPERS
-- ============================================================

-- Devuelve el rol del usuario logueado actual ('alumno', 'profe', 'admin' o null).
create or replace function public.user_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $func$
begin
  return (select rol from public.profiles where id = auth.uid());
end;
$func$;

-- Boolean shortcut: es admin?
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $func$
begin
  return coalesce(
    (select rol = 'admin' from public.profiles where id = auth.uid()),
    false
  );
end;
$func$;

-- Boolean shortcut: es profe del curso indicado?
create or replace function public.is_profe_de_curso(p_curso_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $func$
begin
  return exists (
    select 1 from public.cursos_profesores
    where curso_id = p_curso_id and profesor_id = auth.uid()
  );
end;
$func$;

-- Boolean shortcut: está inscripto activo en el curso?
create or replace function public.is_alumno_inscripto(p_curso_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $func$
begin
  return exists (
    select 1 from public.inscripciones
    where curso_id = p_curso_id and alumno_id = auth.uid() and activo = true
  );
end;
$func$;


-- ============================================================
-- TRIGGER: al crear un user en auth.users → crear su profile
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  insert into public.profiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    'alumno' -- por defecto. Admin lo cambia manualmente para profes.
  );
  return new;
end;
$func$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.cursos              enable row level security;
alter table public.cursos_profesores   enable row level security;
alter table public.modulos             enable row level security;
alter table public.archivos_modulo     enable row level security;
alter table public.tareas              enable row level security;
alter table public.inscripciones       enable row level security;
alter table public.entregas            enable row level security;
alter table public.transferencias      enable row level security;


-- ============================================================
-- POLICIES
-- ============================================================

-- ─── profiles ────────────────────────────────────────────────
drop policy if exists "profiles_select_self_o_admin" on public.profiles;
create policy "profiles_select_self_o_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_o_admin" on public.profiles;
create policy "profiles_update_self_o_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- INSERT lo maneja el trigger.
-- DELETE solo admin (no exponemos policy de delete = nadie puede deletear).
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());


-- ─── cursos ──────────────────────────────────────────────────
drop policy if exists "cursos_select" on public.cursos;
create policy "cursos_select"
  on public.cursos for select
  using (
    public.is_admin()
    or public.is_profe_de_curso(id)
    or public.is_alumno_inscripto(id)
  );

drop policy if exists "cursos_admin_full" on public.cursos;
create policy "cursos_admin_full"
  on public.cursos for all
  using (public.is_admin())
  with check (public.is_admin());


-- ─── cursos_profesores ──────────────────────────────────────
drop policy if exists "cursos_prof_select" on public.cursos_profesores;
create policy "cursos_prof_select"
  on public.cursos_profesores for select
  using (
    public.is_admin()
    or profesor_id = auth.uid()
    or public.is_alumno_inscripto(curso_id)
  );

drop policy if exists "cursos_prof_admin_full" on public.cursos_profesores;
create policy "cursos_prof_admin_full"
  on public.cursos_profesores for all
  using (public.is_admin())
  with check (public.is_admin());


-- ─── modulos ────────────────────────────────────────────────
drop policy if exists "modulos_select" on public.modulos;
create policy "modulos_select"
  on public.modulos for select
  using (
    public.is_admin()
    or public.is_profe_de_curso(curso_id)
    or public.is_alumno_inscripto(curso_id)
  );

drop policy if exists "modulos_profe_admin_write" on public.modulos;
create policy "modulos_profe_admin_write"
  on public.modulos for all
  using (public.is_admin() or public.is_profe_de_curso(curso_id))
  with check (public.is_admin() or public.is_profe_de_curso(curso_id));


-- ─── archivos_modulo ────────────────────────────────────────
drop policy if exists "archivos_select" on public.archivos_modulo;
create policy "archivos_select"
  on public.archivos_modulo for select
  using (
    exists (
      select 1 from public.modulos m
      where m.id = archivos_modulo.modulo_id
      and (
        public.is_admin()
        or public.is_profe_de_curso(m.curso_id)
        or public.is_alumno_inscripto(m.curso_id)
      )
    )
  );

drop policy if exists "archivos_profe_admin_write" on public.archivos_modulo;
create policy "archivos_profe_admin_write"
  on public.archivos_modulo for all
  using (
    exists (
      select 1 from public.modulos m
      where m.id = archivos_modulo.modulo_id
      and (public.is_admin() or public.is_profe_de_curso(m.curso_id))
    )
  )
  with check (
    exists (
      select 1 from public.modulos m
      where m.id = archivos_modulo.modulo_id
      and (public.is_admin() or public.is_profe_de_curso(m.curso_id))
    )
  );


-- ─── tareas ─────────────────────────────────────────────────
drop policy if exists "tareas_select" on public.tareas;
create policy "tareas_select"
  on public.tareas for select
  using (
    exists (
      select 1 from public.modulos m
      where m.id = tareas.modulo_id
      and (
        public.is_admin()
        or public.is_profe_de_curso(m.curso_id)
        or public.is_alumno_inscripto(m.curso_id)
      )
    )
  );

drop policy if exists "tareas_profe_admin_write" on public.tareas;
create policy "tareas_profe_admin_write"
  on public.tareas for all
  using (
    exists (
      select 1 from public.modulos m
      where m.id = tareas.modulo_id
      and (public.is_admin() or public.is_profe_de_curso(m.curso_id))
    )
  )
  with check (
    exists (
      select 1 from public.modulos m
      where m.id = tareas.modulo_id
      and (public.is_admin() or public.is_profe_de_curso(m.curso_id))
    )
  );


-- ─── inscripciones ──────────────────────────────────────────
drop policy if exists "inscripciones_select" on public.inscripciones;
create policy "inscripciones_select"
  on public.inscripciones for select
  using (alumno_id = auth.uid() or public.is_admin() or public.is_profe_de_curso(curso_id));

drop policy if exists "inscripciones_admin_full" on public.inscripciones;
create policy "inscripciones_admin_full"
  on public.inscripciones for all
  using (public.is_admin())
  with check (public.is_admin());


-- ─── entregas ───────────────────────────────────────────────
drop policy if exists "entregas_select" on public.entregas;
create policy "entregas_select"
  on public.entregas for select
  using (
    alumno_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.tareas t
      join public.modulos m on m.id = t.modulo_id
      where t.id = entregas.tarea_id
      and public.is_profe_de_curso(m.curso_id)
    )
  );

-- El alumno solo puede insertar entregas si es de un curso donde está inscripto.
drop policy if exists "entregas_alumno_insert" on public.entregas;
create policy "entregas_alumno_insert"
  on public.entregas for insert
  with check (
    alumno_id = auth.uid()
    and exists (
      select 1 from public.tareas t
      join public.modulos m on m.id = t.modulo_id
      where t.id = tarea_id and public.is_alumno_inscripto(m.curso_id)
    )
  );

-- Alumno puede actualizar su propia entrega solo si no fue corregida aún.
drop policy if exists "entregas_alumno_update" on public.entregas;
create policy "entregas_alumno_update"
  on public.entregas for update
  using (alumno_id = auth.uid() and corregida_en is null)
  with check (alumno_id = auth.uid() and corregida_en is null);

-- Profes y admin pueden corregir.
drop policy if exists "entregas_profe_corregir" on public.entregas;
create policy "entregas_profe_corregir"
  on public.entregas for update
  using (
    public.is_admin()
    or exists (
      select 1 from public.tareas t
      join public.modulos m on m.id = t.modulo_id
      where t.id = entregas.tarea_id and public.is_profe_de_curso(m.curso_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.tareas t
      join public.modulos m on m.id = t.modulo_id
      where t.id = entregas.tarea_id and public.is_profe_de_curso(m.curso_id)
    )
  );


-- ─── transferencias ─────────────────────────────────────────
-- Solo admin ve y maneja transferencias.
drop policy if exists "transferencias_admin" on public.transferencias;
create policy "transferencias_admin"
  on public.transferencias for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Bucket privado para material que sube el profe.
insert into storage.buckets (id, name, public)
values ('material-cursos', 'material-cursos', false)
on conflict (id) do nothing;

-- Bucket privado para archivos que sube el alumno como entrega.
insert into storage.buckets (id, name, public)
values ('entregas-alumnos', 'entregas-alumnos', false)
on conflict (id) do nothing;


-- ─── Policies de storage ────────────────────────────────────
-- material-cursos:
--   · profes y admin pueden subir/borrar
--   · todo usuario logueado puede leer (las RLS de las tablas filtran qué archivos puede ver)

drop policy if exists "material_lectura_logueados" on storage.objects;
create policy "material_lectura_logueados"
  on storage.objects for select
  using (bucket_id = 'material-cursos' and auth.role() = 'authenticated');

drop policy if exists "material_escritura_profe_admin" on storage.objects;
create policy "material_escritura_profe_admin"
  on storage.objects for all
  using (
    bucket_id = 'material-cursos'
    and (public.is_admin() or public.user_role() = 'profe')
  )
  with check (
    bucket_id = 'material-cursos'
    and (public.is_admin() or public.user_role() = 'profe')
  );

-- entregas-alumnos:
--   · alumno puede subir/leer/actualizar sus propios archivos (carpeta = su uid)
--   · profe + admin pueden leer todos

drop policy if exists "entregas_alumno_dueño" on storage.objects;
create policy "entregas_alumno_dueño"
  on storage.objects for all
  using (
    bucket_id = 'entregas-alumnos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'entregas-alumnos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entregas_lectura_profe_admin" on storage.objects;
create policy "entregas_lectura_profe_admin"
  on storage.objects for select
  using (
    bucket_id = 'entregas-alumnos'
    and (public.is_admin() or public.user_role() = 'profe')
  );


-- ============================================================
-- FIN
-- ============================================================
-- Listo. Verificar en Table Editor que aparezcan las 9 tablas.
