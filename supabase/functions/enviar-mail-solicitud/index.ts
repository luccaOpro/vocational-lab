/*
  Edge Function · enviar-mail-solicitud
  ------------------------------------------------------------------
  Manda el mail de respuesta automática cuando entra una solicitud
  nueva en la tabla `solicitudes_inscripcion`.

  CÓMO SE DISPARA: un Database Webhook de Supabase (evento INSERT
  sobre esa tabla) hace un POST a esta función con el registro nuevo.

  DE DÓNDE SALE EL MAIL: el SMTP del hosting (la casilla
  hola@vlab.com.ar). Reusa el SPF/DKIM ya configurados.

  SECRETS (se cargan en el panel de Supabase, NO van acá):
   - SMTP_PASSWORD      → la contraseña de la casilla hola@vlab.com.ar
   - VL_WEBHOOK_SECRET  → clave compartida con el header x-vl-secret del webhook

  MAPEO intención → mail:
   - info         → W1A  ("Quiero más información")
   - inscripcion  → W1B  ("Quiero anotarme")
   - otras        → no se manda nada

  DISEÑO: plantilla de marca (header azul noche con logo, cuerpo
  blanco editorial, footer crema). El logo se carga desde el sitio
  (LOGO_URL) porque los mails no soportan SVG ni archivos locales.
  Pasos de instalación/operación: ver docs/MAILS-AUTOMATICOS.md
*/

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// ── Config no secreta ──
const SMTP_HOST = "mail.server.dns-principal-28.com";
const SMTP_PORT = 465; // TLS implícito
const MAIL_USER = "hola@vlab.com.ar";
const MAIL_FROM_NAME = "Vocational Lab";
const WSP_LINK = "https://wa.me/5491123145518";
const WSP_VISIBLE = "+54 9 11 2314-5518";
const INSCRIPCION_URL = "https://vlab.com.ar/inscripcion";
const LOGO_URL = "https://vlab.com.ar/email-logo.png";

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
const eyebrow = (t: string) =>
  `<div style="color:#D8552A;font-size:11px;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;margin:0 0 14px;">${t}</div>`;

const titulo = (t: string) =>
  `<h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:normal;color:#131B3D;font-size:26px;line-height:1.25;margin:0 0 18px;">${t}</h1>`;

const p = (t: string) =>
  `<p style="color:#3F4870;font-size:15px;line-height:1.7;margin:0 0 16px;">${t}</p>`;

const label = (t: string) =>
  `<p style="color:#243A82;font-size:13px;font-weight:bold;margin:0 0 14px;padding-bottom:8px;border-bottom:1px solid #DDD2B4;">${t}</p>`;

