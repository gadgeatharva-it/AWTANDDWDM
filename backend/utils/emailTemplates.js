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

exports.passwordResetOtpEmailTemplate = ({ appName, otp, expiresMinutes }) => {
  const title = `Your password reset code for ${appName || 'your account'}`;
  const safeOtp = String(otp || '').trim();
  const safeMinutes = Number.isFinite(Number(expiresMinutes)) ? Number(expiresMinutes) : 10;

  return baseTemplate({
    title,
    preheader: 'Use this code to reset your password.',
    bodyHtml: `<p class="p">We received a request to reset your password. If you didn’t request this, you can ignore this email.</p>
<p class="p">Enter this code in the app to continue:</p>
<p class="p" style="font-size:22px; font-weight:700; letter-spacing:2px; margin: 12px 0 0;"><span class="code">${safeOtp}</span></p>
<p class="p" style="margin-top: 12px;">This code expires in ${safeMinutes} minutes.</p>`,
  });
};
