const { APS_INFORMED_DESIGN_API_URL } = require("../config/constants");
const { decodeRepeatedly } = require("../utils/encoding");

function buildAccessQuery({ accessType, accessId }) {
  return new URLSearchParams({
    accessType,
    accessId: decodeRepeatedly(accessId),
  }).toString();
}

async function safeReadResponse(response) {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();
    return text ? { raw: text } : undefined;
  } catch {
    return undefined;
  }
}

function isSuccessfulStatus(status) {
  return status >= 200 && status < 300;
}

async function runMutationCandidates({ accessToken, candidates }) {
  const failures = [];

  for (const candidate of candidates) {
    const response = await fetch(candidate.url, {
      method: candidate.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(candidate.body),
    });

    if (isSuccessfulStatus(response.status)) {
      return {
        ok: true,
        payload: await safeReadResponse(response),
      };
    }

    failures.push({
      method: candidate.method,
      url: candidate.url,
      status: response.status,
      payload: await safeReadResponse(response),
    });
  }

  return {
    ok: false,
    failures,
  };
}

async function fetchReleaseById({ accessToken, releaseId, accessType, accessId }) {
  const url = new URL(`${APS_INFORMED_DESIGN_API_URL}/releases/${encodeURIComponent(releaseId)}`);
  url.search = buildAccessQuery({ accessType, accessId });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to fetch release (${response.status}).`);
  }

  return response.json();
}

async function listReleasesByProduct({
  accessToken,
  productId,
  accessType,
  accessId,
}) {
  const url = new URL(`${APS_INFORMED_DESIGN_API_URL}/releases`);
  url.search = new URLSearchParams({
    productId,
    accessType,
    accessId: decodeRepeatedly(accessId),
  }).toString();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to list releases (${response.status}).`);
  }

  const payload = await response.json();
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.data || payload?.items || payload?.results || [];
}

function normalizeReleaseListItem(item) {
  const value = item || {};
  return {
    id: String(value.id || "").trim(),
    name: String(value.name || value.displayName || value.title || value.id || "").trim(),
    releaseNumber:
      value.releaseNumber != null || value.number != null
        ? String(value.releaseNumber || value.number).trim()
        : undefined,
    state:
      String(value.state || value.status || value.lifecycleState || "")
        .trim()
        .toUpperCase() || undefined,
    updatedAt:
      String(value.updatedAt || value.modifiedAt || value.lastModifiedTime || "").trim() ||
      undefined,
  };
}

async function resolveCurrentProductId(accessToken, context) {
  if (context.currentProductId) {
    return context.currentProductId;
  }

  const currentRelease = await fetchReleaseById({
    accessToken,
    releaseId: context.currentReleaseId,
    accessType: context.accessType,
    accessId: context.accessId,
  });

  return String(currentRelease.productId || "").trim();
}

async function updateReleaseState({
  accessToken,
  releaseId,
  targetState,
  accessType,
  accessId,
}) {
  const accessQuery = buildAccessQuery({ accessType, accessId });
  const baseUrl = `${APS_INFORMED_DESIGN_API_URL}/releases/${encodeURIComponent(releaseId)}?${accessQuery}`;

  const mutationResult = await runMutationCandidates({
    accessToken,
    candidates: [
      {
        method: "PATCH",
        url: baseUrl,
        body: { state: targetState },
      },
      {
        method: "PATCH",
        url: baseUrl,
        body: { lifecycleState: targetState },
      },
      {
        method: "PATCH",
        url: baseUrl,
        body: { status: targetState },
      },
    ],
  });

  if (!mutationResult.ok) {
    const summary = mutationResult.failures
      .map((failure) => `${failure.method} ${failure.status}`)
      .join(", ");
    throw new Error(`Failed to update release state. Attempted: ${summary}`);
  }

  return mutationResult.payload;
}

async function setProductDefaultRelease({
  accessToken,
  productId,
  releaseId,
  accessType,
  accessId,
}) {
  const accessQuery = buildAccessQuery({ accessType, accessId });
  const encodedProductId = encodeURIComponent(productId);
  const baseProductUrl = `${APS_INFORMED_DESIGN_API_URL}/products/${encodedProductId}?${accessQuery}`;

  const mutationResult = await runMutationCandidates({
    accessToken,
    candidates: [
      {
        method: "PATCH",
        url: baseProductUrl,
        body: { defaultRelease: releaseId },
      },
      {
        method: "PATCH",
        url: baseProductUrl,
        body: { defaultReleaseId: releaseId },
      },
      {
        method: "PATCH",
        url: `${APS_INFORMED_DESIGN_API_URL}/products/${encodedProductId}/default-release?${accessQuery}`,
        body: { releaseId },
      },
      {
        method: "PUT",
        url: `${APS_INFORMED_DESIGN_API_URL}/products/${encodedProductId}/default-release?${accessQuery}`,
        body: { releaseId },
      },
    ],
  });

  if (!mutationResult.ok) {
    const summary = mutationResult.failures
      .map((failure) => `${failure.method} ${failure.status}`)
      .join(", ");
    throw new Error(`Failed to set default release. Attempted: ${summary}`);
  }

  return mutationResult.payload;
}

module.exports = {
  fetchReleaseById,
  listReleasesByProduct,
  normalizeReleaseListItem,
  resolveCurrentProductId,
  updateReleaseState,
  setProductDefaultRelease,
};
