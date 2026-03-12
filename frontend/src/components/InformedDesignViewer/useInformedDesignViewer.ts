import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getReleaseById } from "../../services/informedDesignService";
import {
  applyViewerTheme,
  getInformedDesignExtension,
  initViewer,
  loadReleaseModel,
} from "../../services/viewerService";
import { getViewerAccessToken } from "../../services/authService";
import {
  resetViewerMessageState,
  setViewerMessageState,
} from "../../store/viewerMessageStore";
import type { ThemeMode } from "../../types";
import type { AutodeskViewer, InformedDesignExtension } from "../../services/viewerService";

export interface InformedDesignViewerProps {
  releaseId: string;
  accessId: string;
  accessType: string;
  requestId: number;
  themeMode: ThemeMode;
}

export function useInformedDesignViewer({
  releaseId,
  accessId,
  accessType,
  requestId,
  themeMode,
}: InformedDesignViewerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<AutodeskViewer | null>(null);
  const latestLoadRunIdRef = useRef(0);

  useEffect(() => {
    let disposed = false;
    const runId = latestLoadRunIdRef.current + 1;
    latestLoadRunIdRef.current = runId;

    const isStale = () => disposed || latestLoadRunIdRef.current !== runId;

    async function load() {
      if (!releaseId || !accessId || !accessType) {
        resetViewerMessageState();
        return;
      }

      setViewerMessageState({ status: "loading", error: null });

      try {
        const token = await getViewerAccessToken();
        if (isStale()) {
          return;
        }

        const release = await getReleaseById({
          releaseId,
          accessId,
          accessType,
          accessToken: token.access_token,
        });
        if (isStale()) {
          return;
        }

        let viewer = viewerRef.current;
        if (!viewer) {
          viewer = await initViewer(containerRef.current as HTMLDivElement);
          viewerRef.current = viewer;
        }
        if (isStale()) {
          return;
        }

        await applyViewerTheme(viewer, themeMode);
        if (isStale()) {
          return;
        }

        const extension: InformedDesignExtension = await getInformedDesignExtension(viewer);
        if (isStale()) {
          return;
        }

        await loadReleaseModel(extension, {
          releaseId: release.id,
          accessId: release.accessId,
          accessType: release.accessType,
          productId: release.productId,
        });
        if (isStale()) {
          return;
        }

        if (!isStale()) {
          setViewerMessageState({ status: "ready", error: null });
        }
      } catch (viewerError) {
        if (!isStale()) {
          setViewerMessageState({
            status: "error",
            error: (viewerError as Error).message || t("loadReleaseError"),
          });
        }
      }
    }

    void load();

    return () => {
      disposed = true;
    };
  }, [releaseId, accessId, accessType, requestId, themeMode, t]);

  useEffect(() => {
    async function updateTheme() {
      if (!viewerRef.current) {
        return;
      }

      try {
        await applyViewerTheme(viewerRef.current, themeMode);
      } catch {
        // Ignore non-critical theme update errors
      }
    }

    void updateTheme();
  }, [themeMode]);

  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        viewerRef.current.finish();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const resizeViewer = () => {
      if (!viewerRef.current) {
        return;
      }

      viewerRef.current.resize();
      viewerRef.current.impl.invalidate(true, true, true);
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeViewer();
    });

    resizeObserver.observe(container);
    window.addEventListener("resize", resizeViewer);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeViewer);
    };
  }, []);

  return {
    containerRef,
  };
}
