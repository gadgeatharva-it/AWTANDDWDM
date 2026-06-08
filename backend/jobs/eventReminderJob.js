const cron = require('node-cron');
const { sendUpcomingEventReminders } = require('../services/reminderService');

let reminderTask = null;
let isRunning = false;

async function runReminderJob() {
  if (isRunning) {
    console.log('[event-reminders] Previous run still active; skipping this tick.');
    return;
  }

  isRunning = true;
  const startedAt = Date.now();

  try {
    const result = await sendUpcomingEventReminders();
    console.log(
      `[event-reminders] Completed in ${Date.now() - startedAt}ms: ` +
        `${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped, ` +
        `${result.pendingRegistrations} pending registrations across ${result.checkedEvents} events.`
    );
  } catch (error) {
    console.error('[event-reminders] Job failed:', error?.message || error);
  } finally {
    isRunning = false;
  }
}

function startEventReminderJob() {
  if (reminderTask) return reminderTask;

  if (process.env.DISABLE_EVENT_REMINDERS === 'true') {
    console.log('[event-reminders] Disabled by DISABLE_EVENT_REMINDERS=true');
    return null;
  }

  reminderTask = cron.schedule('0 * * * *', runReminderJob);
  console.log('[event-reminders] Scheduled hourly event reminder job.');

  if (process.env.RUN_EVENT_REMINDERS_ON_STARTUP === 'true') {
    setTimeout(runReminderJob, 1000);
  }

  return reminderTask;
}

module.exports = {
  runReminderJob,
  startEventReminderJob,
};
