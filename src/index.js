require('dotenv').config();

const { Client } = require('discord.js');
const discordConfig = require('./config/discord');
const discordService = require('./services/discordService');

const client = new Client({
  intents: discordConfig.intents,
});

client.once('clientReady', (readyClient) => {
  console.log(`Discord bot logged in as ${readyClient.user.tag}`);
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

// TODO: Register commands, cron jobs, and application services.
discordService.initialize(client);

client.login(discordConfig.token);

module.exports = client;
