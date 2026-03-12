import { describe, expect, it } from "vitest";
import {
  getLanguage,
  getSettings,
  getThemeMode,
  saveSettings,
  setLanguage,
  setThemeMode,
} from "./settingsStore";

describe("settingsStore", () => {
  it("returns defaults when empty", () => {
    expect(getSettings()).toEqual({ themeMode: "light", language: "en" });
  });

  it("sanitizes and persists settings", () => {
    saveSettings({ themeMode: "dark", language: "pt" });
    expect(getThemeMode()).toBe("dark");
    expect(getLanguage()).toBe("pt");

    saveSettings({ language: "unknown" as never });
    expect(getLanguage()).toBe("en");
  });

  it("updates theme and language incrementally", () => {
    setThemeMode("dark");
    setLanguage("fr");
    expect(getSettings()).toEqual({ themeMode: "dark", language: "fr" });
  });

  it("falls back to defaults when stored JSON is invalid", () => {
    localStorage.setItem("appSettings", "{invalid-json");
    expect(getSettings()).toEqual({ themeMode: "light", language: "en" });
  });

  it("sanitizes unknown theme mode to light", () => {
    saveSettings({ themeMode: "invalid" as never, language: "es" });
    expect(getSettings()).toEqual({ themeMode: "light", language: "es" });
  });
});
