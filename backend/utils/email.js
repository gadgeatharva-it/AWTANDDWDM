const nodemailer = require('nodemailer');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = requiredEnv('SMTP_HOST');
  const port = Number(requiredEnv('SMTP_PORT'));
  const user = requiredEnv('SMTP_USER');
  const pass = requiredEnv('SMTP_PASS');

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return cachedTransporter;
}

exports.sendEmail = async ({ to, subject, html }) => {
  const from = process.env.SMTP_FROM || requiredEnv('SMTP_USER');
  const transporter = getTransporter();
  await transporter.sendMail({ from, to, subject, html });
};

