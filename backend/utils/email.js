const SibApiV3Sdk = require('sib-api-v3-sdk');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function parseFrom(value) {
  const v = String(value || '').trim();
  if (!v) return { name: undefined, email: undefined };

  // Matches: Name <email@domain>
  const m = v.match(/^(.*)<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, ''), email: m[2].trim() };

  // Fallback: just an email
  return { name: undefined, email: v.replace(/^"|"$/g, '') };
}

let cachedBrevoApiInstance = null;
function getBrevoApiInstance() {
  if (cachedBrevoApiInstance) return cachedBrevoApiInstance;

  const client = SibApiV3Sdk.ApiClient.instance;
  client.authentications['api-key'].apiKey = requiredEnv('BREVO_API_KEY');
  cachedBrevoApiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  return cachedBrevoApiInstance;
}

exports.sendEmail = async ({ to, subject, html }) => {
  const apiInstance = getBrevoApiInstance();

  // Sender: prefer SMTP_FROM-like format for convenience, else fall back to explicit vars.
  // Note: Sender must be verified in Brevo.
  const fromRaw = process.env.SMTP_FROM || process.env.BREVO_SENDER || '';
  const fromParsed = parseFrom(fromRaw);
  const senderEmail =
    fromParsed.email || process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || process.env.BREVO_FROM;
  const senderName = fromParsed.name || process.env.BREVO_SENDER_NAME || process.env.APP_NAME || 'EventFlow';

  if (!senderEmail) {
    throw new Error('Missing sender email for Brevo (set SMTP_FROM like "Name <email>" or BREVO_SENDER_EMAIL)');
  }

  const toList = Array.isArray(to) ? to : [to];
  const toPayload = toList
    .map((addr) => String(addr || '').trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  if (!toPayload.length) throw new Error('Missing recipient email');

  await apiInstance.sendTransacEmail({
    sender: { email: senderEmail, name: senderName },
    to: toPayload,
    subject,
    htmlContent: html,
  });
};
