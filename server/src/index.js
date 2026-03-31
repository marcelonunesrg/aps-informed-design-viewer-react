const { DEFAULT_SERVER_PORT } = require("./config/constants");
const { createApp } = require("./app");

function getServerPort() {
  const parsed = Number(process.env.BACKEND_PORT || DEFAULT_SERVER_PORT);
  return Number.isFinite(parsed) ? parsed : DEFAULT_SERVER_PORT;
}

const app = createApp();
const port = getServerPort();

app.listen(port, () => {
  console.log(`[terminal-backend] listening on port ${port}`);
});
