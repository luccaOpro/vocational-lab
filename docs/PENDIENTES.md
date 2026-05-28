# Pendientes del classroom

> Cómo usar este archivo: cada ítem tiene `[ ]` cuando está pendiente y `[x]` cuando está hecho. Actualizamos a medida que avanzamos.
> Última actualización: 2026-05-26

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
