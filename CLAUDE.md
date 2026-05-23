# Contexto del proyecto

## Sobre el proyecto

Sitio web profesional para una empresa que vende servicios de **orientación vocacional, coaching y cursos**. El sitio se publicará en un futuro dominio propio `.com` (todavía no comprado).

## Sobre el usuario con quien estás trabajando

- **Cero experiencia técnica**: no sabe programación web, nunca trabajó con archivos de código antes.
- **Idioma**: español argentino, voseo (`vos`, `tenés`, `querés`). Respondé siempre en este registro.
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
- **Control de versiones**: Git + GitHub (todavía no configurado).
- **Hosting**: Netlify, plan gratuito, con auto-deploy desde GitHub.
- **Dominio**: `.com` propio, a comprar más adelante (~10-15 USD/año). Mientras tanto, subdominio gratuito de Netlify.
- **Node.js**: instalado.
- **Claude Code**: instalado y autenticado con plan Pro.

## Estado actual

**Hecho:**

- VS Code instalado
- Node.js instalado
- Claude Code instalado y conectado a la cuenta Pro
- Carpeta del proyecto creada (esta carpeta)

**Pendiente — próximos pasos en orden:**

1. Crear el proyecto Astro inicial dentro de esta carpeta.
2. El usuario va a entregar un documento Word con el contenido y datos para la página. **Esperar ese contenido antes de definir la estructura final** y poblar las páginas con texto.
3. Diseñar las secciones principales del sitio (probablemente Inicio, Servicios, Sobre, Contacto, posiblemente un módulo de Cursos — a definir con el usuario en base al Word).
4. Configurar Git + GitHub para versionar el proyecto.
5. Configurar el deploy automático en Netlify.
6. Más adelante: comprar dominio `.com` y conectarlo.

## Convenciones importantes

- Código siempre **comentado en español**, pensando en mantenibilidad futura.
- **No tomar decisiones grandes** de diseño o estructura sin consultar primero al usuario.
- Antes de instalar cualquier librería o dependencia nueva, **explicar para qué sirve**.
- Priorizar simplicidad y mantenibilidad sobre features avanzadas.
- Si algo se puede hacer de dos maneras, elegir la más estándar y mejor documentada.

## Cómo arrancar la primera sesión

Cuando el usuario abra Claude Code en esta carpeta:

1. Saludalo brevemente y confirmá que leíste este contexto.
2. Resumí en dos o tres líneas dónde está parado el proyecto.
3. Preguntá si ya tiene listo el Word con el contenido o si lo va a entregar más tarde.
4. Si todavía no lo tiene, proponé crear el esqueleto inicial del proyecto Astro mientras tanto, así avanzamos.
