const cron = require('node-cron');
const {
  collectRecruitmentParticipants,
  sendRecruitmentMessage,
} = require('../services/recruitmentService');
const { isAutoSendEnabled } = require('../storage/recruitmentStore');

const TIMEZONE = 'Asia/Seoul';
const DEFAULT_MONDAY_SEND_CRON = '30 9 * * 1';
const DEFAULT_WEDNESDAY_SEND_CRON = '30 9 * * 3';
const DEFAULT_MONDAY_COLLECT_CRON = '20 18 * * 1';
const DEFAULT_WEDNESDAY_COLLECT_CRON = '20 18 * * 3';

function createRecruitmentCronJob(client, label, expression) {
  return cron.schedule(
    expression,
    async () => {
      if (!isAutoSendEnabled()) {
        console.log(`[CRON] ${label} send skipped because auto-send is disabled.`);
        return;
      }

      try {
        const message = await sendRecruitmentMessage(client);
        console.log(`[CRON] ${label} recruitment message sent: ${message.id}`);
      } catch (error) {
        console.error(`[CRON] Failed to send ${label} recruitment message:`, error);
      }
    },
    {
      timezone: TIMEZONE,
    },
  );
}

function createRecruitmentCollectionCronJob(client, label, expression) {
  return cron.schedule(
    expression,
    async () => {
      if (!isAutoSendEnabled()) {
        console.log('[CRON] \uc678\ucd9c\uc81c \uc790\ub3d9 \ubc1c\uc1a1\uc774 \ube44\ud65c\uc131\ud654\ub418\uc5b4 \ucc38\uc5ec\uc790 \uc218\uc9d1 \ubc0f \uc11d\uc2dd \uc548\ub0b4\ub97c \uac74\ub108\ub701\ub2c8\ub2e4.');
        return;
      }

      try {
        await collectRecruitmentParticipants(client);
        console.log(`[CRON] ${label} participant collection completed.`);
      } catch (error) {
        console.error(`[CRON] Failed to collect ${label} recruitment participants:`, error);
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
  const mondayCollectCron = process.env.MONDAY_COLLECT_CRON || DEFAULT_MONDAY_COLLECT_CRON;
  const wednesdayCollectCron = process.env.WEDNESDAY_COLLECT_CRON || DEFAULT_WEDNESDAY_COLLECT_CRON;

  const jobs = [
    createRecruitmentCronJob(client, 'monday', mondayCron),
    createRecruitmentCronJob(client, 'wednesday', wednesdayCron),
    createRecruitmentCollectionCronJob(client, 'monday', mondayCollectCron),
    createRecruitmentCollectionCronJob(client, 'wednesday', wednesdayCollectCron),
  ];

  console.log(`[CRON] Registered monday schedule: ${mondayCron} (${TIMEZONE})`);
  console.log(`[CRON] Registered wednesday schedule: ${wednesdayCron} (${TIMEZONE})`);
  console.log(`[CRON] Registered monday collection schedule: ${mondayCollectCron} (${TIMEZONE})`);
  console.log(`[CRON] Registered wednesday collection schedule: ${wednesdayCollectCron} (${TIMEZONE})`);

  return jobs;
}

module.exports = {
  startRecruitmentCron,
};
