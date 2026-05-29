const { EmbedBuilder } = require('discord.js');

const EMPTY_VALUE = '\uc5c6\uc74c';

function createErrorResultEmbed(error) {
  const status = error?.response?.status || EMPTY_VALUE;
  const responseData = error?.response?.data;
  const responseMessage = typeof responseData === 'string' ? responseData : responseData?.message;
  const message = responseMessage || error?.message || '\uc54c \uc218 \uc5c6\ub294 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.';

  return new EmbedBuilder()
    .setColor(0xeb5757)
    .setTitle('\uD83D\uDC3B GOMS \ub3d9\uae30\ud654 \uc624\ub958')
    .addFields(
      {
        name: 'status',
        value: String(status),
        inline: true,
      },
      {
        name: 'message',
        value: String(message),
      },
    );
}

module.exports = {
  createErrorResultEmbed,
};
