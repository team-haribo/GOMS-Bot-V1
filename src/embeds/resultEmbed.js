const { EmbedBuilder } = require('discord.js');

const EMPTY_VALUE = '\uc5c6\uc74c';
const RESULT_TITLE = '\uD83D\uDC3B GOMS \ub3d9\uae30\ud654 \uacb0\uacfc';
const MULTILINE_LIST_THRESHOLD = 3;

function formatSeoulDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'Asia/Seoul',
    year: '2-digit',
  }).formatToParts(date);

  const values = parts.reduce((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});

  return `${values.year}\ub144 ${values.month}\uc6d4 ${values.day}\uc77c`;
}

function formatAppliedAt(appliedAt) {
  return appliedAt || formatSeoulDate();
}

function formatUser(user) {
  if (typeof user === 'string') {
    return user;
  }

  if (!user || typeof user !== 'object') {
    return String(user);
  }

  return (
    user.name ||
    user.studentName ||
    user.username ||
    user.userName ||
    user.discordUsername ||
    user.discordUserId ||
    user.id ||
    JSON.stringify(user)
  );
}

function formatUserList(users) {
  if (!Array.isArray(users) || !users.length) {
    return EMPTY_VALUE;
  }

  const formattedUsers = users.map(formatUser);

  if (formattedUsers.length > MULTILINE_LIST_THRESHOLD) {
    return formattedUsers.map((user) => `- ${user}`).join('\n');
  }

  return formattedUsers.join(', ');
}

function createResultEmbed(result) {
  const syncedCount = result?.syncedCount || 0;
  const failedCount = result?.failedCount || 0;

  return new EmbedBuilder()
    .setColor(failedCount ? 0xf2994a : 0x27ae60)
    .setTitle(RESULT_TITLE)
    .addFields(
      {
        name: '\u2705 \ub3d9\uae30\ud654 \uc131\uacf5',
        value: `${syncedCount}\uba85`,
        inline: true,
      },
      {
        name: '\u2705 \ub3d9\uae30\ud654 \uc131\uacf5\ud55c \ud559\uc0dd',
        value: formatUserList(result?.syncedUsers),
      },
      {
        name: '\u274C \ub3d9\uae30\ud654 \uc2e4\ud328',
        value: `${failedCount}\uba85`,
        inline: true,
      },
      {
        name: '\u274C \ub3d9\uae30\ud654 \uc2e4\ud328\ud55c \ud559\uc0dd',
        value: formatUserList(result?.failedUsers),
      },
    )
    .setFooter({
      text: `\uc801\uc6a9\uc77c: ${formatAppliedAt(result?.appliedAt)}`,
    });
}

function createEmptyResultEmbed() {
  return new EmbedBuilder()
    .setColor(0x2f80ed)
    .setTitle(RESULT_TITLE)
    .setDescription('\uc218\uc9d1\ub41c Discord ID\uac00 \uc5c6\uc5b4 GOMS \ub3d9\uae30\ud654 API\ub97c \ud638\ucd9c\ud558\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.')
    .setFooter({
      text: `\uc801\uc6a9\uc77c: ${formatAppliedAt()}`,
    });
}

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
  createEmptyResultEmbed,
  createErrorResultEmbed,
  createResultEmbed,
};
