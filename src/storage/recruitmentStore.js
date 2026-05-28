const recruitmentState = {
  autoSendEnabled: true,
  currentRecruitmentMessageId: null,
  participants: {
    ids: [],
    usernames: [],
  },
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

function getParticipants() {
  return {
    ids: [...recruitmentState.participants.ids],
    usernames: [...recruitmentState.participants.usernames],
  };
}

function setParticipants(participants) {
  recruitmentState.participants = {
    ids: [...participants.ids],
    usernames: [...participants.usernames],
  };

  return getParticipants();
}

module.exports = {
  getCurrentRecruitmentMessageId,
  getParticipants,
  isAutoSendEnabled,
  setCurrentRecruitmentMessageId,
  setParticipants,
  setAutoSendEnabled,
};
