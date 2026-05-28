const discordConfig = require('../config/discord');
const { createRecruitmentEmbed } = require('../embeds/recruitmentEmbed');
const {
  getCurrentRecruitmentMessageId,
  setCurrentRecruitmentMessageId,
  setParticipants,
} = require('../storage/recruitmentStore');

const PARTICIPATION_REACTION_EMOJI = '\u{1F64B}';
const UNKNOWN_MESSAGE_ERROR_CODE = 10008;

function createEmptyParticipantsResult() {
  return {
    ids: [],
    usernames: [],
  };
}

function saveParticipants(result) {
  setParticipants(result);

  return result;
}

// TODO: Add duplicate-send prevention before wiring this into cron.
async function sendRecruitmentMessage(client) {
  if (!discordConfig.recruitmentChannelId) {
    throw new Error('DISCORD_RECRUITMENT_CHANNEL_ID is not configured.');
  }

  const channel = await client.channels.fetch(discordConfig.recruitmentChannelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error('Configured recruitment channel is not a text-based channel.');
  }

  const message = await channel.send({
    content: '@everyone',
    embeds: [createRecruitmentEmbed()],
    allowedMentions: {
      parse: ['everyone'],
    },
  });

  await message.react(PARTICIPATION_REACTION_EMOJI);
  setCurrentRecruitmentMessageId(message.id);

  return message;
}

async function findLatestRecruitmentMessageFromHistory(client, channel) {
  console.log('[recruitment] No current recruitment message ID in memory. Searching channel history...');

  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const message = messages.find(
      (historyMessage) =>
        historyMessage.author.id === client.user.id &&
        historyMessage.reactions.cache.some(
          (reaction) => reaction.emoji.name === PARTICIPATION_REACTION_EMOJI,
        ),
    );

    if (message) {
      setCurrentRecruitmentMessageId(message.id);
      console.log(`[recruitment] Found latest recruitment message from history: ${message.id}`);
    }

    return message || null;
  } catch (error) {
    console.error('[recruitment] Failed to fetch channel history for fallback:', error);
    return null;
  }
}

async function fetchRecruitmentMessage(client, channel) {
  const messageId = getCurrentRecruitmentMessageId();

  if (!messageId) {
    return findLatestRecruitmentMessageFromHistory(client, channel);
  }

  try {
    return await channel.messages.fetch(messageId);
  } catch (error) {
    if (error.code === UNKNOWN_MESSAGE_ERROR_CODE) {
      console.warn(`[recruitment] Message with ID ${messageId} was not found. Searching channel history...`);
      setCurrentRecruitmentMessageId(null);

      return findLatestRecruitmentMessageFromHistory(client, channel);
    }

    throw error;
  }
}

async function collectRecruitmentParticipants(client) {
  if (!discordConfig.recruitmentChannelId) {
    throw new Error('DISCORD_RECRUITMENT_CHANNEL_ID is not configured.');
  }

  const channel = await client.channels.fetch(discordConfig.recruitmentChannelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error('Configured recruitment channel is not a text-based channel.');
  }

  const message = await fetchRecruitmentMessage(client, channel);

  if (!message) {
    console.log('[recruitment] Participant collection skipped because no recruitment message was found.');
    return saveParticipants(createEmptyParticipantsResult());
  }

  const reaction = message.reactions.cache.find(
    (cachedReaction) => cachedReaction.emoji.name === PARTICIPATION_REACTION_EMOJI,
  );

  if (!reaction) {
    console.log('[recruitment] Participant collection skipped because the participation reaction was not found.');
    return saveParticipants(createEmptyParticipantsResult());
  }

  const users = await reaction.users.fetch();
  const participants = users.filter((user) => user.id !== client.user.id);
  const ids = participants.map((user) => user.id);
  const usernames = participants.map((user) => user.username);

  console.log(`[recruitment] Participant count: ${participants.size}`);
  console.log(`[recruitment] Participant Discord IDs: ${ids.join(', ') || '(none)'}`);
  console.log(`[recruitment] Participant usernames: ${usernames.join(', ') || '(none)'}`);

  return saveParticipants({
    ids,
    usernames,
  });
}

module.exports = {
  collectRecruitmentParticipants,
  sendRecruitmentMessage,
};
