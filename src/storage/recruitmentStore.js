const {
  isAutoSendEnabled,
  setAutoSendEnabled,
} = require('./automationStore');

const recruitmentState = {
  currentRecruitmentMessageId: null,
  participants: {
    ids: [],
    usernames: [],
  },
};

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
