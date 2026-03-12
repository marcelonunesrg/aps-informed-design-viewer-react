import type { UserProfile, ViewerAccessToken } from "../types";

const APS_AUTHORIZE_URL = "https://developer.api.autodesk.com/authentication/v2/authorize";
const APS_TOKEN_URL = "https://developer.api.autodesk.com/authentication/v2/token";
const APS_USERINFO_URL = "https://api.userprofile.autodesk.com/userinfo";

const TOKEN_STORAGE_KEY = "aps.oauth.token";
const PROFILE_STORAGE_KEY = "aps.oauth.profile";
const PKCE_VERIFIER_KEY = "aps.oauth.pkce.verifier";
const PKCE_STATE_KEY = "aps.oauth.pkce.state";

const DEFAULT_SCOPES = [
  "data:read",
  "data:write",
  "data:create",
  "viewables:read",
  "account:read",
  "user-profile:read",
  "offline_access",
].join(" ");

interface StoredToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope?: string;
  token_type?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

interface UserInfoResponse {
  eidm_guid?: string;
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  profileImages?: {
    sizeX20?: string;
    sizeX40?: string;
    sizeX80?: string;
  };
}

function getClientId(): string {
  const clientId = import.meta.env.VITE_APS_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error("Missing VITE_APS_CLIENT_ID environment variable.");
  }

  return clientId;
}

function getScopes(): string {
  return import.meta.env.VITE_APS_SCOPES?.trim() || DEFAULT_SCOPES;
}

function getRedirectUri(): string {
  const configured = import.meta.env.VITE_APS_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }

  const url = new URL(window.location.href);
  return `${url.origin}${url.pathname}`;
}

function isTokenValid(token: StoredToken): boolean {
  return token.expires_at - Date.now() > 30_000;
}

function loadStoredToken(): StoredToken | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredToken;
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
}

function saveStoredToken(token: TokenResponse): StoredToken {
  const current = loadStoredToken();

  const stored: StoredToken = {
    access_token: token.access_token,
    refresh_token: token.refresh_token || current?.refresh_token,
    expires_at: Date.now() + token.expires_in * 1000,
    scope: token.scope,
    token_type: token.token_type,
  };

  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(stored));
  return stored;
}

function loadStoredProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    return null;
  }
}

function saveStoredProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(PROFILE_STORAGE_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_STATE_KEY);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function createRandomString(size = 32): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(new Uint8Array(digest));
}

function cleanOAuthParamsFromUrl(): void {
  const url = new URL(window.location.href);
  const params = ["code", "state", "error", "error_description"];
  let changed = false;

  params.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });

  if (changed) {
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
  }
}

async function exchangeAuthorizationCode(code: string, verifier: string): Promise<StoredToken> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
  });

  const response = await fetch(APS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const token = (await response.json()) as TokenResponse;
  return saveStoredToken(token);
}

async function refreshAccessToken(refreshToken: string): Promise<StoredToken | null> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: getClientId(),
  });

  const response = await fetch(APS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    clearAuthStorage();
    return null;
  }

  const token = (await response.json()) as TokenResponse;
  return saveStoredToken(token);
}

async function handleOAuthRedirectIfPresent(): Promise<StoredToken | null> {
  const url = new URL(window.location.href);
  const error = url.searchParams.get("error");
  if (error) {
    const description = url.searchParams.get("error_description") || "OAuth authorization failed.";
    cleanOAuthParamsFromUrl();
    throw new Error(description);
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return null;
  }

  const callbackState = url.searchParams.get("state") || "";
  const storedState = sessionStorage.getItem(PKCE_STATE_KEY) || "";
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY) || "";

  sessionStorage.removeItem(PKCE_STATE_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);

  if (!callbackState || callbackState !== storedState || !verifier) {
    cleanOAuthParamsFromUrl();
    throw new Error("Invalid OAuth state or missing PKCE verifier.");
  }

  const token = await exchangeAuthorizationCode(code, verifier);
  cleanOAuthParamsFromUrl();
  return token;
}

async function ensureValidAccessToken(): Promise<StoredToken | null> {
  const redirectToken = await handleOAuthRedirectIfPresent();
  if (redirectToken) {
    return redirectToken;
  }

  const stored = loadStoredToken();
  if (!stored) {
    return null;
  }

  if (isTokenValid(stored)) {
    return stored;
  }

  if (!stored.refresh_token) {
    clearAuthStorage();
    return null;
  }

  return refreshAccessToken(stored.refresh_token);
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const token = await ensureValidAccessToken();
  if (!token) {
    return null;
  }

  const cached = loadStoredProfile();
  if (cached) {
    return cached;
  }

  const response = await fetch(APS_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuthStorage();
      return null;
    }

    throw new Error(await response.text());
  }

  const payload = (await response.json()) as UserInfoResponse;
  const profile: UserProfile = {
    userId: payload.eidm_guid || payload.sub || null,
    name: payload.name || payload.email || "User",
    email: payload.email || null,
    picture: payload.picture || payload.profileImages?.sizeX40 || payload.profileImages?.sizeX80 || null,
  };

  saveStoredProfile(profile);
  return profile;
}

export async function getViewerAccessToken(): Promise<ViewerAccessToken> {
  const token = await ensureValidAccessToken();

  if (!token) {
    throw new Error("User is not authenticated.");
  }

  return {
    access_token: token.access_token,
    expires_in: Math.max(0, Math.floor((token.expires_at - Date.now()) / 1000)),
  };
}

export function login(): void {
  void (async () => {
    const verifier = createRandomString(64);
    const state = createRandomString(32);
    const challenge = await createCodeChallenge(verifier);

    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(PKCE_STATE_KEY, state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: getClientId(),
      redirect_uri: getRedirectUri(),
      scope: getScopes(),
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
    });

    window.location.assign(`${APS_AUTHORIZE_URL}?${params.toString()}`);
  })();
}

export function logout(): void {
  clearAuthStorage();
  window.location.assign(getRedirectUri());
}
