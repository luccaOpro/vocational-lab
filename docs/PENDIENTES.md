# Pendientes del classroom

> Cómo usar este archivo: cada ítem tiene `[ ]` cuando está pendiente y `[x]` cuando está hecho. Actualizamos a medida que avanzamos.
> Última actualización: 2026-06-12 — form "Hablemos" en la landing + panel de solicitudes renovado (búsqueda, filtros de contacto, notas con fecha, avisos y seguimiento de 48 hs). Suma dos pasos al checklist de lanzamiento: migración 15 y re-deploy de la Edge Function.

## Para lanzar (en orden sugerido)

- [ ] **Testing manual del flujo completo** con datos de prueba: alguien completa `/inscripcion` → la solicitud aparece en `/aula/admin/solicitudes` → admin registra la transferencia y crea/inscribe al alumno → el alumno entra al aula, descarga material y sube una entrega → el profe corrige (nota + comentario) → el alumno ve la devolución. Es el último pendiente real de Fase 1: el aula está construida pero nunca se recorrió de punta a punta.
- [ ] **Confirmar que las migraciones `docs/sql/01` a `12` están corridas en Supabase.** Este archivo tenía la 06 marcada como crítica sin correr; como después se aplicaron la 07 a la 12 y el aula funciona, casi seguro están todas — pero hay que confirmarlo y tildar. Chequeo rápido: en Table Editor, `solicitudes_inscripcion` tiene que tener las columnas del consentimiento (edad, fecha de nacimiento del menor, vínculo, DNI del tutor, contacto de emergencia).
- [ ] **Correr la migración `docs/sql/13-video-youtube-en-modulos.sql`** en el SQL Editor de Supabase. Sin esto, "+ Agregar video" en el contenido de un curso falla siempre (el CHECK de `archivos_modulo.tipo` no aceptaba `youtube`). Con la 13 corrida, el video se agrega y el protagonista lo reproduce embebido en el aula.
- [ ] **Correr la migración `docs/sql/14-email-del-menor.sql`** en el SQL Editor de Supabase. El form ahora pide el email propio del/la menor (para enviarle el acceso al campus); sin la columna `email_menor` en la base, el envío del formulario de inscripción de menores FALLA. Correr antes del lanzamiento del lunes 15.
- [ ] **Correr la migración `docs/sql/15-hablemos-y-seguimiento.sql`** en el SQL Editor de Supabase. Sin esto: (a) el form "Hablemos" de la landing FALLA al enviar (no existe la columna `mensaje`), y (b) las herramientas nuevas del panel de solicitudes (contacto por mail/WhatsApp, recordatorios, notas con fecha, seguimiento 48 hs) no pueden guardar. Correr ANTES de pushear el código nuevo a producción.
- [ ] **Flujo de contactos (doc 11-jun de Julia y Laura)** — decisiones y tareas que quedaron registradas: (1) ~~seguimiento a las 48 hs de quienes pidieron info y no avanzaron~~ → HECHO 2026-06-12: el panel de solicitudes lo avisa solo (requiere migración 15); (2) mail "te enviamos datos para pago" al inscribirse + mails BIENVENIDA (al participante) y FAMILIA (al adulto) tras confirmar el pago — parcialmente cubierto por los pendientes de mails de más abajo; (3) ~~texto base de respuesta para "prefiero hablar primero" (mail y WhatsApp)~~ → HECHO 2026-06-12: botones "Escribir por mail" / "Escribir por WhatsApp" del panel abren el mensaje ya redactado (Julia y Laura pueden pedir ajustar los textos); (4) decisión pendiente sobre cuándo entra el WhatsApp de Vlab (nota 1 del doc); (5) firma de correo en `hola@vlab.com.ar` (se configura en cPanel/webmail, no en el repo); (6) planilla de control de pagos y base de seguimiento de participantes; (7) form + links de Zoom para las charlas informativas de la semana del 22.
- [ ] **SMTP propio para los mails de Supabase** (recuperar contraseña, invitaciones). Hoy salen por el SMTP default de Supabase: ~2-4 mails por hora y remitente genérico — no alcanza con alumnos reales. Candidatos: Resend (plan gratis) o la casilla de cPanel de `vlab.com.ar`. Ojo: esto no es lo mismo que los mails automáticos de confirmación (eso sigue pateado a propósito, ver más abajo).
- [ ] **Subir la ficha del próximo grupo** (PDF con fechas, valores y modalidades de pago) a `public/descargas/ficha-proximo-grupo.pdf` — con ese nombre exacto. El botón "Descargar la ficha" al final de `/dossier` ya apunta ahí; hasta que el archivo exista, da 404 (los botones de WhatsApp y mail del mismo bloque sí funcionan).
- [ ] **Re-deployar la Edge Function `enviar-mail-solicitud`** en Supabase: (a) el mail W1A ahora lleva el botón al dossier web, y (b) se sumó el aviso interno del form "Hablemos" (el mensaje de la persona llega a `hola@vlab.com.ar` con reply-to). Pasos en `docs/MAILS-AUTOMATICOS.md` → "Cómo actualizar la función".
- [ ] Documento "cómo se usa el aula" para Julia y Laura.
- [ ] Documento "cómo se usa el aula" para los alumnos.
- [ ] Que Julia y Laura revisen el texto del checkbox ("He leído y acepto el Protocolo del programa.") por si prefieren otra redacción.

## Después del lanzamiento / cuando haga falta

