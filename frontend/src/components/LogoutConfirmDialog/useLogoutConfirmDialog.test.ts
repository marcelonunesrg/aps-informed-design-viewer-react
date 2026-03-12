import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLogoutConfirmDialog } from "./useLogoutConfirmDialog";

describe("useLogoutConfirmDialog", () => {
  it("calls cancel and confirm callbacks", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useLogoutConfirmDialog({ onCancel, onConfirm }));

    act(() => result.current.handleCancel());
    act(() => result.current.handleConfirm());

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
