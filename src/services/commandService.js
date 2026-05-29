const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { sendRecruitmentMessage } = require('./recruitmentService');
const {
  isAutoSendEnabled,
  setAutoSendEnabled,
} = require('../storage/recruitmentStore');

const COMMAND_PREFIX = '!\uc678\ucd9c\uc81c';
const HELP_COMMAND = '!\uba85\ub839\uc5b4';
const MESSAGE_ADMIN_ONLY =
  '\uad00\ub9ac\uc790 \uad8c\ud55c\uc774 \uc788\ub294 \uc0ac\uc6a9\uc790\ub9cc \uc678\ucd9c\uc81c \ubaa8\uc9d1 \uc790\ub3d9 \ubc1c\uc1a1\uc744 \uc870\ud68c\ud558\uac70\ub098 \ubcc0\uacbd\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.';
const MESSAGE_MANUAL_RECRUITMENT_SUCCESS =
  '외출제 모집 안내 메시지를 전송했습니다. 외출제 자동 발송 상태가 ON으로 변경되었습니다.';
const MESSAGE_USAGE = '\uc0ac\uc6a9\ubc95: `!\uc678\ucd9c\uc81c`, `!\uc678\ucd9c\uc81c on`, `!\uc678\ucd9c\uc81c off`, `!\uc678\ucd9c\uc81c \ubaa8\uc9d1`';

function parseRecruitmentCommand(content) {
  const [command, action, ...rest] = content.trim().toLowerCase().split(/\s+/);

  if (command !== COMMAND_PREFIX || rest.length > 0) {
    return null;
  }

  return action || 'status';
}

function hasAdministratorPermission(message) {
  return message.member?.permissions.has(PermissionsBitField.Flags.Administrator) === true;
}

function getStatusText() {
  return isAutoSendEnabled() ? '\ucf1c\uc9d0' : '\uaebc\uc9d0';
}

async function reply(message, content) {
  await message.reply({
    content,
    allowedMentions: {
      repliedUser: false,
    },
  });
}

async function replyWithEmbed(message, embed) {
  await message.reply({
    embeds: [embed],
    allowedMentions: {
      repliedUser: false,
    },
  });
}

function createCommandHelpEmbed() {
  return new EmbedBuilder()
    .setColor(0x2f80ed)
    .setTitle('\uba85\ub839\uc5b4 \uc548\ub0b4')
    .setDescription(
      [
        '``!\uba85\ub839\uc5b4`` - \uad6c\ud604\ub41c \uba85\ub839\uc5b4\uc640 \uc124\uba85\uc744 \ubcf4\uc5ec\uc90d\ub2c8\ub2e4.',
        '``!\uc678\ucd9c\uc81c`` - \uc678\ucd9c\uc81c \ubaa8\uc9d1 \uc790\ub3d9 \ubc1c\uc1a1 \ud604\uc7ac \uc0c1\ud0dc\ub97c \ubcf4\uc5ec\uc90d\ub2c8\ub2e4. (\uad00\ub9ac\uc790 \uc804\uc6a9.)',
        '``!\uc678\ucd9c\uc81c on`` - \uc678\ucd9c\uc81c \ubaa8\uc9d1 \uc790\ub3d9 \ubc1c\uc1a1\uc744 \ucf2d\ub2c8\ub2e4. (\uad00\ub9ac\uc790 \uc804\uc6a9.)',
        '``!\uc678\ucd9c\uc81c off`` - \uc678\ucd9c\uc81c \ubaa8\uc9d1 \uc790\ub3d9 \ubc1c\uc1a1\uc744 \ub044\ub2c8\ub2e4. (\uad00\ub9ac\uc790 \uc804\uc6a9.)',
        '``!\uc678\ucd9c\uc81c \ubaa8\uc9d1`` - \uc678\ucd9c\uc81c \ubaa8\uc9d1 \uc548\ub0b4 \uba54\uc2dc\uc9c0\ub97c \uc218\ub3d9\uc73c\ub85c \uc804\uc1a1\ud558\uace0 \uc678\ucd9c\uc81c \uc0c1\ud0dc\ub97c ON\uc73c\ub85c \ubcc0\uacbd\ud569\ub2c8\ub2e4. (\uad00\ub9ac\uc790 \uc804\uc6a9.)',
      ].join('\n'),
    );
}

async function handleRecruitmentCommand(message) {
  if (message.content.trim() === HELP_COMMAND) {
    await replyWithEmbed(message, createCommandHelpEmbed());
    return true;
  }

  const action = parseRecruitmentCommand(message.content);

  if (action === null) {
    return message.content.trim().startsWith(COMMAND_PREFIX)
      ? reply(message, MESSAGE_USAGE).then(() => true)
      : false;
  }

  if (!hasAdministratorPermission(message)) {
    await reply(message, MESSAGE_ADMIN_ONLY);
    return true;
  }

  if (action === 'status') {
    await reply(message, `\uc678\ucd9c\uc81c \ubaa8\uc9d1 \uc790\ub3d9 \ubc1c\uc1a1 \ud604\uc7ac \uc0c1\ud0dc: ${getStatusText()}`);
    return true;
  }

  if (action === 'on') {
    setAutoSendEnabled(true);
    console.log('[COMMAND] Recruitment auto-send enabled.');
    await reply(message, `\uc678\ucd9c\uc81c \ubaa8\uc9d1 \uc790\ub3d9 \ubc1c\uc1a1 \ud604\uc7ac \uc0c1\ud0dc: ${getStatusText()}`);
    return true;
  }

  if (action === 'off') {
    setAutoSendEnabled(false);
    console.log('[COMMAND] Recruitment auto-send disabled.');
    await reply(message, `\uc678\ucd9c\uc81c \ubaa8\uc9d1 \uc790\ub3d9 \ubc1c\uc1a1 \ud604\uc7ac \uc0c1\ud0dc: ${getStatusText()}`);
    return true;
  }

  if (action === '\ubaa8\uc9d1') {
    try {
      const recruitmentMessage = await sendRecruitmentMessage(message.client);
      setAutoSendEnabled(true);
      console.log(`[COMMAND] Manual recruitment message sent: ${recruitmentMessage.id}`);
      await reply(message, MESSAGE_MANUAL_RECRUITMENT_SUCCESS);
    } catch (error) {
      console.error('[COMMAND] Failed to send manual recruitment message:', error);
      await reply(message, `외출제 모집 안내 메시지 전송에 실패했습니다: ${error.message}`);
    }

    return true;
  }

  await reply(message, MESSAGE_USAGE);
  return true;
}

module.exports = {
  handleRecruitmentCommand,
};