- [x] **Mail automático de respuesta al inscripto** (hecho 2026-06-10): cuando alguien manda `/inscripcion` le llega solo el mail que corresponde (W1A "más info" / W1B "anotarme") desde `hola@vlab.com.ar`. Implementado con la Edge Function `enviar-mail-solicitud` + un Database Webhook sobre `solicitudes_inscripcion`. Ver `docs/MAILS-AUTOMATICOS.md`.
- [ ] Mails automáticos que faltan (reusar la misma función): aviso al admin cuando entra una solicitud, y los mails BIENVENIDA / FAMILIA al confirmar el pago por transferencia. Ojo: los textos del documento Carril E que mencionan "link de pago" hay que pasarlos a "transferencia".
- [ ] Seguridad nivel siguiente del form: captcha (Cloudflare Turnstile) o rate-limit por IP vía Edge Function, si el honeypot deja de alcanzar.
- [ ] Trackeo de canal: links de WhatsApp/Instagram apuntando a `/inscripcion?canal=whatsapp` y `?canal=instagram` para registrar el origen.
- [ ] (Opcional) Redactar el documento separado de Términos y Condiciones (precio, pago, cancelación) que el propio protocolo recomienda.
- [x] Automatización del formulario de contacto (resuelto 2026-06-12 por otro camino que el plan de 3 capas, que queda descartado): el form "Hablemos" de la landing guarda en Supabase y reenvía el mensaje a `hola@vlab.com.ar` vía la Edge Function. La capa WhatsApp sigue siendo decisión pendiente del doc 11-jun.
- [ ] Si Julia y Laura lo prefieren: reemplazar los domicilios particulares del protocolo por un domicilio único de contacto (hoy la página está protegida con `noindex`, ver "Hecho").
- [ ] (Limpieza opcional) Borrar el bucket `protocolos` de Supabase Storage: quedó creado pero no se usa desde que el protocolo es HTML embebido.

## Fase 2 — V2 (para después)

- [ ] Foros por curso
- [ ] Mensajería profe ↔ alumno
- [ ] Notificaciones por mail (nueva entrega, nueva devolución)
- [ ] Anuncios / tablón del curso
- [ ] Calendario de fechas de entrega
- [ ] PWA (app móvil)

## Hecho

### Sitio público e inscripción

- [x] Página `/inscripcion` unificada (los 3 canales redirigen ahí) con consentimiento completo: flujo mayor/menor de 18, datos del tutor, validaciones estrictas con scroll al error
- [x] Protocolo legal v1 (Protocolo_VL_062026) transcripto en `src/components/ProtocoloContenido.astro`; `PROTOCOLO_VERSION_ACTUAL = "v1"` en `inscripcion.astro`
- [x] `/protocolo` con `noindex` + excluida del sitemap + `Disallow` en robots.txt — tiene CUILs y domicilios de Julia y Laura, accesible por link pero no indexada
- [x] Anti-spam del form: honeypot + tiempo mínimo (2026-06-06)
- [x] Imagen OG real (1200×630, ícono del logo sobre crema de marca) y dominio `vlab.com.ar` unificado en `Layout.astro`, `astro.config.mjs` y `robots.txt`
- [x] Accesibilidad del sitio público: foco de teclado, skip link, nav inerte
- [x] Feedback de Julia del 2026-06-07 aplicado (copys, ítems, bug del legend del Protocolo)

### Setup técnico

- [x] Git + GitHub configurados, auto-deploy a Cloudflare Pages (`vocational-lab.pages.dev` → `vlab.com.ar`)
- [x] Esquema de la base diseñado → `docs/SCHEMA.md`
- [x] Cuenta y proyecto de Supabase creados; 12 migraciones SQL escritas en `docs/sql/`
- [x] Cliente de Supabase configurado en el proyecto (`src/lib/supabase.ts`), credenciales en `.env`

### Aula — Fase 1 construida (falta solo el test de punta a punta)

- [x] **Autenticación**: login con mail + contraseña, "olvidé mi contraseña" (mail de recuperación), cerrar sesión, recordar sesión. Guards por rol en el cliente (UX) + RLS de Supabase como seguridad real, incluido el fix de escalada de rol (migración 07)
- [x] **Alumno**: `/aula/mis-cursos`, vista del curso con módulos y materiales descargables, subida de entregas con drag&drop, estado de la entrega y devolución del profe (nota + comentario). Perfil con foto (modal de recorte), bio, país, ciudad e intereses
- [x] **Profe**: lista de entregas pendientes, corrección con nota + comentario, ve los perfiles de sus alumnos (migraciones 08/09), sube material a sus cursos (dropzones)
- [x] **Admin**: dashboard con KPIs, panel de solicitudes (filtros por estado, notas internas, resumen por canal, eliminar spam), transferencias con auto-inscripción al confirmar (migración 03), gestión de usuarios (alta de alumnos y profes, eliminar), gestión de cursos (crear/editar, asignar profes, inscribir protagonistas, cargar contenido), configuración del sitio (migración 12)
- [x] `/aula` con redirect inteligente según rol, avatar en el nav, skeletons de carga, tablas adaptadas a móvil

> Nota sobre el plan original: la **creación y edición de cursos quedó del lado del rol admin** (`/aula/admin/cursos`), no del profe como decía el plan. El profe asignado a un curso corrige entregas y sube material; el alta del curso la hace quien tenga rol admin.
