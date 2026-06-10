/*
  Edge Function · enviar-mail-solicitud
  ------------------------------------------------------------------
  Manda el mail de respuesta automática cuando entra una solicitud
  nueva en la tabla `solicitudes_inscripcion`.

  CÓMO SE DISPARA: un Database Webhook de Supabase (evento INSERT
  sobre esa tabla) hace un POST a esta función con el registro nuevo.

  DE DÓNDE SALE EL MAIL: el SMTP del hosting (la casilla
  hola@vlab.com.ar), el mismo que usa Supabase para los mails de
  sistema. Por eso reusamos el SPF/DKIM ya configurados.

  SECRETS que necesita (se cargan en el panel de Supabase, NO van acá):
   - SMTP_PASSWORD      → la contraseña de la casilla hola@vlab.com.ar
   - VL_WEBHOOK_SECRET  → una clave inventada, la misma acá y en el
                          header del webhook (para que solo el webhook
                          pueda disparar envíos).

  MAPEO intención → mail:
   - info         → W1A  ("Quiero más información")
   - inscripcion  → W1B  ("Quiero anotarme")
   - otras        → no se manda nada

  Pasos de instalación detallados: ver docs/MAILS-AUTOMATICOS.md
*/

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// ── Config no secreta ──
const SMTP_HOST = "mail.server.dns-principal-28.com";
const SMTP_PORT = 465; // TLS implícito (denomailer anda más parejo en 465 que en 587)
const MAIL_USER = "hola@vlab.com.ar";
const MAIL_FROM_NAME = "Vocational Lab";
const WSP_LINK = "https://wa.me/5491123145518";
const WSP_VISIBLE = "+54 9 11 2314-5518";
const INSCRIPCION_URL = "https://vlab.com.ar/inscripcion";

// ── Secrets (vienen del panel de Supabase) ──
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? "";
const VL_WEBHOOK_SECRET = Deno.env.get("VL_WEBHOOK_SECRET") ?? "";

interface Solicitud {
  intencion?: string;
  nombre?: string;
  email?: string;
  canal?: string;
}

const primerNombre = (n?: string): string => {
  const t = (n ?? "").trim();
  return t ? t.split(/\s+/)[0] : "";
};

const emailValido = (e?: string): boolean =>
  !!e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

