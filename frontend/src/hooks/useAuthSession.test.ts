import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  getUserProfile: vi.fn(async () => ({ name: "Marcelo" })),
}));

import { resetAuthSessionState, useAuthSession } from "./useAuthSession";
import { getUserProfile } from "../services/authService";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("useAuthSession", () => {
  beforeEach(() => {
    resetAuthSessionState();
  });

  it("loads user profile", async () => {
    const { result } = renderHook(() => useAuthSession());
    await waitFor(() => expect(result.current.userProfile).toEqual({ name: "Marcelo" }));
  });

  it("keeps null when profile is missing", async () => {
    vi.mocked(getUserProfile).mockResolvedValueOnce(null);
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current.userProfile).toBeNull());
  });

  it("keeps null on profile load error", async () => {
    vi.mocked(getUserProfile).mockRejectedValueOnce(new Error("boom") as never);
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => expect(result.current.userProfile).toBeNull());
  });

  it("does not update state after unmount", async () => {
    const wait = deferred<any>();
    vi.mocked(getUserProfile).mockReturnValueOnce(wait.promise);

    const { unmount } = renderHook(() => useAuthSession());
    unmount();

    wait.resolve({ name: "Late profile" });
    await Promise.resolve();

    expect(getUserProfile).toHaveBeenCalledTimes(1);
  });
});
