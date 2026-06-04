-- ============================================================
-- MIGRACIÓN 05 · Canal preferido de respuesta
-- ------------------------------------------------------------
-- Por qué: el equipo (Julia/Laura/Marta) responde tanto por
-- WhatsApp como por mail. Para no molestar al inscripto por el
-- canal equivocado, le preguntamos en el form cómo prefiere
-- que lo contactemos.
--
-- Si elige 'whatsapp', el teléfono se vuelve obligatorio
-- (la lógica del form lo valida en cliente; este constraint
-- es el cinturón de seguridad por si llega algo desde otro lado).
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente: se puede correr varias veces.
-- ============================================================


-- Sumamos la columna. Nullable porque solicitudes anteriores no
-- la tienen — solo se exige a partir de ahora vía la validación
-- del cliente. Si en algún momento queremos hacer todos los
-- registros nuevos obligatorios, agregamos NOT NULL en otra
-- migración una vez que estén las solicitudes antiguas migradas.
alter table public.solicitudes_inscripcion
  add column if not exists canal_preferido_respuesta text
  check (canal_preferido_respuesta in ('mail', 'whatsapp'));

comment on column public.solicitudes_inscripcion.canal_preferido_respuesta is
  'Por dónde prefiere ser contactado el inscripto: mail | whatsapp.';


-- Constraint adicional: si canal_preferido_respuesta = whatsapp,
-- el teléfono no puede ser NULL (sino no podemos contactarlo
-- por ese canal).
alter table public.solicitudes_inscripcion
  drop constraint if exists solicitudes_telefono_para_whatsapp;

alter table public.solicitudes_inscripcion
  add constraint solicitudes_telefono_para_whatsapp check (
    canal_preferido_respuesta is null
    or canal_preferido_respuesta = 'mail'
    or (canal_preferido_respuesta = 'whatsapp' and telefono is not null and length(trim(telefono)) > 0)
  );


-- ============================================================
-- FIN
-- ============================================================
