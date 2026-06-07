# Pendientes del classroom

> Cómo usar este archivo: cada ítem tiene `[ ]` cuando está pendiente y `[x]` cuando está hecho. Actualizamos a medida que avanzamos.
> Última actualización: 2026-06-06

## Inscripción y firma del protocolo (nuevo, 2026-06-03)

Estos pendientes corresponden a la decisión de flujo de firma del protocolo (ver `DECISIONES.md`). El código de la página `/inscripcion`, la tabla SQL, la sección Contacto del sitio y el panel de admin para ver las solicitudes (`/aula/admin/solicitudes`) ya están armados. Lo que falta es lo que Lucas tiene que hacer manualmente en Supabase + redactar copy.

**Panel de admin (hecho 2026-06-06):** Julia y Laura ven las solicitudes que entran por el form en `/aula/admin/solicitudes` (link en el menú del aula y acceso/ KPI en el dashboard del admin). Pueden filtrar por estado, cambiar el estado (nueva/contactada/convertida/descartada) y dejar notas internas. Las solicitudes también se pueden ver crudas en Supabase → Table Editor → `solicitudes_inscripcion`.

**En Supabase (Lucas):**
- [x] Correr `docs/sql/04-solicitudes-inscripcion.sql` en el SQL Editor del proyecto
- [x] Verificar que aparezca la tabla `solicitudes_inscripcion` en Table Editor
- [x] ~~Verificar que aparezca el bucket `protocolos` en Storage (público)~~ — el bucket queda creado pero **ya no se usa**, el protocolo pasó a ser HTML embebido. Se puede borrar desde Storage si querés limpiar, o dejarlo (no rompe nada).
- [x] ~~Subir el PDF del protocolo al bucket~~ — descartado, ahora es HTML versionado en código.
- [ ] **⚠️ Correr `docs/sql/06-datos-consentimiento.sql`** (suma las columnas del consentimiento: edad, fecha_nacimiento_menor, vínculo, DNI del tutor, contacto de emergencia). **Hasta que se corra, el form de `/inscripcion` no guarda nada** — el INSERT manda columnas que todavía no existen.

**Copy / contenido (Lucas + Julia/Laura):**
- [x] **Reemplazar el borrador de `src/components/ProtocoloContenido.astro`** — hecho el 2026-06-06: se cargó la transcripción fiel del documento legal aprobado (Protocolo_VL_062026, v1.0). `PROTOCOLO_VERSION_ACTUAL` queda en `"v1"`.
- [x] **Dato sensible público:** el protocolo (sección 1) incluye CUILs y domicilios particulares de Julia y Laura. Resuelto el 2026-06-06 con `noindex` en `/protocolo` (meta robots + excluida del sitemap + `Disallow` en robots.txt): la página sigue accesible por link pero no la indexa Google. Queda abierto, si ellas lo prefieren, reemplazar los domicilios particulares por un domicilio único de contacto en el texto.
- [ ] Revisar el texto del checkbox ("He leído y acepto el Protocolo del programa.") por si Julia y Laura prefieren otra redacción.
- [ ] (Opcional) Redactar el documento separado de Términos y Condiciones (precio, pago, cancelación) que el propio protocolo recomienda.

**Seguridad del form:**
- [x] Honeypot anti-bot + tiempo mínimo en `/inscripcion` (2026-06-06). Frena el spam automático de formularios.
- [ ] Nivel siguiente (cuando haga falta): captcha (Cloudflare Turnstile) o rate-limit por IP vía Edge Function, para frenar ataques directos a la API que saltean el form.

**Cuando sea hora de mails automáticos (decisión 4 que pateamos):**
- [ ] Elegir servicio (Resend / SendGrid / etc.) y sumar al stack
- [ ] Disparar mail de confirmación al inscripto cuando se crea la solicitud
- [ ] Disparar mail al admin cuando entra una nueva solicitud

**Trackeo de canal (opcional, mejora):**
- [ ] Definir links de WhatsApp/Instagram que apunten a `/inscripcion?canal=whatsapp` y `?canal=instagram` para registrar el origen

## Setup técnico inicial

- [x] Configurar Git + GitHub para el repo `vocational-lab`
- [x] Conectar Netlify al repo de GitHub (auto-deploy)
- [x] Diseñar el esquema de la base de datos → ver `docs/SCHEMA.md`
- [ ] Crear cuenta de Supabase
- [ ] Crear proyecto de Supabase para Vocational Lab
- [ ] Aplicar el SQL del esquema en Supabase (tablas + RLS + buckets)
- [ ] Cargar datos de prueba para verificar el esquema
- [ ] Instalar y configurar cliente de Supabase en el proyecto Astro
- [ ] Guardar credenciales del proyecto en `.env`

## Fase 1 — V1 del classroom

### Autenticación
- [ ] Página de login (mail + contraseña)
- [ ] Recuperar contraseña por mail
- [ ] Cerrar sesión
- [ ] Reglas de acceso: que solo alumnos inscriptos vean sus cursos

### Vista de alumno
- [ ] Página "Mis cursos" con la lista de cursos donde está inscripto
- [ ] Vista del curso: módulos y archivos descargables
- [ ] Descargar archivos
- [ ] Subir entrega de tarea
- [ ] Ver estado de la entrega (entregada / corregida / pendiente)
- [ ] Ver devolución del profe (nota + comentario)

### Vista de profesor
- [ ] Crear / editar cursos
- [ ] Crear / editar módulos dentro de un curso
- [ ] Subir material a un módulo
- [ ] Ver lista de alumnos inscriptos en cada curso
- [ ] Ver lista de entregas pendientes de corregir
- [ ] Corregir entrega: poner nota + comentario

### Vista de admin
- [ ] Crear cuenta de alumno cuando llega una transferencia
- [ ] Inscribir alumno en un curso específico
- [ ] Ver lista general de alumnos y su estado de pago
- [ ] Dar de alta nuevos profesores

### Otros
- [ ] Permisos y reglas de seguridad (que un alumno no vea entregas de otro)
- [ ] Testing manual del flujo completo
- [ ] Documento "cómo se usa el aula" para Julia y Laura
- [ ] Documento "cómo se usa el aula" para los alumnos

## Fase 2 — V2 (para después)

- [ ] Foros por curso
- [ ] Mensajería profe ↔ alumno
- [ ] Notificaciones por mail (nueva entrega, nueva devolución)
- [ ] Anuncios / tablón del curso
- [ ] Calendario de fechas de entrega
- [ ] PWA (app móvil)

## Mejoras continuas (heredadas del sitio público)

- [ ] Reemplazar OG image placeholder (`public/og-image.png`) por imagen real
- [ ] Reemplazar dominio placeholder por dominio real en `Layout.astro` y `robots.txt`
- [ ] Decidir e implementar las 3 capas de automatización del formulario de contacto (Netlify Forms → Zapier → WhatsApp)
