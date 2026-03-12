import { render, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { ThemeMode } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("../../services/authService", () => ({
  getViewerAccessToken: vi.fn(async () => ({ access_token: "token" })),
}));

vi.mock("../../services/informedDesignService", () => ({
  getReleaseById: vi.fn(async () => ({
    id: "r1",
    accessId: "a1",
    accessType: "acc",
    productId: "p1",
  })),
}));

vi.mock("../../services/viewerService", () => ({
  applyViewerTheme: vi.fn(async () => undefined),
  getInformedDesignExtension: vi.fn(async () => ({ id: "ext" })),
  initViewer: vi.fn(async () => ({
    finish: vi.fn(),
    resize: vi.fn(),
    impl: { invalidate: vi.fn() },
  })),
  loadReleaseModel: vi.fn(async () => undefined),
}));

vi.mock("../../store/viewerMessageStore", () => ({
  resetViewerMessageState: vi.fn(),
  setViewerMessageState: vi.fn(),
}));

import { useInformedDesignViewer } from "./useInformedDesignViewer";
import {
  applyViewerTheme,
  getInformedDesignExtension,
  initViewer,
  loadReleaseModel,
} from "../../services/viewerService";
import { getReleaseById } from "../../services/informedDesignService";
import {
  resetViewerMessageState,
  setViewerMessageState,
} from "../../store/viewerMessageStore";

function HookHost(props: Parameters<typeof useInformedDesignViewer>[0]) {
  const { containerRef } = useInformedDesignViewer(props);
  return React.createElement("div", {
    ref: containerRef,
    "data-testid": "viewer-container",
  });
}

describe("useInformedDesignViewer", () => {
  it("resets state when required params are missing", () => {
    renderHook(() =>
      useInformedDesignViewer({
        releaseId: "",
        accessId: "",
        accessType: "",
        requestId: 1,
        themeMode: "light",
      }),
    );

    expect(resetViewerMessageState).toHaveBeenCalled();
  });

  it("loads release and updates viewer message state", async () => {
    const { unmount } = renderHook(() =>
      useInformedDesignViewer({
        releaseId: "r1",
        accessId: "a1",
        accessType: "acc",
        requestId: 2,
        themeMode: "dark",
      }),
    );

    await waitFor(() => expect(loadReleaseModel).toHaveBeenCalled());
    expect(initViewer).toHaveBeenCalled();
    expect(applyViewerTheme).toHaveBeenCalled();
    expect(setViewerMessageState).toHaveBeenCalledWith({ status: "ready", error: null });

    const viewer = await vi.mocked(initViewer).mock.results[0].value;
    unmount();
    expect(viewer.finish).toHaveBeenCalled();
  });

  it("sets error state when release loading fails", async () => {
    vi.mocked(getReleaseById).mockRejectedValueOnce(new Error("release failed") as never);

    renderHook(() =>
      useInformedDesignViewer({
        releaseId: "r1",
        accessId: "a1",
        accessType: "acc",
        requestId: 3,
        themeMode: "light",
      }),
    );

    await waitFor(() =>
      expect(setViewerMessageState).toHaveBeenCalledWith({
        status: "error",
        error: "release failed",
      }),
    );
  });

  it("continues gracefully when theme update fails", async () => {
    const viewer = {
      finish: vi.fn(),
      resize: vi.fn(),
      impl: { invalidate: vi.fn() },
    };
    vi.mocked(initViewer).mockResolvedValueOnce(viewer as never);
    vi.mocked(applyViewerTheme)
      .mockResolvedValueOnce(undefined as never)
      .mockRejectedValueOnce(new Error("theme failed") as never);
    vi.mocked(getInformedDesignExtension).mockResolvedValueOnce({ id: "ext" } as never);

    const { rerender } = renderHook(
      ({ themeMode, requestId }) =>
        useInformedDesignViewer({
          releaseId: "r1",
          accessId: "a1",
          accessType: "acc",
          requestId,
          themeMode,
        }),
      {
        initialProps: { themeMode: "light" as ThemeMode, requestId: 4 },
      },
    );

    await waitFor(() => expect(loadReleaseModel).toHaveBeenCalled());
    rerender({ themeMode: "dark", requestId: 4 });
    await waitFor(() => expect(applyViewerTheme).toHaveBeenCalledTimes(2));
  });

  it("registers resize handling when container ref is mounted", async () => {
    const viewer = {
      finish: vi.fn(),
      resize: vi.fn(),
      impl: { invalidate: vi.fn() },
    };
    vi.mocked(initViewer).mockResolvedValueOnce(viewer as never);

    const { unmount } = render(
      React.createElement(HookHost, {
        releaseId: "r1",
        accessId: "a1",
        accessType: "acc",
        requestId: 5,
        themeMode: "light",
      }),
    );

    await waitFor(() => expect(loadReleaseModel).toHaveBeenCalled());

    window.dispatchEvent(new Event("resize"));
    expect(viewer.resize).toHaveBeenCalled();
    expect(viewer.impl.invalidate).toHaveBeenCalled();

    unmount();
    expect(viewer.finish).toHaveBeenCalled();
  });
});
