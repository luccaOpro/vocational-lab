# Pendientes del classroom

> Cómo usar este archivo: cada ítem tiene `[ ]` cuando está pendiente y `[x]` cuando está hecho. Actualizamos a medida que avanzamos.
> Última actualización: 2026-06-10 — puesta al día general: el código avanzó más rápido que este archivo, así que tildamos todo lo ya construido (ver "Hecho" al final) y reordenamos lo que queda según prioridad de lanzamiento.

## Para lanzar (en orden sugerido)

- [ ] **Testing manual del flujo completo** con datos de prueba: alguien completa `/inscripcion` → la solicitud aparece en `/aula/admin/solicitudes` → admin registra la transferencia y crea/inscribe al alumno → el alumno entra al aula, descarga material y sube una entrega → el profe corrige (nota + comentario) → el alumno ve la devolución. Es el último pendiente real de Fase 1: el aula está construida pero nunca se recorrió de punta a punta.
- [ ] **Confirmar que las migraciones `docs/sql/01` a `12` están corridas en Supabase.** Este archivo tenía la 06 marcada como crítica sin correr; como después se aplicaron la 07 a la 12 y el aula funciona, casi seguro están todas — pero hay que confirmarlo y tildar. Chequeo rápido: en Table Editor, `solicitudes_inscripcion` tiene que tener las columnas del consentimiento (edad, fecha de nacimiento del menor, vínculo, DNI del tutor, contacto de emergencia).
- [ ] **SMTP propio para los mails de Supabase** (recuperar contraseña, invitaciones). Hoy salen por el SMTP default de Supabase: ~2-4 mails por hora y remitente genérico — no alcanza con alumnos reales. Candidatos: Resend (plan gratis) o la casilla de cPanel de `vlab.com.ar`. Ojo: esto no es lo mismo que los mails automáticos de confirmación (eso sigue pateado a propósito, ver más abajo).
- [ ] Documento "cómo se usa el aula" para Julia y Laura.
- [ ] Documento "cómo se usa el aula" para los alumnos.
- [ ] Que Julia y Laura revisen el texto del checkbox ("He leído y acepto el Protocolo del programa.") por si prefieren otra redacción.

## Después del lanzamiento / cuando haga falta

- [x] **Mail automático de respuesta al inscripto** (hecho 2026-06-10): cuando alguien manda `/inscripcion` le llega solo el mail que corresponde (W1A "más info" / W1B "anotarme") desde `hola@vlab.com.ar`. Implementado con la Edge Function `enviar-mail-solicitud` + un Database Webhook sobre `solicitudes_inscripcion`. Ver `docs/MAILS-AUTOMATICOS.md`.
- [ ] Mails automáticos que faltan (reusar la misma función): aviso al admin cuando entra una solicitud, y los mails BIENVENIDA / FAMILIA al confirmar el pago por transferencia. Ojo: los textos del documento Carril E que mencionan "link de pago" hay que pasarlos a "transferencia".
- [ ] Seguridad nivel siguiente del form: captcha (Cloudflare Turnstile) o rate-limit por IP vía Edge Function, si el honeypot deja de alcanzar.
- [ ] Trackeo de canal: links de WhatsApp/Instagram apuntando a `/inscripcion?canal=whatsapp` y `?canal=instagram` para registrar el origen.
- [ ] (Opcional) Redactar el documento separado de Términos y Condiciones (precio, pago, cancelación) que el propio protocolo recomienda.
- [ ] Automatización del formulario de contacto — el plan de 3 capas quedó deferido hasta cerca del lanzamiento. Ojo: se pensó con Netlify Forms y ahora estamos en Cloudflare Pages; la capa 1 probablemente ya la cubre `/inscripcion` + Supabase, repensar antes de arrancar.
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
