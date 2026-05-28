const recruitmentState = {
  autoSendEnabled: true,
};

// TODO: Replace in-memory state with persistent storage if runtime restarts must preserve settings.
function isAutoSendEnabled() {
  return recruitmentState.autoSendEnabled;
}

function setAutoSendEnabled(enabled) {
  recruitmentState.autoSendEnabled = Boolean(enabled);

  return recruitmentState.autoSendEnabled;
}

module.exports = {
  isAutoSendEnabled,
  setAutoSendEnabled,
};
