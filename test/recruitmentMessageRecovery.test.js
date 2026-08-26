const assert = require('node:assert/strict');
const test = require('node:test');
const { Collection } = require('discord.js');

process.env.DISCORD_RECRUITMENT_CHANNEL_ID = 'recruitment-channel';
process.env.DISCORD_REACTION_EMOJI = '\u{1F64B}';

const { RECRUITMENT_TITLE } = require('../src/embeds/recruitmentEmbed');
const {
  fetchRecruitmentMessage,
  fetchRecruitmentParticipants,
  findLatestRecruitmentMessageFromHistory,
} = require('../src/services/recruitmentService');
const {
  getCurrentRecruitmentMessageId,
  setCurrentRecruitmentMessageId,
} = require('../src/storage/recruitmentStore');

const BOT_ID = 'recruitment-bot';
const OTHER_BOT_ID = 'other-bot';

function createParticipationReaction(users) {
  return {
    emoji: {
      id: null,
      name: '\u{1F64B}',
      toString: () => '\u{1F64B}',
    },
    users: {
      fetch: async () => users || new Collection(),
    },
  };
}

function createMessage(id, options = {}) {
  const reactions = new Collection();

  if (options.hasReaction !== false) {
    reactions.set('participation', createParticipationReaction(options.users));
  }

  return {
    id,
    author: {
      id: options.authorId || OTHER_BOT_ID,
    },
    embeds: [
      {
        title: options.isRecruitment ? RECRUITMENT_TITLE : '다른 봇 메시지',
      },
    ],
    reactions: {
      cache: reactions,
    },
  };
}

function createPage(messages) {
  const page = new Collection();

  for (const message of messages) {
    page.set(message.id, message);
  }

  return page;
}

function createNonRecruitmentMessages(count, prefix = 'other') {
  return Array.from({ length: count }, (_, index) =>
    createMessage(`${prefix}-${index}`, { authorId: OTHER_BOT_ID }),
  );
}

function createHistoryClient({ pages = [], directMessage, directError } = {}) {
  const fetchCalls = [];
  const channel = {
    isTextBased: () => true,
    messages: {
      fetch: async (options) => {
        fetchCalls.push(options);

        if (typeof options === 'string') {
          if (directError) {
            throw directError;
          }

          return directMessage;
        }

        return pages.shift() || new Collection();
      },
    },
  };

  return {
    client: {
      user: {
        id: BOT_ID,
      },
      channels: {
        fetch: async () => channel,
      },
    },
    fetchCalls,
  };
}

test.beforeEach(() => {
  setCurrentRecruitmentMessageId(null);
});

test('fetches a stored message directly before trying history', async () => {
  const directMessage = createMessage('stored-message', {
    authorId: BOT_ID,
    isRecruitment: true,
  });
  const fake = createHistoryClient({ directMessage });
  const channel = await fake.client.channels.fetch('recruitment-channel');
  setCurrentRecruitmentMessageId('stored-message');

  const message = await fetchRecruitmentMessage(fake.client, channel);

  assert.equal(message.id, 'stored-message');
  assert.deepEqual(fake.fetchCalls, ['stored-message']);
});

test('finds a recruitment message in the first 100-message page', async () => {
  const latestMessage = createMessage('latest-recruitment', {
    authorId: BOT_ID,
    isRecruitment: true,
  });
  const fake = createHistoryClient({
    pages: [createPage([latestMessage, ...createNonRecruitmentMessages(99)])],
  });
  const channel = await fake.client.channels.fetch('recruitment-channel');

  const message = await findLatestRecruitmentMessageFromHistory(fake.client, channel);

  assert.equal(message.id, 'latest-recruitment');
  assert.equal(fake.fetchCalls.length, 1);
  assert.equal(getCurrentRecruitmentMessageId(), 'latest-recruitment');
});

test('finds a recruitment message in the second page and uses the previous page cursor', async () => {
  const firstPage = createNonRecruitmentMessages(100, 'page-1');
  const secondPageMessage = createMessage('second-page-recruitment', {
    authorId: BOT_ID,
    isRecruitment: true,
  });
  const fake = createHistoryClient({
    pages: [
      createPage(firstPage),
      createPage([secondPageMessage, ...createNonRecruitmentMessages(99, 'page-2')]),
    ],
  });
  const channel = await fake.client.channels.fetch('recruitment-channel');

  const message = await findLatestRecruitmentMessageFromHistory(fake.client, channel);

  assert.equal(message.id, 'second-page-recruitment');
  assert.equal(fake.fetchCalls.length, 2);
  assert.deepEqual(fake.fetchCalls[0], { limit: 100 });
  assert.deepEqual(fake.fetchCalls[1], { limit: 100, before: 'page-1-99' });
});

test('searches through the fifth page when the recruitment message is in messages 401-500', async () => {
  const target = createMessage('fifth-page-recruitment', {
    authorId: BOT_ID,
    isRecruitment: true,
  });
  const fake = createHistoryClient({
    pages: [
      createPage(createNonRecruitmentMessages(100, 'page-1')),
      createPage(createNonRecruitmentMessages(100, 'page-2')),
      createPage(createNonRecruitmentMessages(100, 'page-3')),
      createPage(createNonRecruitmentMessages(100, 'page-4')),
      createPage([target, ...createNonRecruitmentMessages(99, 'page-5')]),
    ],
  });
  const channel = await fake.client.channels.fetch('recruitment-channel');

  const message = await findLatestRecruitmentMessageFromHistory(fake.client, channel);

  assert.equal(message.id, 'fifth-page-recruitment');
  assert.equal(fake.fetchCalls.length, 5);
});

