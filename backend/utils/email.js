const nodemailer = require('nodemailer');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

let cachedTransporter = null;

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
          secure: port === 465,
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
  const from = process.env.SMTP_FROM || requiredEnv('SMTP_USER');
  const transporter = getTransporter();
  try {
    await transporter.sendMail({ from, to, subject, html });
  } catch (err) {
    throw annotateSmtpError(err);
  }
};
