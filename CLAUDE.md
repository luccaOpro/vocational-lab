# Contexto del proyecto

## Sobre el proyecto

Sitio web profesional para una empresa que vende servicios de **orientación vocacional, coaching y cursos**, publicado en `vlab.com.ar`. Tiene dos partes: el **sitio público** (landing, inscripción con consentimiento legal, protocolo) y el **aula virtual propia** (`/aula`) construida sobre Supabase, con roles de alumno ("protagonista"), profe y admin.

## Sobre el usuario con quien estás trabajando

- **Cero experiencia técnica**: no sabe programación web, nunca trabajó con archivos de código antes.
- **Idioma para hablar con el usuario**: español argentino, voseo (`vos`, `tenés`, `querés`). Respondé siempre en este registro cuando hables CON él.
- **Idioma del contenido del sitio (textos visibles al usuario final)**: **tuteo neutro** (`tú`, `tienes`, `quieres`). Decisión 2026-06-03: el sitio apunta a LATAM, por eso pasamos todo el contenido público a tuteo. Los comentarios del código siguen en español argentino (son comunicación con devs).
- **Estilo de trabajo preferido**: paso a paso, explicaciones claras, sin abrumar. Indicar concretamente qué hacer y por qué, sin clases largas. Claude escribe el código, el usuario decide el contenido y el diseño.

## Objetivos del proyecto

El usuario pidió específicamente que la página sea:

- **Profesional**: nivel de empresa real, no algo amateur.
- **Escalable**: que se pueda sumar contenido (cursos nuevos, blog, secciones) sin romper nada.
- **Corregible**: cambios fáciles, código limpio, versionado en Git.
- **Entendible**: estructura clara y comentada, mantenible por cualquier programador futuro.

## Stack tecnológico acordado

- **Editor**: VS Code (ya instalado).
- **Framework**: **Astro** — elegido por velocidad, SEO, contenido editable en Markdown y modularidad. Ideal para sitios de servicios con potencial de crecimiento (cursos, blog, etc.).
- **Control de versiones**: Git + GitHub (repo `vocational-lab`, auto-deploy al pushear a `main`).
- **Backend del aula**: Supabase (auth + Postgres con RLS + storage). Las migraciones SQL viven en `docs/sql/` y se corren a mano en el SQL Editor de Supabase. El esquema está explicado en `docs/SCHEMA.md`.
- **Hosting**: Cloudflare Pages, plan gratuito, con auto-deploy desde GitHub. URL actual: `vocational-lab.pages.dev`. (Decisión revisada el 2026-06-03: arrancamos pensando en Netlify, terminamos en Cloudflare por costo y generosidad del free tier.)
- **Dominio**: `vlab.com.ar` (comprado, gestionado desde el cPanel del proveedor de hosting tradicional). El sitio web apunta a Cloudflare Pages vía DNS; los emails del dominio (`hola@`, `julia@`, `laura@`) viven en cPanel.
- **Node.js**: instalado.
- **Claude Code**: instalado y autenticado con plan Pro.

## Estado actual (2026-06-10)

**Hecho:**

- Sitio público completo y deployado en `vlab.com.ar`: landing, `/inscripcion` con consentimiento legal (flujo mayor/menor), `/protocolo` (con `noindex`, tiene datos personales), SEO con dominio e imagen OG definitivos, anti-spam.
- Aula virtual Fase 1 construida: login con recuperación de contraseña, vistas de alumno / profe / admin, entregas y correcciones, gestión de cursos y usuarios, panel de solicitudes y transferencias. 12 migraciones SQL en `docs/sql/`.
- Seguridad: RLS de Supabase como capa real (los guards del cliente son solo UX), fix de escalada de rol en la migración 07.

**Pendiente:** la lista viva y priorizada está en `docs/PENDIENTES.md` — los grandes son el test manual de punta a punta del aula, confirmar las migraciones en Supabase, SMTP propio para los mails y las guías de uso.

**Documentación del proyecto** (en `docs/`): `PLAN.md` (visión y fases del aula), `PENDIENTES.md` (checklist vivo), `DECISIONES.md` (registro de decisiones con su porqué), `SCHEMA.md` (base de datos explicada), `SINCRONIZAR-NOTION.md` (cómo compartir docs con Julia y Laura).

## Convenciones importantes

- Código siempre **comentado en español**, pensando en mantenibilidad futura.
- **No tomar decisiones grandes** de diseño o estructura sin consultar primero al usuario.
- Antes de instalar cualquier librería o dependencia nueva, **explicar para qué sirve**.
- Priorizar simplicidad y mantenibilidad sobre features avanzadas.
- Si algo se puede hacer de dos maneras, elegir la más estándar y mejor documentada.

## Cómo arrancar una sesión

Cuando el usuario abra Claude Code en esta carpeta:

1. Leé `docs/PENDIENTES.md` para saber qué quedó pendiente y en qué orden.
2. Resumí en dos o tres líneas dónde está parado el proyecto y proponé el siguiente paso de esa lista.
3. Al cerrar un tema, actualizá `docs/PENDIENTES.md` (y `DECISIONES.md` si hubo una decisión nueva) en el mismo commit o en uno propio — este archivo y los docs se desactualizan rápido si no.
