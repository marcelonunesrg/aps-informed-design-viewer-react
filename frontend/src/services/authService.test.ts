import { afterEach, describe, expect, it, vi } from "vitest";
import { getUserProfile, getViewerAccessToken, login, logout } from "./authService";

function setUrl(search: string) {
  const suffix = search ? `/${search}` : "/";
  window.history.replaceState({}, "", suffix);
}

function setStoredToken(token: Record<string, unknown>) {
  localStorage.setItem("aps.oauth.token", JSON.stringify(token));
}

afterEach(() => {
  sessionStorage.clear();
  setUrl("");
  vi.unstubAllEnvs();
});

describe("authService", () => {
  it("returns null when there is no stored token", async () => {
    await expect(getUserProfile()).resolves.toBeNull();
  });

  it("returns parsed profile and token from PKCE session", async () => {
    localStorage.setItem(
      "aps.oauth.token",
      JSON.stringify({
        access_token: "token",
        expires_at: Date.now() + 3600_000,
      }),
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ name: "Marcelo", email: "marcelo@example.com" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(getUserProfile()).resolves.toEqual({
      userId: null,
      name: "Marcelo",
      email: "marcelo@example.com",
      picture: null,
    });
    const viewerToken = await getViewerAccessToken();
    expect(viewerToken.access_token).toBe("token");
    expect(viewerToken.expires_in).toBeGreaterThan(3500);
  });

  it("uses cached profile when available", async () => {
    setStoredToken({
      access_token: "token",
      expires_at: Date.now() + 3600_000,
    });
    localStorage.setItem(
      "aps.oauth.profile",
      JSON.stringify({ name: "Cached", email: "cached@example.com", picture: null }),
    );

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getUserProfile()).resolves.toEqual({
      name: "Cached",
      email: "cached@example.com",
      picture: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears auth storage when user info returns 401", async () => {
    setStoredToken({
      access_token: "token",
      refresh_token: "refresh",
      expires_at: Date.now() + 3600_000,
    });
    sessionStorage.setItem("aps.oauth.pkce.verifier", "v");
    sessionStorage.setItem("aps.oauth.pkce.state", "s");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "unauthorized" }),
    );

    await expect(getUserProfile()).resolves.toBeNull();
    expect(localStorage.getItem("aps.oauth.token")).toBeNull();
    expect(localStorage.getItem("aps.oauth.profile")).toBeNull();
    expect(sessionStorage.getItem("aps.oauth.pkce.verifier")).toBeNull();
    expect(sessionStorage.getItem("aps.oauth.pkce.state")).toBeNull();
  });

  it("throws on non-auth user info errors", async () => {
    setStoredToken({
      access_token: "token",
      expires_at: Date.now() + 3600_000,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "boom" }),
    );

    await expect(getUserProfile()).rejects.toThrow("boom");
  });

  it("clears auth storage when user info returns 403", async () => {
    setStoredToken({
      access_token: "token",
      refresh_token: "refresh",
      expires_at: Date.now() + 3600_000,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => "forbidden" }),
    );

    await expect(getUserProfile()).resolves.toBeNull();
    expect(localStorage.getItem("aps.oauth.token")).toBeNull();
  });

  it("handles oauth callback with code exchange and cleans URL params", async () => {
    vi.stubEnv("VITE_APS_CLIENT_ID", "client-id");
    vi.stubEnv("VITE_APS_REDIRECT_URI", "http://localhost:8080/");

    sessionStorage.setItem("aps.oauth.pkce.state", "ok-state");
    sessionStorage.setItem("aps.oauth.pkce.verifier", "ok-verifier");
    setUrl("?code=abc123&state=ok-state");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "new-token", refresh_token: "new-refresh", expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ name: "From OAuth", profileImages: { sizeX40: "img" } }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const profile = await getUserProfile();
    expect(profile).toEqual({ userId: null, name: "From OAuth", email: null, picture: "img" });
    expect(window.location.search).toBe("");
    expect(sessionStorage.getItem("aps.oauth.pkce.state")).toBeNull();
    expect(sessionStorage.getItem("aps.oauth.pkce.verifier")).toBeNull();
  });

  it("throws token exchange error body when authorization code exchange fails", async () => {
    vi.stubEnv("VITE_APS_CLIENT_ID", "client-id");
    sessionStorage.setItem("aps.oauth.pkce.state", "ok-state");
    sessionStorage.setItem("aps.oauth.pkce.verifier", "ok-verifier");
    setUrl("?code=abc123&state=ok-state");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "invalid_grant" }),
    );

    await expect(getViewerAccessToken()).rejects.toThrow("invalid_grant");
    expect(window.location.search).toBe("?code=abc123&state=ok-state");
  });

  it("throws and cleans URL when oauth callback state is invalid", async () => {
    sessionStorage.setItem("aps.oauth.pkce.state", "expected");
    sessionStorage.setItem("aps.oauth.pkce.verifier", "verifier");
    setUrl("?code=abc123&state=different");

    await expect(getViewerAccessToken()).rejects.toThrow("Invalid OAuth state or missing PKCE verifier.");
    expect(window.location.search).toBe("");
  });

  it("throws oauth error_description from callback", async () => {
    setUrl("?error=access_denied&error_description=user%20cancelled");

    await expect(getViewerAccessToken()).rejects.toThrow("user cancelled");
    expect(window.location.search).toBe("");
  });

  it("throws default oauth error message when description is missing", async () => {
    setUrl("?error=access_denied");

    await expect(getViewerAccessToken()).rejects.toThrow("OAuth authorization failed.");
    expect(window.location.search).toBe("");
  });

  it("refreshes expired token and returns viewer token", async () => {
    vi.stubEnv("VITE_APS_CLIENT_ID", "client-id");

    setStoredToken({
      access_token: "expired",
      refresh_token: "refresh-token",
      expires_at: Date.now() - 10_000,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "fresh", refresh_token: "refresh-2", expires_in: 120 }),
      }),
    );

    const token = await getViewerAccessToken();
    expect(token.access_token).toBe("fresh");
    expect(token.expires_in).toBeGreaterThan(0);
  });

  it("returns unauthenticated when expired token has no refresh token", async () => {
    setStoredToken({
      access_token: "expired",
      expires_at: Date.now() - 10_000,
    });

    await expect(getUserProfile()).resolves.toBeNull();
    await expect(getViewerAccessToken()).rejects.toThrow("User is not authenticated.");
  });

  it("clears storage when refresh token request fails", async () => {
    vi.stubEnv("VITE_APS_CLIENT_ID", "client-id");

    setStoredToken({
      access_token: "expired",
      refresh_token: "refresh-token",
      expires_at: Date.now() - 10_000,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "invalid_grant" }),
    );

    await expect(getUserProfile()).resolves.toBeNull();
    expect(localStorage.getItem("aps.oauth.token")).toBeNull();
  });

  it("cleans invalid stored token/profile JSON", async () => {
    localStorage.setItem("aps.oauth.token", "{bad-json");

    await expect(getUserProfile()).resolves.toBeNull();
    expect(localStorage.getItem("aps.oauth.token")).toBeNull();

    setStoredToken({
      access_token: "token",
      expires_at: Date.now() + 3600_000,
    });
    localStorage.setItem("aps.oauth.profile", "{bad-json");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ name: "Recovered" }),
      }),
    );

    await expect(getUserProfile()).resolves.toEqual({
      userId: null,
      name: "Recovered",
      email: null,
      picture: null,
    });
    expect(localStorage.getItem("aps.oauth.profile")).not.toContain("{bad-json");
  });

  it("throws missing client id when callback requires token exchange", async () => {
    vi.stubEnv("VITE_APS_CLIENT_ID", "");
    sessionStorage.setItem("aps.oauth.pkce.state", "ok-state");
    sessionStorage.setItem("aps.oauth.pkce.verifier", "ok-verifier");
    setUrl("?code=abc123&state=ok-state");

    await expect(getViewerAccessToken()).rejects.toThrow("Missing VITE_APS_CLIENT_ID");
  });

  it("returns expires_in zero when exchanged token already expired", async () => {
    vi.stubEnv("VITE_APS_CLIENT_ID", "client-id");
    sessionStorage.setItem("aps.oauth.pkce.state", "ok-state");
    sessionStorage.setItem("aps.oauth.pkce.verifier", "ok-verifier");
    setUrl("?code=abc123&state=ok-state");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "short-lived", expires_in: 0 }),
      }),
    );

    const token = await getViewerAccessToken();
    expect(token.expires_in).toBe(0);
  });

  it("maps user profile fallbacks from email and sizeX80 image", async () => {
    setStoredToken({
      access_token: "token",
      expires_at: Date.now() + 3600_000,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ email: "fallback@example.com", profileImages: { sizeX80: "img80" } }),
      }),
    );

    await expect(getUserProfile()).resolves.toEqual({
      userId: null,
      name: "fallback@example.com",
      email: "fallback@example.com",
      picture: "img80",
    });
  });

  it("uses default profile name when both name and email are missing", async () => {
    setStoredToken({
      access_token: "token",
      expires_at: Date.now() + 3600_000,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      }),
    );

    await expect(getUserProfile()).resolves.toEqual({
      userId: null,
      name: "User",
      email: null,
      picture: null,
    });
  });

  it("exposes redirect functions", () => {
    expect(typeof login).toBe("function");
    expect(typeof logout).toBe("function");
  });

  it("clears token/profile storage on logout", () => {
    localStorage.setItem("aps.oauth.token", JSON.stringify({ access_token: "token", expires_at: Date.now() + 1000 }));
    localStorage.setItem("aps.oauth.profile", JSON.stringify({ name: "User", picture: null }));
    sessionStorage.setItem("aps.oauth.pkce.state", "state");
    sessionStorage.setItem("aps.oauth.pkce.verifier", "verifier");

    logout();

    expect(localStorage.getItem("aps.oauth.token")).toBeNull();
    expect(localStorage.getItem("aps.oauth.profile")).toBeNull();
    expect(sessionStorage.getItem("aps.oauth.pkce.state")).toBeNull();
    expect(sessionStorage.getItem("aps.oauth.pkce.verifier")).toBeNull();
  });

  it("generates PKCE values during login", async () => {
    vi.stubEnv("VITE_APS_CLIENT_ID", "client-id");
    vi.stubEnv("VITE_APS_SCOPES", "data:read");

    const digestSpy = vi.spyOn(crypto.subtle, "digest").mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

    login();
    await Promise.resolve();
    await Promise.resolve();

    expect(digestSpy).toHaveBeenCalled();
    expect(sessionStorage.getItem("aps.oauth.pkce.state")).toBeTruthy();
    expect(sessionStorage.getItem("aps.oauth.pkce.verifier")).toBeTruthy();
  });
});
