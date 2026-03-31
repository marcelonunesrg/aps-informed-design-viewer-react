function parseTerminalCommand(command) {
  const normalizedCommand = command.trim();

  if (!normalizedCommand) {
    return { kind: "invalid", error: "Command cannot be empty." };
  }

  if (/^help$/i.test(normalizedCommand)) {
    return { kind: "help" };
  }

  if (/^clear$/i.test(normalizedCommand)) {
    return { kind: "clear" };
  }

  if (/^confirm$/i.test(normalizedCommand)) {
    return { kind: "confirm" };
  }

  if (/^cancel$/i.test(normalizedCommand)) {
    return { kind: "cancel" };
  }

  if (/^release\s+list$/i.test(normalizedCommand)) {
    return { kind: "release_list" };
  }

  const releaseUseMatch = normalizedCommand.match(/^release\s+use\s+([^\s]+)$/i);
  if (releaseUseMatch) {
    return { kind: "release_use", releaseId: releaseUseMatch[1].trim() };
  }

  const releaseTagMatch = normalizedCommand.match(/^release\s+tag\s+(active|obsolete)$/i);
  if (releaseTagMatch) {
    return { kind: "release_tag", targetState: releaseTagMatch[1].toUpperCase() };
  }

  if (/^release\s+set-default$/i.test(normalizedCommand)) {
    return { kind: "release_set_default" };
  }

  return {
    kind: "invalid",
    error: "Unsupported command. Type 'help' to see available commands.",
  };
}

function validateCommandContext(context) {
  if (!context || typeof context !== "object") {
    return "Context payload is required.";
  }

  if (!context.accessType || !context.accessId || !context.currentReleaseId) {
    return "Context requires accessType, accessId, and currentReleaseId.";
  }

  return null;
}

module.exports = {
  parseTerminalCommand,
  validateCommandContext,
};
