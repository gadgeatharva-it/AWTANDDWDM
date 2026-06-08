function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function baseTemplate({ title, preheader, bodyHtml, ctaUrl, ctaText }) {
  const safeTitle = String(title || '');
  const safePreheader = String(preheader || '');
  const safeCtaUrl = String(ctaUrl || '');
  const safeCtaText = String(ctaText || '');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      body { margin:0; font-family: Arial, sans-serif; background:#f6f7fb; color:#111827; }
      .wrap { max-width: 560px; margin: 0 auto; padding: 24px 12px; }
      .card { background:#ffffff; border-radius: 12px; padding: 22px; border: 1px solid #e5e7eb; }
      .h { font-size: 18px; margin: 0 0 10px; }
      .p { margin: 0 0 12px; line-height: 1.5; color:#374151; }
      .btn { display:inline-block; background:#2563eb; color:#ffffff !important; text-decoration:none; padding: 10px 14px; border-radius: 10px; font-weight: 600; }
      .muted { color:#6b7280; font-size: 12px; margin-top: 14px; }
      .code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color:#111827; }
    </style>
  </head>
  <body>
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${safePreheader}</div>
    <div class="wrap">
      <div class="card">
        <h1 class="h">${safeTitle}</h1>
        <div class="p">${bodyHtml || ''}</div>
        ${safeCtaUrl ? `<p style="margin:16px 0 0;"><a class="btn" href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer">${safeCtaText || 'Open'}</a></p>` : ''}
        ${safeCtaUrl ? `<p class="muted">If the button doesn't work, copy and paste this URL:<br/><span class="code">${safeCtaUrl}</span></p>` : ''}
      </div>
    </div>
  </body>
</html>`;
}

exports.verificationEmailTemplate = ({ appName, verifyUrl }) => {
  const title = `Verify your email for ${appName || 'your account'}`;
  return baseTemplate({
    title,
    preheader: 'Verify your email address to activate your account.',
    bodyHtml:
      '<p class="p">Thanks for signing up. Please verify your email address to activate your account.</p><p class="p">This link will expire soon for your security.</p>',
    ctaUrl: verifyUrl,
    ctaText: 'Verify email',
  });
};

exports.passwordResetEmailTemplate = ({ appName, resetUrl }) => {
  const title = `Reset your password for ${appName || 'your account'}`;
  return baseTemplate({
    title,
    preheader: 'Use the link to reset your password.',
    bodyHtml:
      '<p class="p">We received a request to reset your password. If you didn’t request this, you can ignore this email.</p><p class="p">For security, this link expires soon.</p>',
    ctaUrl: resetUrl,
    ctaText: 'Reset password',
  });
};

exports.eventReminderEmailTemplate = ({ appName, eventName, date, time, location, websiteUrl }) => {
  const brandName = appName || 'EventFlow';
  const title = `${eventName || 'Your event'} starts soon`;
  const detailRows = [
    ['Event', eventName || 'Upcoming event'],
    ['Date', date || 'To be announced'],
    ['Time', time || 'To be announced'],
    ['Location', location || 'Online'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 10px;color:#6b7280;width:84px;">${escapeHtml(label)}</td><td style="padding:8px 10px;color:#111827;font-weight:600;">${escapeHtml(value)}</td></tr>`
    )
    .join('');

  return baseTemplate({
    title,
    preheader: `Reminder from ${brandName}: ${eventName || 'your event'} starts within 24 hours.`,
    bodyHtml: `
      <p class="p">Hi there,</p>
      <p class="p">This is a quick ${escapeHtml(brandName)} reminder that you are registered for an event starting within the next 24 hours.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:14px 0;">
        ${detailRows}
      </table>
      <p class="p">We hope you have a great experience.</p>
      <p class="muted">EventFlow keeps your registrations and event updates in one place.</p>
    `,
    ctaUrl: websiteUrl,
    ctaText: 'Open event link',
  });
};

exports.eventRegistrationNotificationEmailTemplate = ({
  appName,
  eventName,
  attendeeName,
  attendeeEmail,
  date,
  time,
  location,
  websiteUrl,
}) => {
  const brandName = appName || 'EventFlow';
  const title = `New registration for ${eventName || 'your event'}`;
  const detailRows = [
    ['User', attendeeName || 'Registered user'],
    ['Email', attendeeEmail || 'Not available'],
    ['Event', eventName || 'Event'],
    ['Date', date || 'To be announced'],
    ['Time', time || 'To be announced'],
    ['Location', location || 'Online'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 10px;color:#6b7280;width:84px;">${escapeHtml(label)}</td><td style="padding:8px 10px;color:#111827;font-weight:600;">${escapeHtml(value)}</td></tr>`
    )
    .join('');

  return baseTemplate({
    title,
    preheader: `${attendeeName || 'A user'} registered to this event on ${brandName}.`,
    bodyHtml: `
      <p class="p">Hi there,</p>
      <p class="p">${escapeHtml(attendeeName || 'A user')} registered to this event.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:14px 0;">
        ${detailRows}
      </table>
      <p class="muted">This notification was sent by ${escapeHtml(brandName)}.</p>
    `,
    ctaUrl: websiteUrl,
    ctaText: 'Open event link',
  });
};

exports.eventRegistrationConfirmationEmailTemplate = ({
  appName,
  eventName,
  attendeeName,
  date,
  time,
  location,
  websiteUrl,
}) => {
  const brandName = appName || 'EventFlow';
  const title = `You are registered for ${eventName || 'your event'}`;
  const detailRows = [
    ['Event', eventName || 'Event'],
    ['Date', date || 'To be announced'],
    ['Time', time || 'To be announced'],
    ['Location', location || 'Online'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 10px;color:#6b7280;width:84px;">${escapeHtml(label)}</td><td style="padding:8px 10px;color:#111827;font-weight:600;">${escapeHtml(value)}</td></tr>`
    )
    .join('');

  return baseTemplate({
    title,
    preheader: `Your registration is confirmed on ${brandName}.`,
    bodyHtml: `
      <p class="p">Hi ${escapeHtml(attendeeName || 'there')},</p>
      <p class="p">You have successfully registered for this event.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:14px 0;">
        ${detailRows}
      </table>
      <p class="muted">${escapeHtml(brandName)} will also send you a reminder when the event is within 24 hours.</p>
    `,
    ctaUrl: websiteUrl,
    ctaText: 'Open event link',
  });
};
