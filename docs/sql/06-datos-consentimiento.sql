-- ============================================================
-- MIGRACIÓN 06 · Datos del consentimiento informado
-- ------------------------------------------------------------
-- Por qué: el protocolo legal aprobado (Protocolo_VL_062026, v1.0)
-- exige, en sus secciones de consentimiento (11 y 12), datos que
-- el form de /inscripcion no estaba pidiendo:
--
--   Mayor de edad  → edad + contacto de emergencia (nombre, tel, vínculo).
--   Menor de edad  → fecha de nacimiento del menor + datos del tutor
--                    (vínculo y DNI) + contacto de emergencia adicional
--                    (opcional, porque el tutor ya es el principal).
--
-- Esta migración suma esas columnas a solicitudes_inscripcion y un
-- constraint que las exige (las obligatorias) cuando la intención es
-- 'inscripcion'. El form valida lo mismo en el cliente; el constraint
-- es el cinturón de seguridad.
--
-- Nota sobre edad_menor: la columna vieja `edad_menor` (int) queda en la
-- tabla pero el form ya NO la escribe — la reemplaza `fecha_nacimiento_menor`,
-- que es lo que pide el documento legal. No la borramos por las dudas; si
-- nunca hubo datos reales, se puede eliminar en una migración futura.
--
-- CÓMO APLICARLO:
--   Dashboard de Supabase → SQL Editor → New query → pegar → Run.
-- Idempotente: se puede correr varias veces.
-- ============================================================


-- ============================================================
-- COLUMNAS NUEVAS
-- ============================================================

alter table public.solicitudes_inscripcion
  add column if not exists edad                          int,
  add column if not exists fecha_nacimiento_menor        date,
  add column if not exists vinculo_menor                 text,
  add column if not exists dni_tutor                     text,
  add column if not exists contacto_emergencia_nombre    text,
  add column if not exists contacto_emergencia_telefono  text,
  add column if not exists contacto_emergencia_vinculo   text;

comment on column public.solicitudes_inscripcion.edad is
  'Edad del participante mayor de edad (rol_solicitante = mayor).';
comment on column public.solicitudes_inscripcion.fecha_nacimiento_menor is
  'Fecha de nacimiento del menor (rol_solicitante = responsable_menor). Reemplaza a edad_menor.';
comment on column public.solicitudes_inscripcion.vinculo_menor is
  'Vínculo del representante legal con el menor (madre, padre, tutor/a…).';
comment on column public.solicitudes_inscripcion.dni_tutor is
  'DNI / documento de identidad del representante legal.';
comment on column public.solicitudes_inscripcion.contacto_emergencia_nombre is
  'Contacto de emergencia: nombre y apellido. Obligatorio para mayores; opcional (adicional) para menores.';
comment on column public.solicitudes_inscripcion.contacto_emergencia_telefono is
  'Contacto de emergencia: teléfono.';
comment on column public.solicitudes_inscripcion.contacto_emergencia_vinculo is
  'Contacto de emergencia: vínculo con el participante.';


-- ============================================================
-- CONSTRAINT · campos obligatorios del consentimiento
-- ------------------------------------------------------------
-- Solo se exige cuando intencion = 'inscripcion'. El resto de las
-- intenciones (info) no completan estos datos, así que quedan libres.
--
--   Mayor              → edad + contacto de emergencia completo.
--   Responsable_menor  → fecha de nacimiento del menor + vínculo + DNI.
--                        El contacto de emergencia es opcional para menores.
--
-- Las solicitudes 'info' y cualquier registro previo a esta migración
-- pasan el check sin problemas (la rama else / distinct devuelve true).
-- ============================================================

alter table public.solicitudes_inscripcion
  drop constraint if exists solicitudes_datos_consentimiento;

alter table public.solicitudes_inscripcion
  add constraint solicitudes_datos_consentimiento check (
    intencion is distinct from 'inscripcion'
    or (
      case rol_solicitante
        when 'mayor' then
          edad is not null
          and edad >= 18
          and contacto_emergencia_nombre is not null   and length(trim(contacto_emergencia_nombre))   > 0
          and contacto_emergencia_telefono is not null and length(trim(contacto_emergencia_telefono)) > 0
          and contacto_emergencia_vinculo is not null  and length(trim(contacto_emergencia_vinculo))  > 0
        when 'responsable_menor' then
          fecha_nacimiento_menor is not null
          and vinculo_menor is not null and length(trim(vinculo_menor)) > 0
          and dni_tutor is not null     and length(trim(dni_tutor))     > 0
        else true
      end
    )
  );


-- ============================================================
-- FIN
-- ============================================================
-- Verificar en Table Editor que solicitudes_inscripcion tenga las
-- columnas nuevas (edad, fecha_nacimiento_menor, vinculo_menor,
-- dni_tutor, contacto_emergencia_*).
