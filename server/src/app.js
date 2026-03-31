const express = require("express");
const cors = require("cors");
const { CONFIRMATION_TTL_MS } = require("./config/constants");
const { createConfirmationStore } = require("./utils/confirmationStore");
const { createTerminalExecutor } = require("./terminal/executor");
const { createHealthRoutes } = require("./routes/healthRoutes");
const { createTerminalRoutes } = require("./routes/terminalRoutes");

function createApp() {
  const app = express();
  const confirmationStore = createConfirmationStore(CONFIRMATION_TTL_MS);
  const terminalExecutor = createTerminalExecutor(confirmationStore);

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", createHealthRoutes());
  app.use("/api", createTerminalRoutes(terminalExecutor));

  return app;
}

module.exports = {
  createApp,
};
