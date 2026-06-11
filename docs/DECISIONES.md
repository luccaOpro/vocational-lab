# Registro de decisiones del proyecto

> Cada decisión importante con su fecha y el "porqué". Para volver a entender el contexto si pasa tiempo.

## 2026-05-26 — Construir classroom propio (en vez de usar plataforma comercial)

**Decisión**: armar el aula virtual a medida usando Astro + Supabase, en vez de contratar Hotmart, Thinkific, Teachable, o linkear a Google Classroom.

**Por qué**:
- Queremos toda la experiencia bajo la marca Vocational Lab — el alumno no debe sentir que "salió a otra plataforma".
- Tenemos aire en el plazo: ya no es un mes estricto, podemos apuntar a 6-10 semanas.
- Control total sobre los datos de los alumnos y la lógica de negocio a futuro.

**Alternativas descartadas**: el cuadro completo está en `comparativa-plataformas-aula.pdf` (raíz del proyecto). Resumen: Google Classroom rompe marca, Hotmart/Thinkific dan menos control, ambas opciones de plataforma cobran comisión o cuota.

---

## 2026-05-26 — Stack técnico: Astro + Supabase + Netlify

**Decisión**: usar Astro (que ya teníamos) + Supabase como backend + seguir en Netlify.

**Por qué**:
- Astro ya está montado y sigue sirviendo para el sitio público.
- Supabase: pieza estándar para auth + base de datos + almacenamiento de archivos en proyectos chicos/medianos. Plan gratuito alcanza para arrancar (hasta 50.000 usuarios y 1 GB de archivos).
- Netlify: sin cambios respecto al plan original.

---

## 2026-05-26 — Cobro por transferencia bancaria, sin pasarela

**Decisión**: por ahora los alumnos pagan por transferencia. No integramos Mercado Pago ni Stripe.

**Por qué**:
- Decisión del usuario para arrancar más rápido y sin comisiones de pasarela.
- Necesitamos una pantalla de admin para que Vocational Lab marque manualmente "este alumno pagó, dale acceso".
- Si más adelante el volumen crece, evaluamos integrar pasarela automática.

---

## 2026-05-26 — Documentación en archivos .md locales + sync manual a Notion

**Decisión**: la fuente de verdad son archivos markdown locales en `docs/` que Claude lee y edita. Cuando hace falta compartir con Julia y Laura, copiamos y pegamos a Notion.

**Por qué**:
- No hay conector de Notion disponible en el entorno actual de Claude.
- La opción híbrida concilia la velocidad de actualización (Claude trabajando con archivos locales) con la facilidad de lectura para no-técnicos (Notion).
- Si más adelante aparece un conector Notion estable o el copy-paste se vuelve tedioso, evaluamos automatizar la sincronización vía API.

**Detalle del flujo**: ver `SINCRONIZAR-NOTION.md` en esta misma carpeta.

---

## 2026-06-03 — Flujo de firma del protocolo / consentimiento informado

**Contexto**: el programa requiere que el inscripto (o el adulto responsable, si es menor) acepte un protocolo antes de quedar anotado. La pregunta era qué herramienta usar para "firmar" — DocuSign u otra plataforma de firma digital certificada vs. una solución más simple.

**Decisión**: NO usamos plataforma de firma certificada. Implementamos consentimiento por **checkbox único + registro en Supabase**, en una página unificada de inscripción.

**Las 4 sub-decisiones**:

1. **Checkbox único, sin double opt-in.** Un solo paso: el form tiene un checkbox obligatorio que dice "Leí y acepto el Protocolo" con link al PDF. Al enviar el form, Supabase guarda timestamp + email + IP + país + versión del protocolo aceptado. Eso es prueba suficiente bajo Ley 25.326 para el nivel de riesgo de un programa educativo. Se descartó el doble opt-in (mail de confirmación) por la fricción que agrega y la tasa de abandono que produce.

2. **Una sola URL `/inscripcion` unificada para los 3 canales** (WhatsApp, Web, Instagram). Los chats no resuelven la firma — todos redirigen a esa página. Una sola fuente de verdad para datos + firma + pago.

3. **Versionamos el protocolo en código (HTML), no PDF.** El texto vive en `src/components/ProtocoloContenido.astro` (fuente única) y se renderiza en dos lugares: la página `/protocolo` (standalone, linkeable, indexable) y dentro del form de `/inscripcion` (panel scrolleable que recién habilita el checkbox cuando el usuario llegó al final del texto). La versión actual se declara como constante `PROTOCOLO_VERSION_ACTUAL = "v1"` en `inscripcion.astro`. Cuando se edite, sube a "v2" y el histórico queda en git log. *Decisión revisada 2026-06-03 tarde*: arrancamos pensando en PDF en bucket de Supabase, pero cambiamos porque la UX en mobile del PDF es mala, queremos branding consistente y queremos que sea indexable.

