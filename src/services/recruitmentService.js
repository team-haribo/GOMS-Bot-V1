const discordConfig = require('../config/discord');
const { createDinnerNoticeEmbed } = require('../embeds/dinnerNoticeEmbed');
const {
  createRecruitmentEmbed,
  RECRUITMENT_TITLE,
} = require('../embeds/recruitmentEmbed');
const {
  createErrorResultEmbed,
  createResultEmbed,
} = require('../embeds/resultEmbed');
const { sendRecruitmentParticipants } = require('./gomsApiService');
const {
  getCurrentRecruitmentMessageId,
  setCurrentRecruitmentMessageId,
  setParticipants,
} = require('../storage/recruitmentStore');

const PARTICIPATION_REACTION_EMOJI = discordConfig.reactionEmoji || '\u{1F64B}';
const UNKNOWN_MESSAGE_ERROR_CODE = 10008;
const HISTORY_PAGE_SIZE = 100;
const MAX_HISTORY_MESSAGES = 500;

function isParticipationReaction(reaction) {
  return (
    reaction.emoji.name === PARTICIPATION_REACTION_EMOJI ||
    reaction.emoji.id === PARTICIPATION_REACTION_EMOJI ||
    reaction.emoji.toString() === PARTICIPATION_REACTION_EMOJI
  );
}

function isRecruitmentMessage(message, client) {
  return (
    message?.author?.id === client.user?.id &&
    message.embeds?.some((embed) => embed.title === RECRUITMENT_TITLE) === true &&
    message.reactions?.cache?.some(isParticipationReaction) === true
  );
}

function findRecruitmentMessage(messages, client) {
  for (const message of messages.values()) {
    if (isRecruitmentMessage(message, client)) {
      return message;
    }
  }

  return null;
}

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

async function sendResultEmbed(channel, embed) {
  await channel.send({
    embeds: [embed],
  });
}

function createDinnerNotificationContent(discordUserIds) {
  return discordUserIds.map((id) => `<@${id}>`).join(' ');
}

async function sendDinnerNotification(channel, discordUserIds) {
  if (!discordUserIds.length) {
    console.log('[RECRUITMENT] Dinner notification skipped because there are no participants.');
    return;
  }

  await channel.send({
    content: createDinnerNotificationContent(discordUserIds),
    embeds: [createDinnerNoticeEmbed()],
    allowedMentions: {
      users: discordUserIds,
    },
  });

  console.log(`[RECRUITMENT] \uc11d\uc2dd \uc548\ub0b4 \uba54\uc2dc\uc9c0 \uc804\uc1a1 \uc644\ub8cc: ${discordUserIds.length} participants`);
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
  console.log(
    `[RECRUITMENT] Searching recruitment channel history (up to ${MAX_HISTORY_MESSAGES} messages, ${HISTORY_PAGE_SIZE} per request)...`,
  );

  try {
    let before;
    let searchedCount = 0;

    while (searchedCount < MAX_HISTORY_MESSAGES) {
      const limit = Math.min(HISTORY_PAGE_SIZE, MAX_HISTORY_MESSAGES - searchedCount);
      const fetchOptions = {
        limit,
        ...(before ? { before } : {}),
      };
      const messages = await channel.messages.fetch(fetchOptions);

      if (!messages?.size) {
        break;
      }

      const fetchedMessages = [...messages.values()];
      searchedCount += fetchedMessages.length;

      const message = findRecruitmentMessage(messages, client);

      if (message) {
        setCurrentRecruitmentMessageId(message.id);
        console.log(`[RECRUITMENT] Found and restored latest recruitment message: ${message.id}`);
        return message;
      }

      const lastMessage = fetchedMessages[fetchedMessages.length - 1];

      if (!lastMessage?.id || fetchedMessages.length < limit || lastMessage.id === before) {
        break;
      }

      before = lastMessage.id;
    }

    console.log(`[RECRUITMENT] No recruitment message found in ${searchedCount} history messages.`);
    return null;
  } catch (error) {
    console.error('[RECRUITMENT] Failed to fetch channel history for fallback:', error);
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
      console.warn(`[RECRUITMENT] Message with ID ${messageId} was not found. Searching channel history...`);
      setCurrentRecruitmentMessageId(null);

      return findLatestRecruitmentMessageFromHistory(client, channel);
    }

    throw error;
  }
}

async function fetchRecruitmentParticipants(client) {
  if (!discordConfig.recruitmentChannelId) {
    throw new Error('DISCORD_RECRUITMENT_CHANNEL_ID is not configured.');
  }

  const channel = await client.channels.fetch(discordConfig.recruitmentChannelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error('Configured recruitment channel is not a text-based channel.');
  }

  const message = await fetchRecruitmentMessage(client, channel);

  if (!message) {
    console.log('[RECRUITMENT] Participant fetch skipped because no recruitment message was found.');
    return {
      channel,
      participants: createEmptyParticipantsResult(),
    };
  }

  const reaction = message.reactions.cache.find(isParticipationReaction);

  if (!reaction) {
    console.log('[RECRUITMENT] Participant fetch skipped because the participation reaction was not found.');
    return {
      channel,
      participants: createEmptyParticipantsResult(),
    };
  }

  const users = await reaction.users.fetch();
  const participants = users.filter((user) => !user.bot);
  const ids = participants.map((user) => user.id);
  const usernames = participants.map((user) => user.username);

  console.log(`[RECRUITMENT] Participant count: ${participants.size}`);
  console.log(`[RECRUITMENT] Participant Discord IDs: ${ids.join(', ') || '(none)'}`);
  console.log(`[RECRUITMENT] Participant usernames: ${usernames.join(', ') || '(none)'}`);

  return {
    channel,
    participants: {
      ids,
      usernames,
    },
  };
}

async function sendRecruitmentDinnerNotification(client) {
  const { channel, participants } = await fetchRecruitmentParticipants(client);

  await sendDinnerNotification(channel, participants.ids);
}

async function collectRecruitmentParticipants(client) {
  const { channel, participants } = await fetchRecruitmentParticipants(client);
  const result = saveParticipants(participants);
  const { ids } = result;

  if (!ids.length) {
    console.log('[RECRUITMENT] GOMS API request skipped because there are no participant Discord IDs.');
    return result;
  }

  try {
    const gomsResult = await sendRecruitmentParticipants(ids);
    await sendResultEmbed(channel, createResultEmbed(gomsResult));
    console.log('[RECRUITMENT] GOMS sync result embed sent.');
  } catch (error) {
    await sendResultEmbed(channel, createErrorResultEmbed(error));
    console.error('[RECRUITMENT] GOMS sync failed. Error embed sent.');
    throw error;
  }

  return result;
}

module.exports = {
  collectRecruitmentParticipants,
  fetchRecruitmentMessage,
  fetchRecruitmentParticipants,
  findLatestRecruitmentMessageFromHistory,
  findRecruitmentMessage,
  isParticipationReaction,
  isRecruitmentMessage,
  sendRecruitmentDinnerNotification,
  sendRecruitmentMessage,
};
