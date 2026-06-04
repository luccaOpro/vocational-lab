# Cómo sincronizar la documentación a Notion

> Mini-guía paso a paso para mantener Notion actualizado con los archivos locales.

## Cuándo sincronizar

- Cuando un documento llega a un hito que querés compartir con Julia / Laura.
- Cuando hubo cambios importantes en `PLAN.md` o `DECISIONES.md` desde la última sincronización.
- **No es necesario sincronizar cada cambio chico** — el documento maestro vive acá; Notion es el "espejo lindo".

## Cómo hacerlo (~5 minutos)

1. Abrí el archivo `.md` correspondiente en VS Code.
2. Seleccioná todo (`Ctrl + A`) y copiá (`Ctrl + C`).
3. En Notion, abrí la página correspondiente (o creá una nueva con el mismo nombre).
4. Borrá el contenido viejo de la página (si había) y pegá (`Ctrl + V`).
5. Notion interpreta el formato markdown automáticamente: títulos, listas, casillas `[ ]` / `[x]`, links, tablas. Todo.
6. Revisá rápido que las casillas y tablas hayan quedado bien — a veces hay que ajustar manualmente.
7. (Opcional) Arriba de todo, agregás una línea con la fecha de la sincronización: "Última sync: 2026-XX-XX".

## Estructura sugerida en Notion

Para que quede ordenado, sugerencia de jerarquía:

- 📋 **Vocational Lab — Aula virtual** *(página padre)*
  - 📄 **Plan del classroom** *(espejo de `PLAN.md`)*
  - ✅ **Pendientes** *(espejo de `PENDIENTES.md`)*
  - 📜 **Decisiones** *(espejo de `DECISIONES.md`)*

Si más adelante sumamos documentos (manuales, contratos, etc.), seguimos la misma lógica: archivo `.md` local + página espejo en Notion.

## Lo que NO conviene hacer

- **No editar las páginas de Notion directamente** sin avisar. Si Julia cambia algo en Notion y después yo actualizo el `.md` local, la próxima sincronización pisa los cambios de Julia. Si Julia o Laura quieren proponer un cambio, que lo comenten al margen en Notion (o por WhatsApp/mail) y lo aplico en el `.md` local.
- **No mover el archivo de carpeta** sin avisar — yo lo busco siempre en `docs/`.
