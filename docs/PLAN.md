# Plan del classroom de Vocational Lab

> Última actualización: 2026-05-26

## Visión general

Aula virtual propia, integrada al sitio `vlab.com.ar`. Los alumnos que ya pagaron el curso (por transferencia) acceden a un área privada donde:

- Ven sus cursos y módulos.
- Descargan material que carga el profesor.
- Suben tareas para ser corregidas.
- Reciben devoluciones por escrito.

La experiencia debe sentirse 100% Vocational Lab — la marca y el dominio nuestros, no de Google Classroom ni de Hotmart.

## Stack técnico

- **Frontend**: Astro (lo que ya tenemos) + nuevas páginas privadas para el aula.
- **Backend** (base de datos, autenticación, almacenamiento de archivos): **Supabase** (plan gratuito al inicio).
- **Hosting**: Netlify (sin cambios).
- **Cobro**: por transferencia bancaria + pantalla de admin para activar alumnos manualmente.
- **Mail transaccional** (recuperar contraseña, etc.): por definir — probablemente Supabase + un servicio gratis tipo Resend.

## Roles del sistema

- **Admin** — Lucca / equipo Vocational Lab. Da de alta alumnos cuando confirma una transferencia. Gestiona cursos.
- **Profesor** — Julia, Laura, otros. Crea cursos, sube material, corrige tareas.
- **Alumno** — los compradores del curso. Ven sus cursos, descargan material, suben tareas.

## Fases

### Fase 1 — V1 (objetivo: ~6-8 semanas desde 2026-05-26)

Funciones mínimas para tener un aula utilizable:

- Login con mail + contraseña + recuperar contraseña.
- Página "Mis cursos" con la lista de cursos donde el alumno está inscripto.
- Vista del curso con sus módulos y archivos descargables.
- Subida de tareas por parte del alumno.
- Vista del profe: ver entregas, dejar comentario y nota.
- Pantalla de admin: marcar a un alumno como "pagó, activar acceso" cuando llega la transferencia.

### Fase 2 — V2 (después del lanzamiento de Fase 1)

- Foros de discusión por curso (alumno ↔ alumno).
- Mensajería interna (alumno ↔ profesor).
- Notificaciones por mail (nueva entrega, nueva devolución, anuncio).
- Anuncios / tablón del curso.
- Calendario de fechas de entrega.
- App móvil (probablemente PWA, no app nativa al inicio).

### Más adelante (sin compromiso de fecha)

- Certificados al completar curso.
- Foro general entre alumnos de distintos cursos.
- Sistema de calificaciones con rúbrica.
- Migración eventual a pasarela de pago automática (Mercado Pago).

## Lo que queda fuera del scope

- Videollamadas en vivo dentro del aula (si hace falta, embebemos Zoom o Meet con un link).
- App nativa en Play Store / App Store en Fase 1.
- Integración con pasarela de pago automática en Fase 1.

## Riesgos identificados

- **Plazo**: lo que más arriesga retrasarse es el tiempo de carga de contenido por parte de Julia y Laura, no el código.
- **Costos de almacenamiento**: empezamos en el plan gratuito de Supabase (1 GB de archivos). Si los profes suben videos pesados, hay que migrar a plan pago (25 USD/mes) o usar otro storage para videos (Vimeo, YouTube no listado).
- **Soporte a alumnos**: ante un olvido de contraseña o un problema, alguien tiene que estar disponible para resolver. Hay que definir quién.
