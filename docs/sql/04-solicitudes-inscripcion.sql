-- ============================================================
-- MIGRACIÓN 04 · Solicitudes de inscripción + bucket protocolos
-- ------------------------------------------------------------
-- Por qué: hasta ahora el aula tenía "inscripciones" (que vincula
-- alumno↔curso DESPUÉS del pago) y "transferencias" (bandeja
-- manual del admin). Faltaba la pieza ANTES del pago: el
-- formulario público de /inscripcion (y las otras dos intenciones
-- "Quiero más info" y "Prefiero hablar primero") que entran por
-- los 3 canales (web, whatsapp, instagram).
--
-- Esta tabla guarda esa solicitud + el registro de aceptación del
-- protocolo (cuando aplica). Es la entrada del embudo. Cuando la
-- persona efectivamente paga, el admin la convierte en una
-- "transferencia" → que termina creando user + profile + inscripción.
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente: se puede correr varias veces.
-- ============================================================


-- ============================================================
-- TABLA · solicitudes_inscripcion
-- ============================================================

create table if not exists public.solicitudes_inscripcion (
  id                        uuid primary key default gen_random_uuid(),
  creado_en                 timestamptz not null default now(),

  -- De dónde viene y qué quiere
  canal                     text not null check (canal in ('web', 'whatsapp', 'instagram', 'otro')),
  intencion                 text not null check (intencion in ('info', 'inscripcion', 'charla')),

  -- Datos de contacto básicos (siempre obligatorios)
  nombre                    text not null,
  email                     text not null,
  telefono                  text,
  pais                      text,
  como_nos_encontraste      text,

  -- Solo cuando intencion = 'inscripcion'
  rol_solicitante           text check (rol_solicitante in ('mayor', 'responsable_menor')),
  nombre_menor              text,
  edad_menor                int,

  -- Registro de aceptación del protocolo (solo en intencion = 'inscripcion')
  protocolo_aceptado        boolean,
  protocolo_version         text,
  protocolo_aceptado_en     timestamptz,
  user_agent                text,

  -- Gestión interna (solo el admin lo modifica)
  estado                    text not null default 'nueva'
                            check (estado in ('nueva', 'contactada', 'convertida', 'descartada')),
  curso_id                  uuid references public.cursos(id) on delete set null,
  notas_admin               text
);

comment on table public.solicitudes_inscripcion is
  'Solicitudes públicas que entran por el form de /inscripcion o por el form web simplificado. Incluyen el registro de aceptación del protocolo cuando la intención es "inscripcion".';

-- Índices para consultas típicas del admin
create index if not exists idx_solicitudes_creado_en
  on public.solicitudes_inscripcion (creado_en desc);

create index if not exists idx_solicitudes_estado
  on public.solicitudes_inscripcion (estado);

create index if not exists idx_solicitudes_email
  on public.solicitudes_inscripcion (email);


-- ============================================================
-- RLS · solo admin lee/modifica; cualquiera (anon) puede crear
-- ============================================================

alter table public.solicitudes_inscripcion enable row level security;

-- INSERT abierto: cualquiera puede crear una solicitud sin estar logueado.
-- (Esto es lo que permite que el form público funcione.)
drop policy if exists "solicitudes_insert_publico" on public.solicitudes_inscripcion;
create policy "solicitudes_insert_publico"
  on public.solicitudes_inscripcion for insert
  to anon, authenticated
  with check (true);

-- SELECT solo admin.
drop policy if exists "solicitudes_select_admin" on public.solicitudes_inscripcion;
create policy "solicitudes_select_admin"
  on public.solicitudes_inscripcion for select
  using (public.is_admin());

-- UPDATE solo admin (para cambiar estado, agregar notas, vincular a curso).
drop policy if exists "solicitudes_update_admin" on public.solicitudes_inscripcion;
create policy "solicitudes_update_admin"
  on public.solicitudes_inscripcion for update
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE solo admin.
drop policy if exists "solicitudes_delete_admin" on public.solicitudes_inscripcion;
create policy "solicitudes_delete_admin"
  on public.solicitudes_inscripcion for delete
  using (public.is_admin());


-- ============================================================
-- VALIDACIÓN · coherencia de datos según la intención
-- ------------------------------------------------------------
-- Si la intención es "inscripcion": rol_solicitante, protocolo_*
-- son obligatorios. Si es responsable_menor: nombre_menor también.
-- Hacemos esto con un constraint en vez de un trigger porque es
-- más simple y deja la lógica visible en el schema.
-- ============================================================

alter table public.solicitudes_inscripcion
  drop constraint if exists solicitudes_coherencia_inscripcion;

alter table public.solicitudes_inscripcion
  add constraint solicitudes_coherencia_inscripcion check (
    case
      when intencion = 'inscripcion' then
        rol_solicitante is not null
        and protocolo_aceptado = true
        and protocolo_version is not null
        and protocolo_aceptado_en is not null
        and (
          rol_solicitante = 'mayor'
          or (rol_solicitante = 'responsable_menor' and nombre_menor is not null)
        )
      else true
    end
  );


-- ============================================================
-- BUCKET · protocolos (PDFs versionados, lectura pública)
-- ------------------------------------------------------------
-- El PDF del protocolo tiene que ser linkeable desde el form
-- público (alguien no logueado tiene que poder abrirlo antes
-- de aceptar). Por eso el bucket es público para lectura.
-- Subir/borrar archivos sigue siendo solo admin.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('protocolos', 'protocolos', true)
on conflict (id) do update set public = true;

-- Lectura pública (anónimos también).
drop policy if exists "protocolos_lectura_publica" on storage.objects;
create policy "protocolos_lectura_publica"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'protocolos');

-- Escritura solo admin.
drop policy if exists "protocolos_escritura_admin" on storage.objects;
create policy "protocolos_escritura_admin"
  on storage.objects for all
  using (bucket_id = 'protocolos' and public.is_admin())
  with check (bucket_id = 'protocolos' and public.is_admin());


-- ============================================================
-- FIN
-- ============================================================
-- Verificar en Table Editor que aparezca solicitudes_inscripcion.
-- Verificar en Storage que aparezca el bucket "protocolos".
-- Subir manualmente el primer PDF como "protocolo-v1.pdf".
