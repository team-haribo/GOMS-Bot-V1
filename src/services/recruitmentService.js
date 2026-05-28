const discordConfig = require('../config/discord');
const { createRecruitmentEmbed } = require('../embeds/recruitmentEmbed');
const {
  getCurrentRecruitmentMessageId,
  setCurrentRecruitmentMessageId,
} = require('../storage/recruitmentStore');

const PARTICIPATION_REACTION_EMOJI = '\u{1F64B}';

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

async function collectRecruitmentParticipants(client) {
  const messageId = getCurrentRecruitmentMessageId();

  if (!messageId) {
    console.log('[recruitment] Participant collection skipped because there is no current recruitment message.');
    return {
      ids: [],
      usernames: [],
    };
  }

  if (!discordConfig.recruitmentChannelId) {
    throw new Error('DISCORD_RECRUITMENT_CHANNEL_ID is not configured.');
  }

  const channel = await client.channels.fetch(discordConfig.recruitmentChannelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error('Configured recruitment channel is not a text-based channel.');
  }

  const message = await channel.messages.fetch(messageId);
  const reaction = message.reactions.cache.find(
    (cachedReaction) => cachedReaction.emoji.name === PARTICIPATION_REACTION_EMOJI,
  );

  if (!reaction) {
    console.log('[recruitment] Participant collection skipped because the participation reaction was not found.');
    return {
      ids: [],
      usernames: [],
    };
  }

  const users = await reaction.users.fetch();
  const participants = users.filter((user) => user.id !== client.user.id);
  const ids = participants.map((user) => user.id);
  const usernames = participants.map((user) => user.username);

  console.log(`[recruitment] Participant count: ${participants.size}`);
  console.log(`[recruitment] Participant Discord IDs: ${ids.join(', ') || '(none)'}`);
  console.log(`[recruitment] Participant usernames: ${usernames.join(', ') || '(none)'}`);

  return {
    ids,
    usernames,
  };
}

module.exports = {
  collectRecruitmentParticipants,
  sendRecruitmentMessage,
};
