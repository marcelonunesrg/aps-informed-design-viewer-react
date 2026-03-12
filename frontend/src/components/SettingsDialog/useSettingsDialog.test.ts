import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSettingsDialog } from "./useSettingsDialog";

describe("useSettingsDialog", () => {
  it("forwards theme and language changes", () => {
    const onThemeModeChange = vi.fn();
    const onLanguageChange = vi.fn();

    const { result } = renderHook(() =>
      useSettingsDialog({
        onThemeModeChange,
        onLanguageChange,
      }),
    );

    act(() => result.current.handleThemeModeChange({ target: { value: "dark" } } as any));
    act(() => result.current.handleLanguageChange({ target: { value: "pt" } } as any));

    expect(onThemeModeChange).toHaveBeenCalledWith("dark");
    expect(onLanguageChange).toHaveBeenCalledWith("pt");
  });
});
