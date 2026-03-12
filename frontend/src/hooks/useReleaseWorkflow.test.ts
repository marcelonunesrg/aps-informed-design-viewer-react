import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetReleaseWorkflowState, useReleaseWorkflow } from "./useReleaseWorkflow";
import { PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY } from "../constants";

const VALID_RELEASE = "123e4567-e89b-12d3-a456-426614174000";

describe("useReleaseWorkflow", () => {
  beforeEach(() => {
    resetReleaseWorkflowState();
  });

  it("initializes from localStorage when URL is incomplete", () => {
    localStorage.setItem(
      PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY,
      JSON.stringify({
        releaseId: VALID_RELEASE,
        accessId: "hub-storage",
        accessType: "acc",
      }),
    );
    window.history.replaceState({}, "", "/");

    const { result } = renderHook(() => useReleaseWorkflow());

    expect(result.current.releaseData).toEqual({
      releaseId: VALID_RELEASE,
      accessId: "hub-storage",
      accessType: "acc",
    });
  });

  it("initializes from URL and allows updates/submission", () => {
    window.history.replaceState(
      {},
      "",
      `?releaseId=${VALID_RELEASE}&accessId=hub-1&accessType=acc`,
    );

    const { result } = renderHook(() => useReleaseWorkflow());

    expect(result.current.releaseData.accessId).toBe("hub-1");
    expect(result.current.isComplete).toBe(true);
    expect(result.current.loadRequestId).toBe(1);

    act(() => result.current.updateReleaseData("accessId", "hub-2"));
    expect(result.current.releaseData.accessId).toBe("hub-2");

    act(() => result.current.submitReleaseData());
    expect(result.current.releaseFormError).toBeNull();
    expect(result.current.loadRequestId).toBe(2);
  });

  it("sets validation error when URL has invalid release id", () => {
    window.history.replaceState(
      {},
      "",
      "?releaseId=bad-uuid&accessId=hub-1&accessType=acc",
    );

    const { result } = renderHook(() => useReleaseWorkflow());
    expect(result.current.releaseFormError).toBeTruthy();
    expect(result.current.isComplete).toBe(false);
  });

  it("keeps form error when submitting invalid data", () => {
    window.history.replaceState({}, "", "/");
    const { result } = renderHook(() => useReleaseWorkflow());

    act(() => result.current.updateReleaseData("releaseId", "invalid"));
    act(() => result.current.updateReleaseData("accessId", "hub-2"));
    act(() => result.current.updateReleaseData("accessType", "acc"));

    const onSuccess = vi.fn();
    act(() => result.current.submitReleaseData(onSuccess));

    expect(result.current.releaseFormError).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("persists current URL state before login only when complete", () => {
    window.history.replaceState({}, "", "/");
    const { result } = renderHook(() => useReleaseWorkflow());

    act(() => result.current.persistCurrentUrlStateBeforeLogin());
    expect(localStorage.getItem(PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY)).toBeNull();

    window.history.replaceState(
      {},
      "",
      `?releaseId=${VALID_RELEASE}&accessId=hub-3&accessType=acc`,
    );
    act(() => result.current.persistCurrentUrlStateBeforeLogin());

    expect(localStorage.getItem(PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY)).toContain("hub-3");
  });
});
