-- ============================================================
-- 13 · Videos de YouTube/Vimeo en el material del módulo
-- ------------------------------------------------------------
-- PROBLEMA: el panel de contenido ("+ Agregar video") inserta
-- filas en archivos_modulo con tipo = 'youtube', pero el CHECK
-- original de la tabla (migración 01) solo permitía
-- 'pdf' / 'video' / 'audio' / 'link'. Resultado: el INSERT
-- fallaba siempre y el video nunca se agregaba.
--
-- FIX: ampliamos el CHECK para aceptar también 'youtube'.
-- (En esas filas, storage_path guarda la URL del video en vez
-- de una ruta de Storage — no hay archivo físico.)
--
-- Correr en el SQL Editor de Supabase. Es idempotente: se puede
-- correr más de una vez sin romper nada.
-- ============================================================

alter table public.archivos_modulo
  drop constraint if exists archivos_modulo_tipo_check;

alter table public.archivos_modulo
  add constraint archivos_modulo_tipo_check
  check (tipo in ('pdf', 'video', 'audio', 'link', 'youtube'));

comment on column public.archivos_modulo.tipo is
  'pdf / video / audio / link / youtube. En youtube, storage_path es la URL externa.';
