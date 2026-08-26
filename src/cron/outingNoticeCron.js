const cron = require('node-cron');
const { sendOutingNotice } = require('../services/outingNoticeService');
const { isAutoSendEnabled } = require('../storage/automationStore');

const TIMEZONE = 'Asia/Seoul';
const DEFAULT_OUTING_NOTICE_CRON = '10 13 * * 1,3';

function getOutingNoticeCronConfig() {
  return {
    expression: process.env.OUTING_NOTICE_CRON || DEFAULT_OUTING_NOTICE_CRON,
    timezone: TIMEZONE,
  };
}

function createOutingNoticeCronJob(
  client,
  expression,
  schedule = cron.schedule,
  sendNotice = sendOutingNotice,
) {
  return schedule(
    expression,
    async () => {
      if (!isAutoSendEnabled()) {
        console.log('[CRON] Outing notice send skipped because auto-send is disabled.');
        return;
      }

      try {
        const message = await sendNotice(client);
        console.log(`[CRON] Outing notice sent: ${message.id}`);
      } catch (error) {
        console.error('[CRON] Failed to send outing notice:', error);
      }
    },
    {
      timezone: TIMEZONE,
    },
  );
}

function startOutingNoticeCron(client) {
  const { expression, timezone } = getOutingNoticeCronConfig();
  const job = createOutingNoticeCronJob(client, expression);

  console.log(`[CRON] Registered outing notice schedule: ${expression} (${timezone})`);
  return job;
}

module.exports = {
  DEFAULT_OUTING_NOTICE_CRON,
  TIMEZONE,
  createOutingNoticeCronJob,
  getOutingNoticeCronConfig,
  startOutingNoticeCron,
};
