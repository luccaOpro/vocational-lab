-- ============================================================
-- MIGRACIÓN 11 · Llenar el perfil del aula (bio, país, ciudad, intereses)
-- ------------------------------------------------------------
-- El perfil de cualquier rol (protagonista, profe, admin) tenía
-- solo nombre + mail + rol + fecha de alta. Lucas pidió sumar
-- info que ayude a generar comunidad sin pedir datos sensibles.
--
-- Qué hace:
--   1) Agrega columnas a profiles:
--        · bio        — texto libre, hasta 280 caracteres
--        · pais       — texto libre, hasta 40 chars
--        · ciudad     — texto libre, hasta 60 chars
--        · intereses  — text[] (array), max 10 elementos
--   2) Validaciones por CHECK constraint para los largos / cantidad.
--   3) Comments para la documentación viva del schema.
--
-- Las 4 columnas son nullable: el perfil arranca vacío y el
-- usuario decide qué llenar. Nada es obligatorio.
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente: se puede correr varias veces.
-- ============================================================


-- ============================================================
-- 1) Nuevas columnas
-- ============================================================

alter table public.profiles
  add column if not exists bio       text,
  add column if not exists pais      text,
  add column if not exists ciudad    text,
  add column if not exists intereses text[];


-- ============================================================
-- 2) Validaciones de largo / cantidad
-- ------------------------------------------------------------
-- Hechas con CHECK para no depender de validación del cliente.
-- Si el constraint ya existe, lo dropeamos y lo recreamos por
-- idempotencia.
-- ============================================================

alter table public.profiles
  drop constraint if exists profiles_bio_largo;
alter table public.profiles
  add constraint profiles_bio_largo
    check (bio is null or char_length(bio) <= 280);

alter table public.profiles
  drop constraint if exists profiles_pais_largo;
alter table public.profiles
  add constraint profiles_pais_largo
    check (pais is null or char_length(pais) <= 40);

alter table public.profiles
  drop constraint if exists profiles_ciudad_largo;
alter table public.profiles
  add constraint profiles_ciudad_largo
    check (ciudad is null or char_length(ciudad) <= 60);

alter table public.profiles
  drop constraint if exists profiles_intereses_cantidad;
alter table public.profiles
  add constraint profiles_intereses_cantidad
    check (
      intereses is null
      or (
        array_length(intereses, 1) <= 10
        and not exists (
          select 1 from unnest(intereses) as i
          where char_length(i) > 30 or char_length(trim(i)) = 0
        )
      )
    );


-- ============================================================
-- 3) Comments
-- ============================================================

comment on column public.profiles.bio is
  'Mini biografía libre del usuario (hasta 280 chars). Aparece en su perfil del aula. Null si todavía no lo completó.';
comment on column public.profiles.pais is
  'País de residencia del usuario (texto libre, hasta 40 chars).';
comment on column public.profiles.ciudad is
  'Ciudad / localidad de residencia (texto libre, hasta 60 chars).';
comment on column public.profiles.intereses is
  'Tags libres de intereses del usuario (max 10, cada uno hasta 30 chars). Útil para vinculación grupal.';


-- ============================================================
-- FIN
-- ============================================================
-- Verificar:
--   · select column_name, data_type from information_schema.columns
--       where table_name='profiles' and column_name in
--       ('bio','pais','ciudad','intereses');
