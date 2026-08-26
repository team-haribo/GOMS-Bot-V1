const discordConfig = require('../config/discord');
const {
  getLatestOutingNoticeMessageId,
  setLatestOutingNoticeMessageId,
} = require('../storage/outingNoticeStore');

const UNKNOWN_MESSAGE_ERROR_CODE = 10008;

function getOutingNoticeRoleIds() {
  const roleIds = discordConfig.outingNoticeRoleIds;

  if (roleIds.some((roleId) => !roleId)) {
    throw new Error(
      'DISCORD_GRADE_1_ROLE_ID, DISCORD_GRADE_2_ROLE_ID, and DISCORD_GRADE_3_ROLE_ID are required.',
    );
  }

  return roleIds;
}

function createOutingNoticeContent(roleIds) {
  return [
    `<@&${roleIds[0]}> <@&${roleIds[1]}> <@&${roleIds[2]}>`,
    '',
    '# :loudspeaker: 월 · 수 외출제 안내',
    '오늘은 월 · 수 외출제가 시행되는 날입니다.',
    '외출 시 반드시 GOMS를 사용하여 외출을 진행해 주세요.',
    '',
    '## :alarm_clock: 외출 가능 시간',
    '**3학년 : 18:40:00 ~ 19:25:00**',
    '**2학년 : 18:45:00 ~ 19:25:00**',
    '**1학년 : 18:50:00 ~ 19:25:00**',
    '',
    '## :pushpin: 외출 시 유의사항',
    '* 석식 식사 후 외출 해주세요!',
    '* 운동화 착용 (크록스, 쪼리, 샌들 안됩니다!!)',
    '* 흡연, 음주 등 학생신분에 맞지 않는 행동 금지',
    '* 쓰레기 무단 투기 금지',
    '* 배달음식 금지',
    '* 카페 음료, 햄버거 등 외부 음식과 쓰레기는 가급적 외부에서 처리 후 복귀해주시기 바랍니다.',
    '불가피한 반입 후에는 확실한 쓰레기 처리 부탁드립니다.',
    '',
    '## :no_entry_sign: 라면 반입 금지',
    '외출 시 라면을 구매해 학교로 가져오는 경우 압수 조치되며',
    '이로 인한 검문이 시행 될 수 있음을 미리 안내드립니다.',
    '',
    '## :warning: 외출제 복귀시간 준수',
    '외출 복귀 시간(19시 25분 00초)을 준수하지 못할 경우',
    '2주간의 **외출 금지**와 더불어 **4장의 반성문 작성과 4번의 피켓 봉사**를 시행하셔야 하니',
    '반드시 외출제 이용시 지각하지 않게 주의해주세요.',
    '',
    '### GSM 학생으로서 책임감 있는 외출 부탁드립니다.',
  ].join('\n');
}

function createOutingNoticeMessagePayload(roleIds) {
  return {
    content: createOutingNoticeContent(roleIds),
    allowedMentions: {
      parse: [],
      roles: roleIds,
    },
  };
}

async function deletePreviousOutingNotice(channel, previousMessageId) {
  if (!previousMessageId) {
    return;
  }

  try {
    const previousMessage = await channel.messages.fetch(previousMessageId);
    await previousMessage.delete();
    console.log(`[OUTING_NOTICE] Previous notice deleted: ${previousMessageId}`);
  } catch (error) {
    if (error.code === UNKNOWN_MESSAGE_ERROR_CODE) {
      console.warn(`[OUTING_NOTICE] Previous notice was already deleted: ${previousMessageId}`);
      return;
    }

    console.error(`[OUTING_NOTICE] Failed to delete previous notice ${previousMessageId}:`, error);
  }
}

async function sendOutingNotice(client) {
  if (!discordConfig.outingNoticeChannelId) {
    throw new Error('DISCORD_OUTING_NOTICE_CHANNEL_ID is not configured.');
  }

  const roleIds = getOutingNoticeRoleIds();
  const channel = await client.channels.fetch(discordConfig.outingNoticeChannelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error('Configured outing notice channel is not a text-based channel.');
  }

  const previousMessageId = getLatestOutingNoticeMessageId();
  const message = await channel.send(createOutingNoticeMessagePayload(roleIds));

  setLatestOutingNoticeMessageId(message.id);
  await deletePreviousOutingNotice(channel, previousMessageId);

  console.log(`[OUTING_NOTICE] Notice sent: ${message.id}`);
  return message;
}

module.exports = {
  createOutingNoticeContent,
  createOutingNoticeMessagePayload,
  sendOutingNotice,
};
