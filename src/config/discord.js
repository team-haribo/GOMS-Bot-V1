const { GatewayIntentBits } = require('discord.js');

// TODO: Add Discord-specific configuration values as the bot grows.
const discordConfig = {
  token: process.env.DISCORD_BOT_TOKEN,
  recruitmentChannelId: process.env.DISCORD_RECRUITMENT_CHANNEL_ID,
  outingNoticeChannelId: process.env.DISCORD_OUTING_NOTICE_CHANNEL_ID,
  outingNoticeRoleIds: [
    process.env.DISCORD_GRADE_1_ROLE_ID,
    process.env.DISCORD_GRADE_2_ROLE_ID,
    process.env.DISCORD_GRADE_3_ROLE_ID,
  ],
  reactionEmoji: process.env.DISCORD_REACTION_EMOJI,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
};

module.exports = discordConfig;
