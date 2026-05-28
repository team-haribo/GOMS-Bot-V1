const { EmbedBuilder } = require('discord.js');

const RECRUITMENT_TITLE = '\uc624\ub298 \uc678\ucd9c\uc81c \uad00\ub9ac\uc5d0 \ucc38\uc5ec\ud560 \uc778\uc6d0\uc744 \ubaa8\uc9d1\ud569\ub2c8\ub2e4.';
const RECRUITMENT_DESCRIPTION =
  '\ud574\ub2f9 \uba54\uc2dc\uc9c0\uc758 \uc774\ubaa8\uc9c0\ub97c \ud074\ub9ad\ud558\uc5ec \uc678\ucd9c\uc81c \uad00\ub9ac\uc5d0 \ucc38\uc5ec\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.';

// TODO: Replace static copy with recruitment data from the GOMS API.
function createRecruitmentEmbed() {
  return new EmbedBuilder()
    .setColor(0x2f80ed)
    .setTitle(RECRUITMENT_TITLE)
    .setDescription(RECRUITMENT_DESCRIPTION);
}

module.exports = {
  createRecruitmentEmbed,
};
