function buildHelpPayload() {
  return {
    lines: [
      "Supported commands:",
      "- help",
      "- clear",
      "- release list",
      "- release use <releaseId>",
      "- release tag active",
      "- release tag obsolete",
      "- release set-default",
      "- confirm",
      "- cancel",
    ],
  };
}

module.exports = {
  buildHelpPayload,
};
