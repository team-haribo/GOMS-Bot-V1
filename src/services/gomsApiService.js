const axios = require('axios');

function getGomsApiConfig() {
  const apiUrl = process.env.GOMS_INTERNAL_API_URL;
  const apiSecret = process.env.GOMS_INTERNAL_API_SECRET;

  if (!apiUrl) {
    throw new Error('GOMS_INTERNAL_API_URL is not configured.');
  }

  if (!apiSecret) {
    throw new Error('GOMS_INTERNAL_API_SECRET is not configured.');
  }

  return {
    apiSecret,
    apiUrl,
  };
}

async function sendRecruitmentParticipants(discordUserIds) {
  if (!discordUserIds.length) {
    console.log('[GOMS_API] Skipped request because discordUserIds is empty.');
    return null;
  }

  const { apiSecret, apiUrl } = getGomsApiConfig();

  try {
    const response = await axios.post(
      apiUrl,
      {
        discordUserIds,
      },
      {
        headers: {
          'X-Internal-Secret': apiSecret,
        },
      },
    );

    console.log('[GOMS_API] \uc678\ucd9c\uc81c \uad00\ub9ac \uc778\uc6d0 \ub3d9\uae30\ud654 \uc644\ub8cc:', response.data);

    return response.data;
  } catch (error) {
    console.error('[GOMS_API] Recruitment participants API request failed.');
    console.error('[GOMS_API] status:', error.response?.status || null);
    console.error('[GOMS_API] response data:', error.response?.data || null);
    console.error('[GOMS_API] message:', error.message);

    throw error;
  }
}

module.exports = {
  sendRecruitmentParticipants,
};
