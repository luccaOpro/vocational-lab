-- ============================================================
-- 14 · Email propio del/la menor participante
-- ------------------------------------------------------------
-- Pedido de Julia y Laura (2026-06-11): cuando un adulto inscribe
-- a un menor, el formulario ahora pide también el email del/la
-- participante — es la casilla a la que se le envían las
-- indicaciones de acceso al campus virtual.
--
-- Correr en el SQL Editor de Supabase. Idempotente.
-- ============================================================

alter table public.solicitudes_inscripcion
  add column if not exists email_menor text;

comment on column public.solicitudes_inscripcion.email_menor is
  'Email propio del/la menor participante (acceso al campus). Solo cuando rol_solicitante = responsable_menor.';
