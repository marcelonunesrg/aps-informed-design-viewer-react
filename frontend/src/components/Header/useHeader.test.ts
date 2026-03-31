import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../services/authService", () => ({
  getUserProfile: vi.fn(async () => ({ name: "Marcelo" })),
}));

import { useHeader } from "./useHeader";
import { getUserProfile } from "../../services/authService";

describe("useHeader", () => {
  it("handles menu and dialog actions", async () => {
    const setAccountMenuAnchor = vi.fn();
    const setLogoutDialogOpen = vi.fn();
    const setReleaseDialogOpen = vi.fn();
    const setSettingsDialogOpen = vi.fn();
    const setTerminalDrawerOpen = vi.fn();
    const setUserProfile = vi.fn();

    const { result } = renderHook(() =>
      useHeader({
        setAccountMenuAnchor,
        setLogoutDialogOpen,
        setReleaseDialogOpen,
        setSettingsDialogOpen,
        setTerminalDrawerOpen,
        setUserProfile,
      }),
    );

    act(() => result.current.closeAccountMenu());
    expect(setAccountMenuAnchor).toHaveBeenCalledWith(null);

    const button = document.createElement("button");
    act(() => result.current.openAccountMenu({ currentTarget: button } as any));
    expect(setAccountMenuAnchor).toHaveBeenCalledWith(button);

    await Promise.resolve();
    expect(setUserProfile).toHaveBeenCalled();

    act(() => result.current.requestLogout());
    expect(setLogoutDialogOpen).toHaveBeenCalledWith(true);

    act(() => result.current.openSettingsDialog());
    expect(setSettingsDialogOpen).toHaveBeenCalledWith(true);

    act(() => result.current.openReleaseDialog());
    expect(setReleaseDialogOpen).toHaveBeenCalledWith(true);

    act(() => result.current.openTerminalDrawer());
    expect(setTerminalDrawerOpen).toHaveBeenCalledWith(true);
  });

  it("ignores profile load failures", async () => {
    vi.mocked(getUserProfile).mockRejectedValueOnce(new Error("profile error") as never);

    const setAccountMenuAnchor = vi.fn();
    const { result } = renderHook(() =>
      useHeader({
        setAccountMenuAnchor,
        setLogoutDialogOpen: vi.fn(),
        setReleaseDialogOpen: vi.fn(),
        setSettingsDialogOpen: vi.fn(),
        setTerminalDrawerOpen: vi.fn(),
        setUserProfile: vi.fn(),
      }),
    );

    const button = document.createElement("button");
    act(() => result.current.openAccountMenu({ currentTarget: button } as any));

    await Promise.resolve();
    expect(setAccountMenuAnchor).toHaveBeenCalledWith(button);
  });
});
