import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect, useState } from "react";
import type { SelectedReleaseDetails } from "./useOpenReleaseDialog";
import { getViewerAccessToken } from "../../services/authService";
import { getProductDownloadUrl } from "../../services/informedDesignService";

const THUMBNAIL_HEIGHT = 220;
const RELEASE_DETAILS_MAX_WIDTH = Math.round(THUMBNAIL_HEIGHT * 1.3);

interface ReleaseDetailsPanelProps {
  details: SelectedReleaseDetails | null;
  accessType?: string;
  accessId?: string;
}

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function DetailsRow({ label, value }: { label: string; value?: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "right", wordBreak: "break-word" }}>
        {value?.trim() || "-"}
      </Typography>

    </Box>
  );
}

export function ReleaseDetailsPanel({ details, accessType, accessId }: ReleaseDetailsPanelProps) {
  const [resolvedThumbnailUrl, setResolvedThumbnailUrl] = useState<string | null>(null);
  const [isResolvingThumbnail, setIsResolvingThumbnail] = useState(false);

  useEffect(() => {
    let active = true;

    if (!details) {
      setResolvedThumbnailUrl(null);
      setIsResolvingThumbnail(false);
      return;
    }

    const objectKey = details.release.thumbnailObjectKey?.trim();
    const directThumbnailUrl = details.release.thumbnailUrl || details.product.thumbnailUrl || null;

    if (!objectKey || !accessType || !accessId) {
      setResolvedThumbnailUrl(directThumbnailUrl);
      setIsResolvingThumbnail(false);
      return;
    }

    setResolvedThumbnailUrl(null);
    setIsResolvingThumbnail(true);

    (async () => {
      try {
        const token = await getViewerAccessToken();
        if (!active) {
          return;
        }

        const downloadUrl = await getProductDownloadUrl({
          productId: details.product.id,
          accessType,
          accessId,
          objectKey,
          accessToken: token.access_token,
        });

        if (!active) {
          return;
        }

        setResolvedThumbnailUrl(downloadUrl);
      } catch {
        if (!active) {
          return;
        }

        setResolvedThumbnailUrl(directThumbnailUrl);
      } finally {
        if (active) {
          setIsResolvingThumbnail(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [details, accessType, accessId]);

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        flex: 1,
        width: "100%",
        maxWidth: `${RELEASE_DETAILS_MAX_WIDTH}px`,
        overflow: "auto",
        p: 1.5,
        bgcolor: "background.paper",
        borderColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.23)" : "rgba(0, 0, 0, 0.23)",
        transition: theme.transitions.create(["border-color", "box-shadow"], {
          duration: theme.transitions.duration.shorter,
        }),
        "&:hover": {
          borderColor: theme.palette.text.primary,
        },
        "&:focus-within": {
          borderColor: theme.palette.text.primary,
          boxShadow: `0 0 0 1px ${theme.palette.text.primary}`,
        },
      })}
    >
      {!details && (
        <Box sx={{ color: "text.secondary", p: 1 }}>
          Select a release to view details.
        </Box>
      )}

      {details && (
        <Box>
          <Box
            sx={{
              width: "100%",
              height: THUMBNAIL_HEIGHT,
              borderRadius: 1,
              bgcolor: "action.hover",
              mb: 1.5,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isResolvingThumbnail ? (
              <CircularProgress size={22} />
            ) : resolvedThumbnailUrl ? (
              <Box
                component="img"
                src={resolvedThumbnailUrl}
                alt={details.release.name || details.product.name}
                sx={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No thumbnail available
              </Typography>
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {details.product.name}
          </Typography>

          <Divider sx={{ my: 1 }} />

          <DetailsRow label="Release Number" value={details.release.releaseNumber} />
          <DetailsRow label="State" value={details.release.state} />
          <DetailsRow label="Default Release" value={details.isDefaultRelease ? "Yes" : "No"} />
          <DetailsRow label="Authoring App" value={details.product.authoringApp} />
          <DetailsRow label="Created" value={formatDate(details.release.createdAt || details.product.createdAt)} />
          <DetailsRow label="Updated" value={formatDate(details.release.updatedAt || details.product.updatedAt)} />
        </Box>
      )}
    </Paper>
  );
}
