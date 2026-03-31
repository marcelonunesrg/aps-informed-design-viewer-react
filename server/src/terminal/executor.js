const {
  listReleasesByProduct,
  normalizeReleaseListItem,
  resolveCurrentProductId,
  fetchReleaseById,
  updateReleaseState,
  setProductDefaultRelease,
} = require("../services/apsClient");

const apsClient = {
  listReleasesByProduct,
  normalizeReleaseListItem,
  resolveCurrentProductId,
  fetchReleaseById,
  updateReleaseState,
  setProductDefaultRelease,
};
const { buildHelpPayload: buildDefaultHelpPayload } = require("./help");

function createTerminalExecutor(confirmationStore, dependencies = {}) {
  const {
    listReleasesByProduct,
    normalizeReleaseListItem,
    resolveCurrentProductId,
    fetchReleaseById,
    updateReleaseState,
    setProductDefaultRelease,
    buildHelpPayload,
  } = {
    ...apsClient,
    buildHelpPayload: buildDefaultHelpPayload,
    ...dependencies,
  };

  async function executeParsedCommand({ parsed, context, accessToken, confirmationToken }) {
    if (parsed.kind === "help") {
      return {
        status: "ok",
        output: "Help loaded.",
        data: buildHelpPayload(),
      };
    }

    if (parsed.kind === "clear") {
      return {
        status: "ok",
        output: "Terminal output cleared.",
        data: { clear: true },
      };
    }

    if (parsed.kind === "confirm") {
      const pending = confirmationStore.get(confirmationToken);
      if (!confirmationToken) {
        return {
          status: "error",
          output: "No confirmation token found. Run a mutating command first.",
        };
      }

      if (!pending) {
        return {
          status: "error",
          output: "Confirmation expired or invalid. Please run the command again.",
        };
      }

      if (confirmationStore.isExpired(pending)) {
        confirmationStore.deleteToken(confirmationToken);
        return {
          status: "error",
          output: "Confirmation expired. Please run the command again.",
        };
      }

      confirmationStore.deleteToken(confirmationToken);

      if (pending.type === "release_tag") {
        const mutationPayload = await updateReleaseState({
          accessToken,
          releaseId: pending.context.currentReleaseId,
          targetState: pending.targetState,
          accessType: pending.context.accessType,
          accessId: pending.context.accessId,
        });

        return {
          status: "ok",
          output: `Release ${pending.context.currentReleaseId} tagged as ${pending.targetState}.`,
          data: {
            mutationPayload,
          },
        };
      }

      if (pending.type === "release_set_default") {
        const productId = await resolveCurrentProductId(accessToken, pending.context);
        if (!productId) {
          return {
            status: "error",
            output: "Could not resolve productId for default-release operation.",
          };
        }

        const mutationPayload = await setProductDefaultRelease({
          accessToken,
          productId,
          releaseId: pending.context.currentReleaseId,
          accessType: pending.context.accessType,
          accessId: pending.context.accessId,
        });

        return {
          status: "ok",
          output: `Release ${pending.context.currentReleaseId} is now the default for product ${productId}.`,
          data: {
            productId,
            mutationPayload,
          },
        };
      }

      return {
        status: "error",
        output: "Unknown pending operation type.",
      };
    }

    if (parsed.kind === "cancel") {
      confirmationStore.deleteToken(confirmationToken);
      return {
        status: "ok",
        output: "Pending operation canceled.",
      };
    }

    if (parsed.kind === "release_list") {
      const productId = await resolveCurrentProductId(accessToken, context);
      if (!productId) {
        return {
          status: "error",
          output: "Could not resolve productId from current release.",
        };
      }

      const releases = await listReleasesByProduct({
        accessToken,
        productId,
        accessType: context.accessType,
        accessId: context.accessId,
      });

      const rows = releases
        .map(normalizeReleaseListItem)
        .filter((release) => Boolean(release.id));

      return {
        status: "ok",
        output: `Found ${rows.length} release(s).`,
        data: {
          productId,
          releases: rows,
        },
      };
    }

    if (parsed.kind === "release_use") {
      const productId = await resolveCurrentProductId(accessToken, context);
      if (!productId) {
        return {
          status: "error",
          output: "Could not resolve productId from current release.",
        };
      }

      const nextRelease = await fetchReleaseById({
        accessToken,
        releaseId: parsed.releaseId,
        accessType: context.accessType,
        accessId: context.accessId,
      });

      const nextProductId = String(nextRelease.productId || "").trim();
      if (nextProductId !== productId) {
        return {
          status: "error",
          output: "Target release does not belong to the current product.",
        };
      }

      return {
        status: "ok",
        output: `Switched context to release ${nextRelease.id}.`,
        data: {
          productId,
          releaseSelection: {
            releaseId: String(nextRelease.id || "").trim(),
            accessType: String(nextRelease.accessType || context.accessType).trim(),
            accessId: String(nextRelease.accessId || context.accessId).trim(),
          },
        },
      };
    }

    if (parsed.kind === "release_tag") {
      const summary = `Command release tag ${parsed.targetState.toLowerCase()} for release ${context.currentReleaseId}`;
      const token = confirmationStore.save({
        type: "release_tag",
        summary,
        targetState: parsed.targetState,
        context,
      });

      return {
        status: "confirmation_required",
        output: `${summary}. Type confirm to proceed or cancel to abort.`,
        confirmationToken: token,
        data: {
          summary,
        },
      };
    }

    if (parsed.kind === "release_set_default") {
      const summary = `Command release set-default for release ${context.currentReleaseId}`;
      const token = confirmationStore.save({
        type: "release_set_default",
        summary,
        context,
      });

      return {
        status: "confirmation_required",
        output: `${summary}. Type confirm to proceed or cancel to abort.`,
        confirmationToken: token,
        data: {
          summary,
        },
      };
    }

    return {
      status: "error",
      output: "Unsupported command.",
    };
  }

  return {
    executeParsedCommand,
  };
}

module.exports = {
  createTerminalExecutor,
};
