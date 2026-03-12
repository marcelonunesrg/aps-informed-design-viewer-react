import { create } from "zustand";
import type { AppSettings, Language, ThemeMode } from "../types";

const SETTINGS_STORAGE_KEY = "appSettings";

const defaultSettings: AppSettings = {
  themeMode: "light",
  language: "en",
};

function sanitizeThemeMode(themeMode: unknown): ThemeMode {
  return themeMode === "dark" ? "dark" : "light";
}

function sanitizeSettings(settings: Partial<AppSettings> | null | undefined): AppSettings {
  const language = ["en", "es", "fr", "pt"].includes(settings?.language)
    ? (settings.language as Language)
    : "en";

  return {
    ...defaultSettings,
    ...settings,
    themeMode: sanitizeThemeMode(settings?.themeMode),
    language,
  };
}

function readStoredSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!rawSettings) {
    return defaultSettings;
  }

  try {
    const parsedSettings = JSON.parse(rawSettings);
    return sanitizeSettings(parsedSettings);
  } catch {
    return defaultSettings;
  }
}

function writeStoredSettings(nextSettings: AppSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
}

interface SettingsStoreState extends AppSettings {
  saveSettings: (nextSettings: Partial<AppSettings>) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setLanguage: (language: Language) => void;
}

const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  ...readStoredSettings(),
  saveSettings: (nextSettings) => {
    const current = get();
    const settings = sanitizeSettings({
      themeMode: current.themeMode,
      language: current.language,
      ...nextSettings,
    });
    writeStoredSettings(settings);
    set(settings);
  },
  setThemeMode: (themeMode) => {
    const current = get();
    const settings = sanitizeSettings({
      language: current.language,
      themeMode,
    });
    writeStoredSettings(settings);
    set(settings);
  },
  setLanguage: (language) => {
    const current = get();
    const settings = sanitizeSettings({
      themeMode: current.themeMode,
      language,
    });
    writeStoredSettings(settings);
    set(settings);
  },
}));

function syncSettingsFromStorage() {
  const stored = readStoredSettings();
  const current = useSettingsStore.getState();

  if (current.themeMode !== stored.themeMode || current.language !== stored.language) {
    useSettingsStore.setState(stored);
  }
}

export function getSettings(): AppSettings {
  syncSettingsFromStorage();
  const { themeMode, language } = useSettingsStore.getState();
  return { themeMode, language };
}

export function saveSettings(nextSettings: Partial<AppSettings>): void {
  useSettingsStore.getState().saveSettings(nextSettings);
}

export function getThemeMode(): ThemeMode {
  syncSettingsFromStorage();
  return useSettingsStore.getState().themeMode;
}

export function setThemeMode(themeMode: ThemeMode): void {
  useSettingsStore.getState().setThemeMode(themeMode);
}

export function getLanguage(): Language {
  syncSettingsFromStorage();
  return useSettingsStore.getState().language;
}

export function setLanguage(language: Language): void {
  useSettingsStore.getState().setLanguage(language);
}
