import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../services/authService", () => ({
  getUserProfile: vi.fn(async () => ({ name: "Marcelo" })),
  login: vi.fn(),
}));

import { useAuthGatekeeper } from "./useAuthGatekeeper";
import { getUserProfile, login } from "../../services/authService";

describe("useAuthGatekeeper", () => {
  it("sets authenticated status and handles login action", async () => {
    vi.mocked(getUserProfile).mockResolvedValueOnce({ name: "Marcelo" } as never);

    const onBeforeLoginRedirect = vi.fn();
    const { result } = renderHook(() => useAuthGatekeeper(onBeforeLoginRedirect));

    await waitFor(() => expect(result.current.status).toBe("authenticated"));

    act(() => result.current.handleLogin());
    expect(onBeforeLoginRedirect).toHaveBeenCalled();
    expect(login).toHaveBeenCalled();
  });

  it("redirects automatically when unauthenticated", async () => {
    vi.mocked(getUserProfile).mockResolvedValueOnce(null);

    const onBeforeLoginRedirect = vi.fn();
    renderHook(() => useAuthGatekeeper(onBeforeLoginRedirect));

    await waitFor(() => expect(onBeforeLoginRedirect).toHaveBeenCalledTimes(1));
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("redirects when profile check throws", async () => {
    vi.mocked(getUserProfile).mockRejectedValueOnce(new Error("auth failed") as never);

    const onBeforeLoginRedirect = vi.fn();
    renderHook(() => useAuthGatekeeper(onBeforeLoginRedirect));

    await waitFor(() => expect(onBeforeLoginRedirect).toHaveBeenCalledTimes(1));
    expect(login).toHaveBeenCalledTimes(1);
  });
});
