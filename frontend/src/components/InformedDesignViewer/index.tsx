import { useInformedDesignViewer } from "./useInformedDesignViewer";
import type { InformedDesignViewerProps } from "./useInformedDesignViewer";

export function InformedDesignViewer({
  releaseId,
  accessId,
  accessType,
  requestId,
  themeMode,
}: InformedDesignViewerProps) {
  const { containerRef } = useInformedDesignViewer({
    releaseId,
    accessId,
    accessType,
    requestId,
    themeMode,
  });

  return (
    <div className="viewer-shell">
      <div ref={containerRef} className="viewer-canvas" />
    </div>
  );
}