test('stops after 500 messages when no recruitment message exists', async () => {
  const fake = createHistoryClient({
    pages: Array.from({ length: 5 }, (_, pageIndex) =>
      createPage(createNonRecruitmentMessages(100, `page-${pageIndex + 1}`)),
    ),
  });
  const channel = await fake.client.channels.fetch('recruitment-channel');

  const message = await findLatestRecruitmentMessageFromHistory(fake.client, channel);

  assert.equal(message, null);
  assert.equal(fake.fetchCalls.length, 5);
  assert.equal(getCurrentRecruitmentMessageId(), null);
});

test('stops when the channel reaches a page with fewer than 100 messages', async () => {
  const fake = createHistoryClient({
    pages: [
      createPage(createNonRecruitmentMessages(100, 'full-page')),
      createPage(createNonRecruitmentMessages(40, 'short-page')),
    ],
  });
  const channel = await fake.client.channels.fetch('recruitment-channel');

  const message = await findLatestRecruitmentMessageFromHistory(fake.client, channel);

  assert.equal(message, null);
  assert.equal(fake.fetchCalls.length, 2);
});

test('does not mistake another bot message with the same reaction for recruitment', async () => {
  const misleadingMessage = createMessage('misleading-message', {
    authorId: BOT_ID,
    isRecruitment: false,
  });
  const actualRecruitmentMessage = createMessage('actual-recruitment', {
    authorId: BOT_ID,
    isRecruitment: true,
  });
  const fake = createHistoryClient({
    pages: [
      createPage([misleadingMessage, ...createNonRecruitmentMessages(99, 'page-1')]),
      createPage([actualRecruitmentMessage, ...createNonRecruitmentMessages(99, 'page-2')]),
    ],
  });
  const channel = await fake.client.channels.fetch('recruitment-channel');

  const message = await findLatestRecruitmentMessageFromHistory(fake.client, channel);

  assert.equal(message.id, 'actual-recruitment');
  assert.equal(fake.fetchCalls.length, 2);
});

test('selects the newest recruitment message in a page', async () => {
  const newest = createMessage('newest-recruitment', {
    authorId: BOT_ID,
    isRecruitment: true,
  });
  const older = createMessage('older-recruitment', {
    authorId: BOT_ID,
    isRecruitment: true,
  });
  const fake = createHistoryClient({
    pages: [createPage([newest, older, ...createNonRecruitmentMessages(98)])],
  });
  const channel = await fake.client.channels.fetch('recruitment-channel');

  const message = await findLatestRecruitmentMessageFromHistory(fake.client, channel);

  assert.equal(message.id, 'newest-recruitment');
});

test('falls back after Unknown Message and restores the discovered message ID', async () => {
  const recoveredMessage = createMessage('recovered-recruitment', {
    authorId: BOT_ID,
    isRecruitment: true,
  });
  const fake = createHistoryClient({
    directError: { code: 10008 },
    pages: [createPage([recoveredMessage])],
  });
  const channel = await fake.client.channels.fetch('recruitment-channel');
  setCurrentRecruitmentMessageId('deleted-message');

  const message = await fetchRecruitmentMessage(fake.client, channel);

  assert.equal(message.id, 'recovered-recruitment');
  assert.deepEqual(fake.fetchCalls, ['deleted-message', { limit: 100 }]);
  assert.equal(getCurrentRecruitmentMessageId(), 'recovered-recruitment');
});

test('handles a history API error without throwing', async () => {
  const fake = createHistoryClient({
    pages: [],
  });
  const channel = {
    messages: {
      fetch: async () => {
        throw new Error('history unavailable');
      },
    },
  };

  await assert.doesNotReject(async () => {
    const message = await findLatestRecruitmentMessageFromHistory(fake.client, channel);
    assert.equal(message, null);
  });
});

test('fetches reaction users only from the selected recruitment message', async () => {
  const users = new Collection();
  users.set('participant-1', { id: 'participant-1', username: 'student-one', bot: false });
  users.set('participant-2', { id: 'participant-2', username: 'student-two', bot: false });
  users.set('another-bot', { id: 'another-bot', username: 'bot', bot: true });

  const recruitmentMessage = createMessage('selected-recruitment', {
    authorId: BOT_ID,
    isRecruitment: true,
    users,
  });
  const fake = createHistoryClient({ directMessage: recruitmentMessage });
  const channel = await fake.client.channels.fetch('recruitment-channel');
  setCurrentRecruitmentMessageId('selected-recruitment');

  const result = await fetchRecruitmentParticipants(fake.client);

  assert.deepEqual(result.participants, {
    ids: ['participant-1', 'participant-2'],
    usernames: ['student-one', 'student-two'],
  });
  assert.deepEqual(fake.fetchCalls, ['selected-recruitment']);
  assert.ok(channel);
});
