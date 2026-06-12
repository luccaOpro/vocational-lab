-- ============================================================
-- MIGRACIÓN 15 · Form "Hablemos" + seguimiento manual del panel
-- ------------------------------------------------------------
-- Por qué: el seguimiento de solicitudes lo hacen Julia y Laura
-- a mano (sin automatización), así que el panel de solicitudes
-- necesita más herramientas:
--
--   1. El form "Hablemos" de la landing (card "Prefiero hablar
--      primero") ahora guarda el MENSAJE que escribe la persona.
--      Revive la intención 'charla' que estaba deprecada: vuelve
--      a usarse, ahora con texto libre.
--   2. Registro de POR DÓNDE se contactó a cada persona (mail /
--      WhatsApp), para poder filtrar en el panel.
--   3. CUÁNDO se la contactó (para la alerta de seguimiento de
--      48 hs de quienes pidieron info y no avanzaron — decisión
--      del doc 11-jun de Julia y Laura).
--   4. Recordatorios manuales ("avisar el día X") por solicitud.
--   5. Notas internas como LISTA con fecha (antes era un único
--      texto en notas_admin). Las notas viejas se migran solas.
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente: se puede correr varias veces.
-- ============================================================


-- ============================================================
-- 1 · Mensaje libre del form "Hablemos" (intencion = 'charla')
-- ============================================================

alter table public.solicitudes_inscripcion
  add column if not exists mensaje text;

comment on column public.solicitudes_inscripcion.mensaje is
  'Texto libre que escribe la persona en el form "Hablemos" de la landing (intencion = charla).';


-- ============================================================
-- 2 · Por dónde se la contactó (lo marca el admin a mano)
-- ============================================================

alter table public.solicitudes_inscripcion
  add column if not exists contactada_por_mail boolean not null default false;

alter table public.solicitudes_inscripcion
  add column if not exists contactada_por_whatsapp boolean not null default false;

comment on column public.solicitudes_inscripcion.contactada_por_mail is
  'true si Julia/Laura ya le escribieron por mail. Lo marcan a mano en el panel.';

comment on column public.solicitudes_inscripcion.contactada_por_whatsapp is
  'true si Julia/Laura ya le escribieron por WhatsApp. Lo marcan a mano en el panel.';


-- ============================================================
-- 3 · Cuándo se la contactó por primera vez
-- ------------------------------------------------------------
-- Lo setea el panel automáticamente la primera vez que la
-- solicitud pasa a "contactada" (o se marca un canal de contacto).
-- Sirve para la alerta de seguimiento a las 48 hs.
-- ============================================================

alter table public.solicitudes_inscripcion
  add column if not exists contactada_en timestamptz;

comment on column public.solicitudes_inscripcion.contactada_en is
  'Primer contacto real con la persona. Base del aviso de seguimiento a las 48 hs.';

-- Cuándo se le hizo el mensaje de seguimiento (apaga la alerta de 48 hs).
alter table public.solicitudes_inscripcion
  add column if not exists seguimiento_hecho_en timestamptz;

comment on column public.solicitudes_inscripcion.seguimiento_hecho_en is
  'Cuándo se le mandó el mensaje de seguimiento. Mientras esté en null y pasen 48 hs del contacto, el panel muestra la alerta.';


-- ============================================================
-- 4 · Recordatorio manual ("avisarme el día X sobre esta persona")
-- ============================================================

alter table public.solicitudes_inscripcion
  add column if not exists recordatorio_en timestamptz;

alter table public.solicitudes_inscripcion
  add column if not exists recordatorio_nota text;

comment on column public.solicitudes_inscripcion.recordatorio_en is
  'Fecha en la que el panel tiene que mostrar el aviso de esta solicitud.';

comment on column public.solicitudes_inscripcion.recordatorio_nota is
  'Qué hay que hacer cuando vence el recordatorio (ej: "ofrecerle el descuento").';


-- ============================================================
-- 5 · Notas internas con fecha (lista, reemplaza a notas_admin)
-- ------------------------------------------------------------
-- Formato: array JSON de objetos { "en": timestamp | null,
-- "texto": string }. Las notas que ya existían en notas_admin se
-- migran como primera entrada SIN fecha (en = null), porque no
-- sabemos cuándo se escribieron. notas_admin queda en la tabla
-- por compatibilidad pero el panel ya no la escribe.
-- ============================================================

alter table public.solicitudes_inscripcion
  add column if not exists notas jsonb not null default '[]'::jsonb;

comment on column public.solicitudes_inscripcion.notas is
  'Notas internas del admin con fecha: [{"en": "2026-06-12T...", "texto": "..."}]. Reemplaza a notas_admin.';

-- Migrar las notas viejas (solo si todavía no se migraron).
update public.solicitudes_inscripcion
set notas = jsonb_build_array(
  jsonb_build_object('en', null, 'texto', notas_admin)
)
where notas_admin is not null
  and trim(notas_admin) <> ''
  and notas = '[]'::jsonb;


-- ============================================================
-- FIN
-- ============================================================
-- Verificar en Table Editor que solicitudes_inscripcion tenga las
-- columnas nuevas: mensaje, contactada_por_mail, contactada_por_whatsapp,
-- contactada_en, recordatorio_en, recordatorio_nota, notas.
