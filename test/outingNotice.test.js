const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const stateDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'goms-outing-notice-'));
process.env.OUTING_STATE_FILE = path.join(stateDirectory, 'automation-state.json');
process.env.DISCORD_OUTING_NOTICE_CHANNEL_ID = 'outing-notice-channel';
process.env.DISCORD_GRADE_1_ROLE_ID = 'grade-1-role';
process.env.DISCORD_GRADE_2_ROLE_ID = 'grade-2-role';
process.env.DISCORD_GRADE_3_ROLE_ID = 'grade-3-role';
delete process.env.OUTING_NOTICE_CRON;

const automationStore = require('../src/storage/automationStore');
const outingNoticeService = require('../src/services/outingNoticeService');
const {
  DEFAULT_OUTING_NOTICE_CRON,
  TIMEZONE,
  createOutingNoticeCronJob,
  getOutingNoticeCronConfig,
} = require('../src/cron/outingNoticeCron');

const ROLE_IDS = ['grade-1-role', 'grade-2-role', 'grade-3-role'];

function createFakeDiscordClient(options = {}) {
  const calls = [];
  const sentPayloads = [];
  let messageSequence = 0;

  const channel = {
    isTextBased: () => true,
    messages: {
      fetch: async (messageId) => {
        calls.push(`fetch:${messageId}`);

        if (options.fetchError) {
          throw options.fetchError;
        }

        return {
          delete: async () => {
            calls.push(`delete:${messageId}`);
            if (options.deleteError) {
              throw options.deleteError;
            }
          },
        };
      },
    },
    send: async (payload) => {
      calls.push('send');
      if (options.sendError) {
        throw options.sendError;
      }

      sentPayloads.push(payload);
      messageSequence += 1;
      return { id: `new-message-${messageSequence}` };
    },
  };

  return {
    client: {
      channels: {
        fetch: async (channelId) => {
          calls.push(`channel:${channelId}`);
          return channel;
        },
      },
    },
    calls,
    sentPayloads,
  };
}

test.beforeEach(() => {
  automationStore.setAutoSendEnabled(true);
  automationStore.setLatestOutingNoticeMessageId(null);
});

test('uses the Monday/Wednesday 13:10 KST schedule by default', () => {
  assert.equal(DEFAULT_OUTING_NOTICE_CRON, '10 13 * * 1,3');
  assert.deepEqual(getOutingNoticeCronConfig(), {
    expression: '10 13 * * 1,3',
    timezone: 'Asia/Seoul',
  });
  assert.equal(TIMEZONE, 'Asia/Seoul');
});

test('allows the outing notice cron expression to be overridden', () => {
  process.env.OUTING_NOTICE_CRON = '0 14 * * 1,3';
  assert.equal(getOutingNoticeCronConfig().expression, '0 14 * * 1,3');
  delete process.env.OUTING_NOTICE_CRON;
});

test('skips cron delivery while auto-send is disabled and sends when enabled', async () => {
  let scheduledJob;
  let sendCount = 0;
  const schedule = (expression, handler, options) => {
    scheduledJob = { expression, handler, options };
    return scheduledJob;
  };
  const sendNotice = async () => {
    sendCount += 1;
    return { id: 'cron-message' };
  };

  createOutingNoticeCronJob({}, DEFAULT_OUTING_NOTICE_CRON, schedule, sendNotice);
  assert.equal(scheduledJob.expression, DEFAULT_OUTING_NOTICE_CRON);
  assert.deepEqual(scheduledJob.options, { timezone: 'Asia/Seoul' });

  automationStore.setAutoSendEnabled(false);
  await scheduledJob.handler();
  assert.equal(sendCount, 0);

  automationStore.setAutoSendEnabled(true);
  await scheduledJob.handler();
  assert.equal(sendCount, 1);
});

test('sends to the independent outing channel with exactly three allowed role mentions', async () => {
  const fake = createFakeDiscordClient();

  await outingNoticeService.sendOutingNotice(fake.client);

  assert.deepEqual(fake.calls, ['channel:outing-notice-channel', 'send']);
  assert.deepEqual(fake.sentPayloads[0].allowedMentions, {
    parse: [],
    roles: ROLE_IDS,
  });
  assert.match(fake.sentPayloads[0].content, /^<@&grade-1-role> <@&grade-2-role> <@&grade-3-role>\n\n/);
  assert.match(fake.sentPayloads[0].content, /# :loudspeaker: 월 · 수 외출제 안내/);
  assert.equal(automationStore.getLatestOutingNoticeMessageId(), 'new-message-1');
});

test('sends the new notice before deleting the previous notice', async () => {
  automationStore.setLatestOutingNoticeMessageId('old-message');
  const fake = createFakeDiscordClient();

  await outingNoticeService.sendOutingNotice(fake.client);

  assert.deepEqual(fake.calls, [
    'channel:outing-notice-channel',
    'send',
    'fetch:old-message',
    'delete:old-message',
  ]);
  assert.equal(automationStore.getLatestOutingNoticeMessageId(), 'new-message-1');
});

test('keeps the previous message ID when new notice delivery fails', async () => {
  automationStore.setLatestOutingNoticeMessageId('old-message');
  const fake = createFakeDiscordClient({ sendError: new Error('send failed') });

  await assert.rejects(() => outingNoticeService.sendOutingNotice(fake.client), /send failed/);
  assert.deepEqual(fake.calls, ['channel:outing-notice-channel', 'send']);
  assert.equal(automationStore.getLatestOutingNoticeMessageId(), 'old-message');
});

test('keeps the new notice when the previous message is missing or cannot be deleted', async (t) => {
  await t.test('previous message was already deleted', async () => {
    automationStore.setLatestOutingNoticeMessageId('missing-message');
    const fake = createFakeDiscordClient({ fetchError: { code: 10008 } });

    await outingNoticeService.sendOutingNotice(fake.client);
    assert.equal(automationStore.getLatestOutingNoticeMessageId(), 'new-message-1');
  });

  await t.test('delete permission/API error', async () => {
    automationStore.setLatestOutingNoticeMessageId('old-message');
    const fake = createFakeDiscordClient({ deleteError: new Error('missing permission') });

    await outingNoticeService.sendOutingNotice(fake.client);
    assert.equal(automationStore.getLatestOutingNoticeMessageId(), 'new-message-1');
  });
});

test('persists auto-send status and latest notice ID for a later module load', () => {
  automationStore.setAutoSendEnabled(false);
  automationStore.setLatestOutingNoticeMessageId('persistent-message');

  const persisted = JSON.parse(fs.readFileSync(automationStore.stateFilePath, 'utf8'));
  assert.deepEqual(persisted, {
    autoSendEnabled: false,
    latestOutingNoticeMessageId: 'persistent-message',
  });

  delete require.cache[require.resolve('../src/storage/automationStore')];
  const reloadedStore = require('../src/storage/automationStore');
  assert.equal(reloadedStore.isAutoSendEnabled(), false);
  assert.equal(reloadedStore.getLatestOutingNoticeMessageId(), 'persistent-message');
});
