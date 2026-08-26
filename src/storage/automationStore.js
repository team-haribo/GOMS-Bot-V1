const fs = require('fs');
const path = require('path');

const DEFAULT_STATE = {
  autoSendEnabled: true,
  latestOutingNoticeMessageId: null,
};

const stateFilePath = path.resolve(
  process.env.OUTING_STATE_FILE || path.join(__dirname, '..', '..', 'data', 'automation-state.json'),
);

function loadState() {
  if (!fs.existsSync(stateFilePath)) {
    return { ...DEFAULT_STATE };
  }

  try {
    const parsedState = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));

    return {
      autoSendEnabled:
        typeof parsedState.autoSendEnabled === 'boolean'
          ? parsedState.autoSendEnabled
          : DEFAULT_STATE.autoSendEnabled,
      latestOutingNoticeMessageId:
        typeof parsedState.latestOutingNoticeMessageId === 'string'
          ? parsedState.latestOutingNoticeMessageId
          : null,
    };
  } catch (error) {
    console.error('[STORAGE] Failed to load automation state. Auto-send is disabled for safety.', error);
    return {
      ...DEFAULT_STATE,
      autoSendEnabled: false,
    };
  }
}

const automationState = loadState();

function persistState() {
  const directory = path.dirname(stateFilePath);
  const temporaryFilePath = `${stateFilePath}.${process.pid}.tmp`;

  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(temporaryFilePath, `${JSON.stringify(automationState, null, 2)}\n`, 'utf8');

  try {
    fs.renameSync(temporaryFilePath, stateFilePath);
  } catch (error) {
    if (!['EEXIST', 'EPERM', 'ENOTEMPTY'].includes(error.code)) {
      throw error;
    }

    fs.copyFileSync(temporaryFilePath, stateFilePath);
    fs.unlinkSync(temporaryFilePath);
  }
}

function isAutoSendEnabled() {
  return automationState.autoSendEnabled;
}

function setAutoSendEnabled(enabled) {
  automationState.autoSendEnabled = Boolean(enabled);
  persistState();

  return automationState.autoSendEnabled;
}

function getLatestOutingNoticeMessageId() {
  return automationState.latestOutingNoticeMessageId;
}

function setLatestOutingNoticeMessageId(messageId) {
  automationState.latestOutingNoticeMessageId = messageId || null;
  persistState();

  return automationState.latestOutingNoticeMessageId;
}

module.exports = {
  getLatestOutingNoticeMessageId,
  isAutoSendEnabled,
  setAutoSendEnabled,
  setLatestOutingNoticeMessageId,
  stateFilePath,
};
