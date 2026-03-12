export type ThemeMode = "light" | "dark";
export type Language = "en" | "es" | "fr" | "pt";

export interface ProductReleaseData {
  releaseId: string;
  accessId: string;
  accessType: string;
}

export interface UserProfile {
  userId?: string | null;
  name: string;
  picture: string | null;
  email?: string | null;
}

export interface ViewerAccessToken {
  access_token: string;
  expires_in: number;
}

export interface ViewerMessageState {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
}

export interface AppSettings {
  themeMode: ThemeMode;
  language: Language;
}
