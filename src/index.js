require('dotenv').config();

const { Client } = require('discord.js');
const discordConfig = require('./config/discord');
const { startRecruitmentCron } = require('./cron/recruitmentCron');
const discordService = require('./services/discordService');
const { handleRecruitmentCommand } = require('./services/commandService');

const client = new Client({
  intents: discordConfig.intents,
});

client.once('clientReady', (readyClient) => {
  console.log(`Discord bot logged in as ${readyClient.user.tag}`);

  try {
    startRecruitmentCron(readyClient);
  } catch (error) {
    console.error('Failed to register recruitment cron jobs:', error);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) {
    return;
  }

  try {
    await handleRecruitmentCommand(message);
  } catch (error) {
    console.error('Failed to handle message command:', error);
  }
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// TODO: Register commands and application services.
discordService.initialize(client);

client.login(discordConfig.token).catch((error) => {
  console.error('Failed to login Discord client:', error);
  process.exitCode = 1;
});

module.exports = client;
