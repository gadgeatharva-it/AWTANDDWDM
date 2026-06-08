const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { sendEventReminderEmail } = require('./emailService');

const WINDOW_HOURS = 24;

function asLogMessage(error) {
  return error?.message ? String(error.message) : String(error || 'Unknown error');
}

async function getUpcomingPublishedEventIds(now, windowEnd) {
  const events = await Event.find({
    status: 'published',
    startDate: {
      $gt: now,
      $lte: windowEnd,
    },
  })
    .select('_id title startDate location externalUrl status')
    .lean();

  return events.map((event) => event._id);
}

async function findPendingReminderRegistrations(eventIds) {
  if (!eventIds.length) return [];

  return Registration.find({
    event: { $in: eventIds },
    status: 'confirmed',
    reminderSent: { $ne: true },
  })
    .populate('event', 'title startDate location externalUrl status')
    .populate('attendee', 'name email isActive')
    .sort({ createdAt: 1 })
    .lean();
}

async function claimRegistrationForReminder(registrationId) {
  return Registration.findOneAndUpdate(
    {
      _id: registrationId,
      status: 'confirmed',
      reminderSent: { $ne: true },
    },
    {
      $set: {
        reminderSent: true,
        reminderSentAt: new Date(),
        reminderLastError: '',
      },
    },
    { new: true }
  );
}

async function resetReminderClaim(registrationId, error) {
  await Registration.findByIdAndUpdate(registrationId, {
    $set: {
      reminderSent: false,
      reminderSentAt: null,
      reminderLastError: asLogMessage(error).slice(0, 500),
    },
  });
}

async function sendUpcomingEventReminders({ now = new Date() } = {}) {
  const windowEnd = new Date(now.getTime() + WINDOW_HOURS * 60 * 60 * 1000);
  const eventIds = await getUpcomingPublishedEventIds(now, windowEnd);
  const pendingRegistrations = await findPendingReminderRegistrations(eventIds);

  const result = {
    checkedEvents: eventIds.length,
    pendingRegistrations: pendingRegistrations.length,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  for (const registration of pendingRegistrations) {
    const event = registration.event;
    const attendee = registration.attendee;

    if (!event || event.status !== 'published' || !attendee?.email || attendee.isActive === false) {
      result.skipped += 1;
      continue;
    }

    const claimed = await claimRegistrationForReminder(registration._id);
    if (!claimed) {
      result.skipped += 1;
      continue;
    }

    try {
      await sendEventReminderEmail({ user: attendee, event });
      result.sent += 1;
      console.log(`[event-reminders] Sent reminder to ${attendee.email} for "${event.title}"`);
    } catch (error) {
      result.failed += 1;
      await resetReminderClaim(registration._id, error);
      console.error(
        `[event-reminders] Failed reminder for registration ${registration._id}:`,
        asLogMessage(error)
      );
    }
  }

  return result;
}

module.exports = {
  sendUpcomingEventReminders,
};
