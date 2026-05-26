const nodemailer = require('nodemailer');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

let cachedTransporter = null;

function parseFrom(value) {
  const v = String(value || '').trim();
  if (!v) return { name: undefined, email: undefined };

  // Matches: Name <email@domain>
  const m = v.match(/^(.*)<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ''), email: m[2].trim() };

  // Fallback: just an email
  return { name: undefined, email: v.replace(/^"|"$/g, '') };
}

async function sendBrevoEmail({ to, subject, html }) {
  const apiKey = requiredEnv('BREVO_API_KEY');

  const fromRaw = process.env.SMTP_FROM || process.env.BREVO_SENDER || process.env.BREVO_FROM || '';
  const fromParsed = parseFrom(fromRaw);
  const senderEmail = fromParsed.email || process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL;
  const senderName = fromParsed.name || process.env.BREVO_SENDER_NAME || process.env.APP_NAME || 'EventFlow';
  if (!senderEmail) throw new Error('Missing Brevo sender email (set SMTP_FROM like "Name <email>" or BREVO_SENDER_EMAIL)');

  const toList = Array.isArray(to) ? to : [to];
  const toPayload = toList
    .map((addr) => String(addr || '').trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  const controller = new AbortController();
  const timeoutMs = Number(process.env.BREVO_TIMEOUT_MS || 15_000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: toPayload,
        subject,
        htmlContent: html,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`Brevo API error: HTTP ${resp.status} ${resp.statusText}${body ? ` - ${body}` : ''}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = requiredEnv('SMTP_USER');
  const pass = requiredEnv('SMTP_PASS');

  const service = String(process.env.SMTP_SERVICE || '').trim();
  const debug = String(process.env.SMTP_DEBUG || '').trim().toLowerCase() === 'true';

  // If SMTP_SERVICE is provided (e.g. "gmail"), use Nodemailer's service preset.
  // Otherwise, fall back to host/port based configuration.
  const transportConfig = service
    ? { service, auth: { user, pass } }
    : (() => {
        const host = requiredEnv('SMTP_HOST');
        const port = Number(requiredEnv('SMTP_PORT'));
        return {
          host,
          port,
          // For 587, use STARTTLS (secure=false). For 465, implicit TLS (secure=true).
          secure: port === 465 ? true : false,
          auth: { user, pass },
          // Gmail/most providers on 587 expect STARTTLS.
          requireTLS: port === 587,
          tls: {
            servername: host,
            minVersion: 'TLSv1.2',
          },
        };
      })();

  // Prevent "stuck" requests by failing fast when SMTP is unreachable.
  cachedTransporter = nodemailer.createTransport({
    ...transportConfig,
    logger: debug,
    debug,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10_000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10_000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20_000),
  });

  return cachedTransporter;
}

function annotateSmtpError(err) {
  if (!err || typeof err !== 'object') return err;

  const code = err.code || err?.cause?.code;
  if (code !== 'ETIMEDOUT' && code !== 'ESOCKET') return err;

  const host = process.env.SMTP_HOST || '(missing SMTP_HOST)';
  const port = process.env.SMTP_PORT || '(missing SMTP_PORT)';
  const hint =
    'SMTP connection timed out. If this is happening on a hosting provider (e.g. Render), outbound SMTP ports may be blocked. Try switching to port 465 or use an email API provider (Resend/SendGrid/Mailgun) instead of SMTP.';

  err.message = `${err.message} (host=${host} port=${port}) - ${hint}`;
  return err;
}

exports.sendEmail = async ({ to, subject, html }) => {
  // Prefer Brevo API if configured. Many hosts (including Render) block outbound SMTP.
  if (process.env.BREVO_API_KEY) {
    return sendBrevoEmail({ to, subject, html });
  }

  const from = process.env.SMTP_FROM || requiredEnv('SMTP_USER');
  const transporter = getTransporter();
  try {
    await transporter.sendMail({ from, to, subject, html });
  } catch (err) {
    throw annotateSmtpError(err);
  }
};