4. **Sin mails automáticos por ahora.** Resend / SendGrid / otros quedan para más adelante. Hoy el flujo termina en pantalla con "ya estás anotado, te contactamos por WhatsApp/mail con los próximos pasos".

**Para menores**: el formulario arranca preguntando "¿Quién se inscribe? Soy mayor de 18 / Soy responsable de un menor de 18". Si es lo segundo, pide datos del adulto Y del menor. El adulto es quien firma. NO detectamos edad automáticamente ni pedimos DNI.

**Patrón UX del consentimiento**: el panel del protocolo arranca con el checkbox **deshabilitado**. Cuando el usuario hace scroll dentro del panel y llega al final del contenido, el checkbox se habilita automáticamente. Es el mismo patrón que usan Apple, AWS y Stripe para sus T&C. Más honesto que "click expande y habilita" porque empuja al lector a recorrer el texto.

**Pendientes futuros relacionados** (no esenciales para V1):
- Seguridad anti-bot del form (captcha, honeypot, rate-limit).
- Sumar trackeo de canal vía query params en los links de WhatsApp/Instagram.

---

## 2026-06-03 — Lenguaje del sitio: tuteo neutro (en lugar de voseo argentino)

**Decisión**: todos los textos visibles al usuario final del sitio pasan de voseo argentino (`vos`, `tenés`, `querés`) a **tuteo neutro** (`tú`, `tienes`, `quieres`). La conversación entre Lucas y Claude sigue en voseo. Los comentarios del código también.

**Por qué**:
- El programa apunta a LATAM, no solo Argentina. El voseo argentino limita el alcance.
- Coincide con el lineamiento del documento "Carril E — Mensajes de Intercambio" que ya redacta todos los mensajes de WhatsApp / Mail / Instagram en tuteo neutro. Sin este cambio, el sitio y los mensajes salían en registros distintos.
- Revisamos esta decisión 2 veces antes; en la sesión del 2026-06-03 a la tarde se confirma con una tabla de 40 reemplazos.

**Alcance del cambio**:
- Textos públicos: Hero, Caminos, Diferencial, Programa, ParaQuien, Equipo, Contacto, Inscripción.
- Páginas nuevas: `/inscripcion`, `/protocolo`.
- Mensajes de error y confirmación del form.
- Email de marca: `hola@vocationallab.com` → `hola@vlab.com.ar` (item 38 de la tabla; coincide con la firma del equipo en los mensajes).
- Dominio del sitio: `vocationallab.com` → `vlab.com.ar` (constante SITE_URL en Layout.astro).
- Emails demo (Julia, Laura) en `cursos-demo.ts` también pasan a `@vlab.com.ar` por consistencia.

**Lo que NO cambia**:
- Comentarios del código (`// ...`, `/* ... */`) siguen en español argentino — son comunicación con devs.
- Handles de Instagram (`@vocationallab`) se mantienen porque cambiar handle es lío y no estaba en la tabla.

## 2026-06-11 — Videos solo en el material del módulo (no en tareas)

**Decisión**: los videos de YouTube/Vimeo van únicamente como material del módulo (botón "+ Agregar video" del panel de contenido). Se elimina el campo "Video de referencia" del formulario de tareas y su visualización en el aula.

**Por qué**:
- Lucas lo pidió explícitamente: un solo lugar para los videos, menos confusión para Julia y Laura al cargar contenido.
- La tarea queda enfocada en la consigna + adjunto opcional; el material audiovisual vive junto al resto del material del módulo.

**Además, fix relacionado**: el alta de videos en módulos nunca había funcionado — el CHECK de `archivos_modulo.tipo` (migración 01) no aceptaba el valor `youtube` que inserta el panel, así que el INSERT fallaba siempre. Se corrige con la migración `13-video-youtube-en-modulos.sql`. De paso, el aula ahora reproduce los videos embebidos (YouTube nocookie / Vimeo player) sin salir de la página; si la URL no es de YouTube/Vimeo, se muestra como link externo igual que antes.

**Nota**: la columna `tareas.video_url` queda en la base (existe en producción, agregada a mano en su momento) pero ya no se usa desde el código. Si algún día molesta, se puede borrar con un `alter table`.
