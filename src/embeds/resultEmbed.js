const { EmbedBuilder } = require('discord.js');

// TODO: Build the recruitment result embed.
function createResultEmbed() {
  return new EmbedBuilder()
    .setTitle('Recruitment Result')
    .setDescription('TODO: Add result details.');
}

module.exports = {
  createResultEmbed,
};
