-- ============================================================
-- MIGRACIÓN 12 · Asegurar la tabla site_config (RLS)
-- ------------------------------------------------------------
-- HALLAZGO DE AUDITORÍA (2026-06-16): la tabla site_config se creó
-- a mano desde el dashboard y no tenía migración en el repo. Eso
-- significa que su RLS nunca quedó documentada ni versionada, y no
-- hay garantía de que esté bien configurada.
--
-- Riesgo si la tabla quedó sin RLS o con escritura abierta:
-- cualquiera con la clave pública (que está en el JS del sitio)
-- podría modificar el popup de la home — incluyendo popup_cta_url,
-- que el sitio usa como href. Un atacante podría inyectar un link
-- malicioso visible para todos los visitantes.
--
-- Esta migración deja el estado correcto y versionado:
--   · Crea la tabla si no existiera (idempotente).
--   · RLS activada.
--   · SELECT público (el popup de la home la lee sin login).
--   · INSERT/UPDATE/DELETE solo admin.
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente: se puede correr varias veces.
-- ============================================================


-- ============================================================
-- 1) Tabla (por si no existe — si ya existe no la toca)
-- ============================================================

create table if not exists public.site_config (
  clave           text primary key,
  valor           text not null,
  actualizado_en  timestamptz not null default now()
);

comment on table public.site_config is
  'Configuración editable del sitio público (ej: popup de próxima edición). Lectura pública, escritura solo admin.';


-- ============================================================
-- 2) RLS
-- ============================================================

alter table public.site_config enable row level security;

-- Lectura pública: el popup de la home la lee sin login.
drop policy if exists "site_config_select_publico" on public.site_config;
create policy "site_config_select_publico"
  on public.site_config for select
  to anon, authenticated
  using (true);

-- Escritura solo admin.
drop policy if exists "site_config_write_admin" on public.site_config;
create policy "site_config_write_admin"
  on public.site_config for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
-- 3) Trigger para mantener actualizado_en al día
-- ============================================================

create or replace function public.site_config_touch()
returns trigger
language plpgsql
as $func$
begin
  new.actualizado_en = now();
  return new;
end;
$func$;

drop trigger if exists trg_site_config_touch on public.site_config;
create trigger trg_site_config_touch
  before update on public.site_config
  for each row execute procedure public.site_config_touch();


-- ============================================================
-- FIN
-- ============================================================
-- Verificar (debería fallar si NO sos admin):
--   insert into public.site_config (clave, valor) values ('test', 'x');
-- Verificar lectura anónima (debería andar):
--   select * from public.site_config;
