import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronRight from "@mui/icons-material/ChevronRight";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import PauseCircleOutline from "@mui/icons-material/PauseCircleOutline";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import type { InformedDesignProduct } from "../../services/informedDesignService";
import type { InformedDesignReleaseItem } from "../../services/informedDesignService";
import inventorProductIcon from "../../assets/autodesk-informed-design-for-inventor-product-icon.svg";
import fusionProductIcon from "../../assets/autodesk-fusion-product-icon.svg";

interface ProjectsListProps {
  selectedContextId: string | null;
  indProjects: InformedDesignProduct[];
  isLoading: boolean;
  error: string | null;
  expandedProductIds: string[];
  productReleasesByProductId: Record<string, InformedDesignReleaseItem[]>;
  productReleaseLoadingByProductId: Record<string, boolean>;
  productReleaseErrorByProductId: Record<string, string | null>;
  selectedReleaseId: string | null;
  onToggleProduct: (productId: string) => void;
  onSelectRelease: (releaseId: string) => void;
}

function getReleaseStateIcon(state?: string) {
  const status = state || "UNKNOWN";

  const icon = (() => {
    if (state === "ACTIVE") {
      return <CheckCircleOutline fontSize="small" color="success" />;
    }

    if (state === "INACTIVE") {
      return <PauseCircleOutline fontSize="small" color="disabled" />;
    }

    if (state === "OBSOLETE") {
      return <ArchiveOutlined fontSize="small" color="warning" />;
    }

    return <DescriptionOutlined fontSize="small" />;
  })();

  return (
    <Tooltip title={status} placement="top" arrow>
      <Box component="span" sx={{ display: "inline-flex", alignItems: "center" }}>
        {icon}
      </Box>
    </Tooltip>
  );
}

function isDefaultRelease(product: InformedDesignProduct, release: InformedDesignReleaseItem): boolean {
  const defaultRelease = product.defaultRelease?.trim();
  if (!defaultRelease) {
    return false;
  }

  const normalizedDefault = defaultRelease.toUpperCase();
  const releaseId = release.id.trim().toUpperCase();
  const releaseNumber = release.releaseNumber?.trim().toUpperCase();
  const releaseName = release.name.trim().toUpperCase();

  return normalizedDefault === releaseId || normalizedDefault === releaseNumber || normalizedDefault === releaseName;
}

export function ProjectsList({
  selectedContextId,
  indProjects,
  isLoading,
  error,
  expandedProductIds,
  productReleasesByProductId,
  productReleaseLoadingByProductId,
  productReleaseErrorByProductId,
  selectedReleaseId,
  onToggleProduct,
  onSelectRelease,
}: ProjectsListProps) {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        flex: 1,
        overflow: "auto",
        p: 1,
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
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!isLoading && error && <Box sx={{ color: "error.main", p: 1 }}>{error}</Box>}

      {!isLoading && selectedContextId && !error && indProjects.length > 0 && (
        <List dense disablePadding>
          {indProjects.map((project) => (
            <Box key={project.id}>
              <ListItemButton onClick={() => onToggleProduct(project.id)}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {productReleaseLoadingByProductId[project.id] ? (
                    <CircularProgress size={14} />
                  ) : expandedProductIds.includes(project.id) ? (
                    <ExpandMore fontSize="small" />
                  ) : (
                    <ChevronRight fontSize="small" />
                  )}
                </ListItemIcon>

                <ListItemIcon sx={{ minWidth: 32 }}>
                  {project.authoringApp?.toUpperCase() === "INVENTOR" ? (
                    <Box
                      component="img"
                      src={inventorProductIcon}
                      alt="Autodesk Inventor"
                      sx={{ width: 18, height: 18, objectFit: "contain" }}
                    />
                  ) : project.authoringApp?.toUpperCase() === "FUSION" ? (
                    <Box
                      component="img"
                      src={fusionProductIcon}
                      alt="Autodesk Fusion"
                      sx={{ width: 18, height: 18, objectFit: "contain" }}
                    />
                  ) : (
                    <DescriptionOutlined fontSize="small" />
                  )}
                </ListItemIcon>

                <ListItemText primary={project.name} />
              </ListItemButton>

              {expandedProductIds.includes(project.id) && (
                <Box sx={{ pl: 6 }}>
                  {productReleaseErrorByProductId[project.id] && (
                    <Box sx={{ color: "error.main", p: 1, fontSize: 13 }}>
                      {productReleaseErrorByProductId[project.id]}
                    </Box>
                  )}

                  {!productReleaseErrorByProductId[project.id] &&
                    !productReleaseLoadingByProductId[project.id] &&
                    (productReleasesByProductId[project.id]?.length ?? 0) === 0 && (
                      <Box sx={{ color: "text.secondary", p: 1, fontSize: 13 }}>
                        No releases found for this product.
                      </Box>
                    )}

                  {(productReleasesByProductId[project.id]?.length ?? 0) > 0 && (
                    <List dense disablePadding>
                      {(productReleasesByProductId[project.id] || []).map((release) => (
                        <ListItem key={release.id} sx={{ pl: 0 }} disablePadding>
                          <ListItemButton
                            selected={selectedReleaseId === release.id}
                            onClick={() => onSelectRelease(release.id)}
                            sx={{ pl: 0.5 }}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              {getReleaseStateIcon(release.state)}
                            </ListItemIcon>
                            <ListItemText
                              primary={`Release ${release.releaseNumber || release.name || "-"}${
                                isDefaultRelease(project, release) ? " (default)" : ""
                              }`}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </List>
      )}

      {!isLoading && selectedContextId && !error && indProjects.length === 0 && (
        <Box sx={{ color: "text.secondary", p: 1 }}>No products found in this folder.</Box>
      )}

      {!isLoading && !selectedContextId && !error && (
        <Box sx={{ color: "text.secondary", p: 1 }}>Select a source to see IND projects.</Box>
      )}
    </Paper>
  );
}
