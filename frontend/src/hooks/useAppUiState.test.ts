import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAppUiState, useAppUiState } from "./useAppUiState";

describe("useAppUiState", () => {
  beforeEach(() => {
    resetAppUiState();
  });

  it("toggles menu and dialog state", () => {
    const onLogout = vi.fn();
    const { result } = renderHook(() => useAppUiState({ onLogout }));

    const button = document.createElement("button");
    act(() => {
      result.current.openAccountMenu({ currentTarget: button } as any);
    });
    expect(result.current.accountMenuOpen).toBe(true);

    act(() => result.current.closeAccountMenu());
    expect(result.current.accountMenuOpen).toBe(false);

    act(() => {
      result.current.setLogoutDialogOpen(true);
      result.current.handleLogout();
    });
    expect(onLogout).toHaveBeenCalled();
    expect(result.current.logoutDialogOpen).toBe(false);

    act(() => {
      result.current.setSettingsDialogOpen(true);
      result.current.closeSettingsDialog();
      result.current.setReleaseDialogOpen(true);
      result.current.closeReleaseDialog();
      result.current.setLogoutDialogOpen(true);
      result.current.closeLogoutDialog();
    });

    expect(result.current.settingsDialogOpen).toBe(false);
    expect(result.current.releaseDialogOpen).toBe(false);
    expect(result.current.logoutDialogOpen).toBe(false);
  });
});
