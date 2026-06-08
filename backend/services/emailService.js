const { sendEmail } = require('../utils/email');
const {
  eventReminderEmailTemplate,
  eventRegistrationNotificationEmailTemplate,
  eventRegistrationConfirmationEmailTemplate,
} = require('../utils/emailTemplates');

function formatDateParts(dateValue) {
  const date = new Date(dateValue);
  const timeZone = process.env.EVENT_TIME_ZONE || process.env.TZ || 'Asia/Kolkata';

  if (Number.isNaN(date.getTime())) {
    return { date: 'To be announced', time: 'To be announced' };
  }

  return {
    date: new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeZone,
    }).format(date),
    time: new Intl.DateTimeFormat('en-IN', {
      timeStyle: 'short',
      timeZone,
    }).format(date),
  };
}

async function sendEventReminderEmail({ user, event }) {
  const appName = process.env.APP_NAME || 'EventFlow';
  const { date, time } = formatDateParts(event.startDate);
  const websiteUrl = String(event.externalUrl || '').trim();

  await sendEmail({
    to: user.email,
    subject: `Reminder: ${event.title} starts within 24 hours - ${appName}`,
    html: eventReminderEmailTemplate({
      appName,
      eventName: event.title,
      date,
      time,
      location: event.location,
      websiteUrl,
    }),
  });
}

async function sendEventRegistrationNotificationEmail({ organiser, attendee, event }) {
  if (!organiser?.email) return;

  const appName = process.env.APP_NAME || 'EventFlow';
  const { date, time } = formatDateParts(event.startDate);
  const websiteUrl = String(event.externalUrl || '').trim();

  await sendEmail({
    to: organiser.email,
    subject: `New registration: ${event.title} - ${appName}`,
    html: eventRegistrationNotificationEmailTemplate({
      appName,
      eventName: event.title,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      date,
      time,
      location: event.location,
      websiteUrl,
    }),
  });
}

async function sendEventRegistrationConfirmationEmail({ attendee, event }) {
  if (!attendee?.email) return;

  const appName = process.env.APP_NAME || 'EventFlow';
  const { date, time } = formatDateParts(event.startDate);
  const websiteUrl = String(event.externalUrl || '').trim();

  await sendEmail({
    to: attendee.email,
    subject: `Registration confirmed: ${event.title} - ${appName}`,
    html: eventRegistrationConfirmationEmailTemplate({
      appName,
      eventName: event.title,
      attendeeName: attendee.name,
      date,
      time,
      location: event.location,
      websiteUrl,
    }),
  });
}

module.exports = {
  sendEmail,
  sendEventReminderEmail,
  sendEventRegistrationNotificationEmail,
  sendEventRegistrationConfirmationEmail,
};
