const { GatewayIntentBits } = require('discord.js');

// TODO: Add Discord-specific configuration values as the bot grows.
const discordConfig = {
  token: process.env.DISCORD_BOT_TOKEN,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
};

module.exports = discordConfig;
