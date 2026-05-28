const { EmbedBuilder } = require('discord.js');

const EMPTY_VALUE = '없음';
const RESULT_TITLE = '🐻 GOMS 동기화 결과';
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

  return `${values.year}년 ${values.month}월 ${values.day}일`;
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
        name: '✅ 동기화 성공',
        value: `${syncedCount}명`,
        inline: true,
      },
      {
        name: '✅ 동기화 성공한 학생',
        value: formatUserList(result?.syncedUsers),
      },
      {
        name: '❌ 동기화 실패',
        value: `${failedCount}명`,
        inline: true,
      },
      {
        name: '❌ 동기화 실패한 학생',
        value: formatUserList(result?.failedUsers),
      },
    )
    .setFooter({
      text: `적용일: ${formatAppliedAt(result?.appliedAt)}`,
    });
}

function createEmptyResultEmbed() {
  return new EmbedBuilder()
    .setColor(0x2f80ed)
    .setTitle(RESULT_TITLE)
    .setDescription('수집된 Discord ID가 없어 GOMS 동기화 API를 호출하지 않았습니다.')
    .setFooter({
      text: `적용일: ${formatAppliedAt()}`,
    });
}

function createErrorResultEmbed(error) {
  const status = error?.response?.status || '없음';
  const responseData = error?.response?.data;
  const responseMessage = typeof responseData === 'string' ? responseData : responseData?.message;
  const message = responseMessage || error?.message || '알 수 없는 오류가 발생했습니다.';

  return new EmbedBuilder()
    .setColor(0xeb5757)
    .setTitle('🐻 GOMS 동기화 오류')
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
