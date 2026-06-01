const { EmbedBuilder } = require('discord.js');

const DINNER_NOTICE_TITLE = '\uc678\ucd9c\uc81c \uad00\ub9ac \uc778\uc6d0\uc740 \uc11d\uc2dd \uc2dd\uc0ac \ud574\uc8fc\uc138\uc694.';
const DINNER_NOTICE_DESCRIPTION =
  '\uc678\ucd9c\uc81c \uad00\ub9ac \uc778\uc6d0\uc740 \uc11d\uc2dd \uc2dd\uc0ac\ub97c \uc704\ud574 \uae09\uc2dd\uc2e4\ub85c \uc774\ub3d9\ud574 \uc8fc\uc2dc\uae30 \ubc14\ub78d\ub2c8\ub2e4.';

function createDinnerNoticeEmbed() {
  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle(DINNER_NOTICE_TITLE)
    .setDescription(DINNER_NOTICE_DESCRIPTION);
}

module.exports = {
  createDinnerNoticeEmbed,
};
