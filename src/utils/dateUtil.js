// TODO: Add shared date formatting and parsing helpers.
function formatDate(date) {
  return date instanceof Date ? date.toISOString() : null;
}

module.exports = {
  formatDate,
};
