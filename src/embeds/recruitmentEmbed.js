const { EmbedBuilder } = require('discord.js');

// TODO: Build the recruitment announcement embed.
function createRecruitmentEmbed() {
  return new EmbedBuilder()
    .setTitle('Recruitment')
    .setDescription('TODO: Add recruitment details.');
}

module.exports = {
  createRecruitmentEmbed,
};
