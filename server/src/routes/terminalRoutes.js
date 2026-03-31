const express = require("express");
const {
  parseTerminalCommand,
  validateCommandContext,
} = require("../terminal/commandParser");

function createTerminalRoutes(terminalExecutor) {
  const router = express.Router();

  router.post("/terminal/execute", async (request, response) => {
    try {
      const authorization = request.headers.authorization || "";
      const accessToken = authorization.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length).trim()
        : "";

      if (!accessToken) {
        response.status(401).json({
          status: "error",
          output: "Missing bearer token.",
          code: "auth_missing",
        });
        return;
      }

      const command = String(request.body?.command || "");
      const context = request.body?.context;
      const confirmationToken =
        typeof request.body?.confirmationToken === "string"
          ? request.body.confirmationToken
          : undefined;

      const parsed = parseTerminalCommand(command);
      if (parsed.kind === "invalid") {
        response.status(400).json({
          status: "error",
          output: parsed.error,
          code: "invalid_command",
        });
        return;
      }

      if (!["help", "clear", "confirm", "cancel"].includes(parsed.kind)) {
        const contextError = validateCommandContext(context);
        if (contextError) {
          response.status(400).json({
            status: "error",
            output: contextError,
            code: "invalid_context",
          });
          return;
        }
      }

      const result = await terminalExecutor.executeParsedCommand({
        parsed,
        context,
        accessToken,
        confirmationToken,
      });

      response.json(result);
    } catch (error) {
      response.status(500).json({
        status: "error",
        output: error instanceof Error ? error.message : "Unexpected server error.",
        code: "server_error",
      });
    }
  });

  return router;
}

module.exports = {
  createTerminalRoutes,
};
