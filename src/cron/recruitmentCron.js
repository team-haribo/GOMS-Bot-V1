const cron = require('node-cron');
const { sendRecruitmentMessage } = require('../services/recruitmentService');
const { isAutoSendEnabled } = require('../storage/recruitmentStore');

const TIMEZONE = 'Asia/Seoul';
const DEFAULT_MONDAY_SEND_CRON = '30 9 * * 1';
const DEFAULT_WEDNESDAY_SEND_CRON = '30 9 * * 3';

function createRecruitmentCronJob(client, label, expression) {
  return cron.schedule(
    expression,
    async () => {
      if (!isAutoSendEnabled()) {
        console.log(`[recruitment-cron] ${label} send skipped because auto-send is disabled.`);
        return;
      }

      try {
        const message = await sendRecruitmentMessage(client);
        console.log(`[recruitment-cron] ${label} recruitment message sent: ${message.id}`);
      } catch (error) {
        console.error(`[recruitment-cron] Failed to send ${label} recruitment message:`, error);
      }
    },
    {
      timezone: TIMEZONE,
    },
  );
}

function startRecruitmentCron(client) {
  const mondayCron = process.env.MONDAY_SEND_CRON || DEFAULT_MONDAY_SEND_CRON;
  const wednesdayCron = process.env.WEDNESDAY_SEND_CRON || DEFAULT_WEDNESDAY_SEND_CRON;

  const jobs = [
    createRecruitmentCronJob(client, 'monday', mondayCron),
    createRecruitmentCronJob(client, 'wednesday', wednesdayCron),
  ];

  console.log(`[recruitment-cron] Registered monday schedule: ${mondayCron} (${TIMEZONE})`);
  console.log(`[recruitment-cron] Registered wednesday schedule: ${wednesdayCron} (${TIMEZONE})`);

  return jobs;
}

module.exports = {
  startRecruitmentCron,
};
