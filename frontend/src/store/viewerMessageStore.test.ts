import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  resetViewerMessageState,
  setViewerMessageState,
  useViewerMessageState,
} from "./viewerMessageStore";

describe("viewerMessageStore", () => {
  it("updates and resets shared state", () => {
    const { result } = renderHook(() => useViewerMessageState());

    expect(result.current).toEqual({ status: "idle", error: null });

    act(() => {
      setViewerMessageState({ status: "loading" });
    });
    expect(result.current.status).toBe("loading");

    act(() => {
      resetViewerMessageState();
    });
    expect(result.current).toEqual({ status: "idle", error: null });
  });
});
