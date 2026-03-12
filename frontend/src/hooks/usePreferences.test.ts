import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePreferences } from "./usePreferences";

describe("usePreferences", () => {
  it("persists theme and language changes", async () => {
    localStorage.setItem(
      "appSettings",
      JSON.stringify({ themeMode: "dark", language: "fr" }),
    );

    const root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);

    const changeLanguage = vi.fn(async () => undefined);
    const { result } = renderHook(() => usePreferences(changeLanguage));

    expect(result.current.themeMode).toBe("dark");
    expect(result.current.language).toBe("fr");

    act(() => {
      result.current.setThemeMode("dark");
      result.current.setLanguage("pt");
    });

    expect(result.current.theme.palette.mode).toBe("dark");
    expect(changeLanguage).toHaveBeenCalledWith("pt");
    expect(document.documentElement.style.getPropertyValue("--app-vw")).toContain("px");
    expect(document.documentElement.style.getPropertyValue("--app-vh")).toContain("px");

    root.remove();
  });
});
