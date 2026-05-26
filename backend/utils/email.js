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
        };
      })();

  // Prevent "stuck" requests by failing fast when SMTP is unreachable.
  cachedTransporter = nodemailer.createTransport({
    ...transportConfig,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10_000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10_000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20_000),
  });

  return cachedTransporter;
}

exports.sendEmail = async ({ to, subject, html }) => {
  const from = process.env.SMTP_FROM || requiredEnv('SMTP_USER');
  const transporter = getTransporter();
  await transporter.sendMail({ from, to, subject, html });
};