const lista = (items: string[]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">` +
  items.map((it, i) => {
    const pb = i === items.length - 1 ? "0" : "12px";
    return `<tr><td style="vertical-align:top;padding:0 12px ${pb} 0;color:#D8552A;font-size:16px;line-height:1.5;font-weight:bold;">&rsaquo;</td>` +
      `<td style="padding:0 0 ${pb};color:#3F4870;font-size:15px;line-height:1.55;">${it}</td></tr>`;
  }).join("") +
  `</table>`;

const boton = (texto: string, url: string) =>
  `<div style="text-align:center;margin:6px 0 26px;">` +
  `<a href="${url}" style="display:inline-block;background:#D8552A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;letter-spacing:.02em;padding:14px 38px;border-radius:8px;">${texto}</a>` +
  `</div>`;

function layout(contenidoHtml: string): string {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#E9DEC1;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9DEC1;padding:30px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #DDD2B4;border-radius:14px;overflow:hidden;">
        <tr><td style="background:#131B3D;padding:28px 28px 22px;text-align:center;">
          <img src="${LOGO_URL}" width="44" alt="Vocational Lab" style="display:inline-block;border:0;outline:none;text-decoration:none;width:44px;height:auto;" />
          <div style="color:#F2EAD7;font-family:Georgia,'Times New Roman',serif;font-size:15px;letter-spacing:.26em;margin-top:10px;text-transform:uppercase;">Vocational&nbsp;Lab</div>
        </td></tr>
        <tr><td style="height:3px;background:#D8552A;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:32px 36px 8px;">${contenidoHtml}</td></tr>
        <tr><td style="background:#131B3D;padding:26px 36px;">
          <div style="color:#F2EAD7;font-family:Georgia,'Times New Roman',serif;font-size:16px;margin:0 0 5px;">Julia y Laura</div>
          <div style="color:#9AA0BD;font-size:12px;line-height:1.8;">Vocational Lab &middot; <a href="mailto:hola@vlab.com.ar" style="color:#E9DEC1;text-decoration:none;">hola@vlab.com.ar</a> &middot; <a href="https://instagram.com/vocationallab" style="color:#E9DEC1;text-decoration:none;">@vocationallab</a></div>
          <div style="color:#6F7596;font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-top:12px;">Próxima edición — Agosto 2026</div>
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
    const asunto = "Recibimos tu consulta — Vocational Lab";
    const html = layout(
      eyebrow("Recibimos tu consulta") +
      titulo("Qué bueno que nos escribiste") +
      p(`Hola${nom}, te contamos de qué se trata Vocational Lab.`) +
      p(`Es un programa de descubrimiento vocacional que acompaña el proceso de elección desde el autoconocimiento genuino y con una mirada realista del futuro del trabajo.`) +
      label("Lo que incluye") +
      lista([
        "6 encuentros grupales en vivo y 2 sesiones individuales con devolución personalizada.",
        "Exploración de tu mundo interno: quién eres, qué te mueve, tus fortalezas.",
        "Exploración del mundo externo: tendencias, IA, carreras, escenarios futuros.",
        "Guías, tests y recursos para pasar a la acción.",
      ]) +
      boton("Reserva tu lugar", INSCRIPCION_URL) +
      p(`¿Te quedan dudas? Escríbenos por WhatsApp y te respondemos a la brevedad.`),
    );
    const texto =
      `Hola${nom}, qué bueno que nos escribiste.\n\n` +
      `Vocational Lab es un programa de descubrimiento vocacional que acompaña el proceso de elección desde el autoconocimiento y una mirada realista del futuro del trabajo.\n\n` +
      `Incluye 6 encuentros grupales en vivo, 2 sesiones individuales, y guías y recursos para pasar a la acción.\n\n` +
      `Reserva tu lugar: ${INSCRIPCION_URL}\nWhatsApp: ${WSP_LINK}\n\n` +
      `Julia y Laura · Vocational Lab · hola@vlab.com.ar`;
    return { asunto, html, texto };
  }

  if (intencion === "inscripcion") {
    const asunto = "Tu lugar en Vocational Lab te espera";
    const html = layout(
      eyebrow("Tu inscripción") +
      titulo("Tu lugar en Vocational Lab te espera") +
      p(`Hola${nom}, ¡qué alegría! Recibimos tu inscripción al próximo grupo de Vocational Lab.`) +
      label("Para confirmar tu lugar") +
      lista([
        "Ya completaste el formulario.",
        "Coordinamos el pago <strong>por transferencia</strong>: en las próximas 24&nbsp;hs te escribimos con los datos.",
        "Confirmado el pago, te enviamos el acceso al aula virtual y al grupo.",
      ]) +
      p(`Cupos limitados (máximo 15 personas por grupo). Tu lugar queda reservado al confirmarse el pago.`) +
      label("Inversión") +
      lista([
        "Argentina: $1.000.000 pago único (o 3 cuotas de $400.000 — julio / agosto / septiembre).",
        "Desde otros países: USD 800.",
      ]) +
      p(`Inicio: Agosto 2026.`) +
      boton("Escríbenos por WhatsApp", WSP_LINK) +
      p(`¿Dudas? Responde este mail o escríbenos por WhatsApp.`),
    );
    const texto =
      `Hola${nom}, ¡qué alegría! Recibimos tu inscripción al próximo grupo de Vocational Lab.\n\n` +
      `Para confirmar tu lugar:\n` +
      `- Ya completaste el formulario.\n` +
      `- Coordinamos el pago por transferencia: en las próximas 24hs te escribimos con los datos.\n` +
      `- Confirmado el pago, te enviamos el acceso al aula virtual y al grupo.\n\n` +
      `Cupos limitados (máx. 15 por grupo).\n\n` +
      `Inversión:\n- Argentina: $1.000.000 pago único (o 3 cuotas de $400.000).\n- Desde otros países: USD 800.\n\n` +
      `Inicio: Agosto 2026.\nWhatsApp: ${WSP_LINK}\n\n` +
      `Julia y Laura · Vocational Lab · hola@vlab.com.ar`;
    return { asunto, html, texto };
  }

  return null;
}

Deno.serve(async (req: Request) => {
  // ── Cámaras de seguridad (logs de diagnóstico) ──
  const secretHeader = req.headers.get("x-vl-secret");
  console.log("[req]", JSON.stringify({
    metodo: req.method,
    secretConfigurado: !!VL_WEBHOOK_SECRET,
    passConfigurado: !!SMTP_PASSWORD,
    traeSecretHeader: !!secretHeader,
    secretCoincide: !!VL_WEBHOOK_SECRET && secretHeader === VL_WEBHOOK_SECRET,
  }));

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