// ── Helpers de HTML (estilos inline: los mails no leen CSS externo) ──
const p = (txt: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1b1f3b;">${txt}</p>`;

const boton = (texto: string, url: string) =>
  `<a href="${url}" style="display:inline-block;background:#d85527;color:#ffffff;` +
  `text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;">${texto}</a>`;

function layout(contenidoHtml: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ece4d6;">
        <tr><td style="background:#1b1f3b;padding:20px 28px;">
          <span style="color:#faf7f2;font-size:18px;font-weight:bold;letter-spacing:.5px;">Vocational&nbsp;Lab</span>
        </td></tr>
        <tr><td style="padding:28px;">${contenidoHtml}</td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #ece4d6;color:#8a8676;font-size:12px;line-height:1.5;">
          Julia y Laura · Vocational Lab<br>
          <a href="mailto:hola@vlab.com.ar" style="color:#8a8676;">hola@vlab.com.ar</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

// ── Plantillas por intención ──
function plantilla(
  intencion: string,
  nombre: string,
): { asunto: string; html: string; texto: string } | null {
  const nom = nombre ? ` ${nombre}` : "";

  if (intencion === "info") {
    const asunto = "Recibimos tu consulta — Vocational Lab 🌟";
    const html = layout(
      p(`¡Hola${nom}! 👋 ¡Qué bueno que nos escribiste! Te contamos de qué se trata Vocational Lab.`) +
      p(`Es un programa de descubrimiento vocacional diseñado para acompañar el proceso de identificación y elección desde el autoconocimiento genuino y con una mirada realista del futuro del trabajo.`) +
      `<p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#1b1f3b;">Lo que incluye el programa:</p>` +
      `<ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.6;color:#1b1f3b;">` +
        `<li>6 encuentros grupales en vivo (online, máximo 15 personas) y 2 sesiones individuales con devolución personalizada.</li>` +
        `<li>Exploración del mundo interno: quién eres, qué te mueve, cuáles son tus fortalezas.</li>` +
        `<li>Exploración del mundo externo: tendencias, IA, carreras, escenarios futuros.</li>` +
        `<li>Guías, tests y recursos para pasar a la acción.</li>` +
      `</ul>` +
      p(`Si quieres dar el paso, reserva tu lugar acá:`) +
      `<p style="margin:0 0 20px;">${boton("Reservar mi lugar", INSCRIPCION_URL)}</p>` +
      p(`Y si te quedan dudas, escríbenos por WhatsApp: <a href="${WSP_LINK}" style="color:#d85527;">${WSP_VISIBLE}</a> 😊`) +
      p(`¡Te leemos!`),
    );
    const texto =
      `¡Hola${nom}! Qué bueno que nos escribiste.\n\n` +
      `Vocational Lab es un programa de descubrimiento vocacional que acompaña el proceso de elección desde el autoconocimiento y una mirada realista del futuro del trabajo.\n\n` +
      `Incluye 6 encuentros grupales en vivo (máx. 15 personas), 2 sesiones individuales, y guías y recursos para pasar a la acción.\n\n` +
      `Reserva tu lugar: ${INSCRIPCION_URL}\n` +
      `WhatsApp: ${WSP_LINK}\n\n` +
      `¡Te leemos!\nJulia y Laura · Vocational Lab · hola@vlab.com.ar`;
    return { asunto, html, texto };
  }

  if (intencion === "inscripcion") {
    const asunto = "¡Tu lugar en Vocational Lab te espera! 🎉";
    const html = layout(
      p(`Hola${nom}:`) +
      p(`¡Qué alegría! Recibimos tu inscripción al próximo grupo de Vocational Lab.`) +
      `<p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#1b1f3b;">Para confirmar tu lugar:</p>` +
      `<ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.6;color:#1b1f3b;">` +
        `<li>Paso 1: Ya completaste el formulario ✅</li>` +
        `<li>Paso 2: Coordinamos el pago <strong>por transferencia</strong> — en las próximas 24&nbsp;hs te escribimos con los datos.</li>` +
        `<li>Paso 3: Confirmado el pago, te enviamos el acceso al aula virtual y al grupo.</li>` +
      `</ul>` +
      p(`Cupos limitados (máximo 15 personas por grupo). Tu lugar queda reservado al confirmarse el pago.`) +
      `<p style="margin:0 0 8px;font-size:15px;font-weight:bold;color:#1b1f3b;">Inversión:</p>` +
      `<ul style="margin:0 0 20px;padding-left:20px;font-size:15px;line-height:1.6;color:#1b1f3b;">` +
        `<li>Argentina: $1.000.000 pago único (o 3 cuotas de $400.000 — julio / agosto / septiembre)</li>` +
        `<li>Desde otros países: USD 800</li>` +
      `</ul>` +
      p(`Inicio: Agosto 2026`) +
      p(`¿Dudas? Responde este mail o escríbenos por WhatsApp:`) +
      `<p style="margin:0 0 20px;">${boton("Escribir por WhatsApp", WSP_LINK)}</p>` +
      p(`¡Nos vemos en agosto!`),
    );
    const texto =
      `Hola${nom}:\n\n` +
      `¡Qué alegría! Recibimos tu inscripción al próximo grupo de Vocational Lab.\n\n` +
      `Para confirmar tu lugar:\n` +
      `- Paso 1: Ya completaste el formulario.\n` +
      `- Paso 2: Coordinamos el pago por transferencia — en las próximas 24hs te escribimos con los datos.\n` +
      `- Paso 3: Confirmado el pago, te enviamos el acceso al aula virtual y al grupo.\n\n` +
      `Cupos limitados (máx. 15 por grupo). Tu lugar queda reservado al confirmarse el pago.\n\n` +
      `Inversión:\n- Argentina: $1.000.000 pago único (o 3 cuotas de $400.000).\n- Desde otros países: USD 800.\n\n` +
      `Inicio: Agosto 2026.\nWhatsApp: ${WSP_LINK}\n\n` +
      `¡Nos vemos en agosto!\nJulia y Laura · Vocational Lab · hola@vlab.com.ar`;
    return { asunto, html, texto };
  }

  return null;
}

Deno.serve(async (req: Request) => {
  // ── Cámaras de seguridad (logs de diagnóstico) ──
  const secretHeader = req.headers.get("x-vl-secret");
  console.log("[req]", JSON.stringify({
    metodo: req.method,
    secretConfigurado: !!VL_WEBHOOK_SECRET,   // ¿está el secret VL_WEBHOOK_SECRET cargado?
    passConfigurado: !!SMTP_PASSWORD,         // ¿está el secret SMTP_PASSWORD cargado?
    traeSecretHeader: !!secretHeader,         // ¿el webhook mandó el header x-vl-secret?
    secretCoincide: !!VL_WEBHOOK_SECRET && secretHeader === VL_WEBHOOK_SECRET,
  }));

  // Seguridad: solo quien conoce el secreto (el webhook) puede disparar envíos.
  if (!VL_WEBHOOK_SECRET || secretHeader !== VL_WEBHOOK_SECRET) {
    console.log("[401] rechazado: secret faltante o no coincide");
    return new Response("No autorizado", { status: 401 });
  }

  let payload: { record?: Solicitud };
  try {
    payload = await req.json();
  } catch {
    console.log("[400] JSON inválido");
    return new Response("JSON inválido", { status: 400 });
  }

  const sol = payload.record ?? {};
  const intencion = (sol.intencion ?? "").trim();
  const nombre = primerNombre(sol.nombre);
  const email = (sol.email ?? "").trim();
  console.log("[record]", JSON.stringify({
    intencion,
    email: email ? "(presente)" : "(vacío)",
    canal: sol.canal ?? null,
  }));

  const tpl = plantilla(intencion, nombre);
  if (!tpl) {
    console.log("[skip] intención sin plantilla:", intencion);
    return Response.json({ enviado: false, motivo: "intencion sin plantilla", intencion });
  }
  if (!emailValido(email)) {
    console.log("[skip] email inválido");
    return Response.json({ enviado: false, motivo: "email invalido" });
  }

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: { username: MAIL_USER, password: SMTP_PASSWORD },
    },
  });

  try {
    console.log("[smtp] intentando enviar a", email, "·", SMTP_HOST + ":" + SMTP_PORT);
    await client.send({
      from: `${MAIL_FROM_NAME} <${MAIL_USER}>`,
      to: email,
      subject: tpl.asunto,
      content: tpl.texto,
      html: tpl.html,
    });
    await client.close();
  } catch (err) {
    console.error("[500] error al enviar:", err);
    return Response.json({ enviado: false, error: String(err) }, { status: 500 });
  }

  console.log("[ok] enviado a", email, "· intención", intencion);
  return Response.json({ enviado: true, a: email, intencion });
});
