const discordConfig = require('../config/discord');
const { createRecruitmentEmbed } = require('../embeds/recruitmentEmbed');

// TODO: Add duplicate-send prevention before wiring this into cron.
async function sendRecruitmentMessage(client) {
  if (!discordConfig.recruitmentChannelId) {
    throw new Error('DISCORD_RECRUITMENT_CHANNEL_ID is not configured.');
  }

  if (!discordConfig.reactionEmoji) {
    throw new Error('DISCORD_REACTION_EMOJI is not configured.');
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

  await message.react(discordConfig.reactionEmoji);

  return message;
}

module.exports = {
  sendRecruitmentMessage,
};
