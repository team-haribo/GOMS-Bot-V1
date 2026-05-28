const recruitmentState = {
  autoSendEnabled: true,
  currentRecruitmentMessageId: null,
};

// TODO: Replace in-memory state with persistent storage if runtime restarts must preserve settings.
function isAutoSendEnabled() {
  return recruitmentState.autoSendEnabled;
}

function setAutoSendEnabled(enabled) {
  recruitmentState.autoSendEnabled = Boolean(enabled);

  return recruitmentState.autoSendEnabled;
}

function getCurrentRecruitmentMessageId() {
  return recruitmentState.currentRecruitmentMessageId;
}

function setCurrentRecruitmentMessageId(messageId) {
  recruitmentState.currentRecruitmentMessageId = messageId;

  return recruitmentState.currentRecruitmentMessageId;
}

module.exports = {
  getCurrentRecruitmentMessageId,
  isAutoSendEnabled,
  setCurrentRecruitmentMessageId,
  setAutoSendEnabled,
};
