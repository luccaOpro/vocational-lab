# Mails automáticos de respuesta al formulario

> Última actualización: 2026-06-10

Cuando alguien completa el formulario de `/inscripcion`, le llega solo un mail
de respuesta desde `hola@vlab.com.ar`, según qué eligió:

- **"Quiero más información"** (`info`) → mail **W1A**.
- **"Quiero anotarme"** (`inscripcion`) → mail **W1B**.

Los textos viven en la función `supabase/functions/enviar-mail-solicitud/index.ts`.
La función se dispara con un **Database Webhook** de Supabase cuando entra una
fila nueva en `solicitudes_inscripcion`, y manda el mail por el SMTP del hosting
(el mismo `mail.server.dns-principal-28.com` que usamos para los mails de Supabase).

---

## Cómo se instala (una sola vez, en el panel de Supabase)

### 1. Crear la función

Supabase → **Edge Functions** → **Deploy a new function** (o "Create function"
con el editor del navegador):

- Nombre: `enviar-mail-solicitud`
- **Verify JWT: OFF** (la seguridad la maneja nuestro propio secreto, abajo).
- Pegar el contenido completo de `supabase/functions/enviar-mail-solicitud/index.ts`.
- **Deploy**.

### 2. Cargar los 2 secretos

Supabase → **Edge Functions → Secrets** (o Project Settings → Edge Functions):

| Nombre | Valor |
|---|---|
| `SMTP_PASSWORD` | la contraseña de la casilla `hola@vlab.com.ar` |
| `VL_WEBHOOK_SECRET` | una clave inventada larga (ej: generá una de 32+ caracteres). Anotala, la usás también en el paso 3. |

### 3. Crear el Database Webhook

Supabase → **Database → Webhooks** → **Create a new hook**:

- Name: `mail-nueva-solicitud`
- Table: `solicitudes_inscripcion`
- Events: **Insert**
- Type: **HTTP Request** · método **POST**
- URL: `https://<TU-PROYECTO>.supabase.co/functions/v1/enviar-mail-solicitud`
  (la URL exacta la ves en la página de la función)
- HTTP Headers: agregar uno →
  - `x-vl-secret` : *(la misma clave que pusiste en `VL_WEBHOOK_SECRET`)*
- **Create**.

### 4. Probar

- Completá el formulario de `/inscripcion` con un mail tuyo (probá las dos
  intenciones: "más información" y "anotarme").
- Verificá que lleguen los dos mails (revisá también spam la primera vez).
- Si algo falla, en Supabase → Edge Functions → `enviar-mail-solicitud` → **Logs**
  se ve el error.

---

## Notas

- **Seguridad:** la función solo envía si el header `x-vl-secret` coincide con el
  secreto. Así nadie que descubra la URL puede usarla para mandar mails.
- **Puerto SMTP:** usa 465 (TLS implícito). Si en los logs aparece un error de
  conexión/TLS, probar cambiando `SMTP_PORT` a 587 en el código.
- **Intención sin plantilla** (ej. si algún día se suma `charla`/`consultas`): la
  función responde OK pero no manda nada, hasta que le agreguemos su plantilla.
- **Pendiente relacionado:** los mails de pago confirmado (BIENVENIDA / FAMILIA)
  todavía no están — se dispararían cuando el admin confirma una transferencia.
  Ver `docs/PENDIENTES.md`.
