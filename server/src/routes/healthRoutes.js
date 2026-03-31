const express = require("express");

function createHealthRoutes() {
  const router = express.Router();

  router.get("/health", (_request, response) => {
    response.json({ ok: true, service: "aps-idv-terminal-backend" });
  });

  return router;
}

module.exports = {
  createHealthRoutes,
};
