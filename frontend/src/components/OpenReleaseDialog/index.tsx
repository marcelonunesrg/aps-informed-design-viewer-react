import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useOpenReleaseDialog, OpenReleaseDialogProps } from "./useOpenReleaseDialog";
import { ProjectPicker } from "../ProjectPicker";
import { FolderTree } from "./FolderTree";
import { ProjectsList } from "./ProjectsList";
import { ReleaseDetailsPanel } from "./ReleaseDetailsPanel";
import { PublishersList } from "./PublishersList";

export function OpenReleaseDialog({
  open,
  onClose,
  accessType,
  currentReleaseId,
  onAccessTypeChange,
  onSubmit,
}: OpenReleaseDialogProps) {
  const { t } = useTranslation();
  const {
    projectPicker,
    treeNodes,
    accError,
    publishers,
    isLoadingPublishers,
    publishersError,
    selectedPublisherId,
    selectedContextId,
    selectedFolderId,
    isLoadingIndProjects,
    indProjectsError,
    expandedProductIds,
    productReleasesByProductId,
    productReleaseLoadingByProductId,
    productReleaseErrorByProductId,
    selectedReleaseId,
    selectedCategory,
    categoryOptions,
    filteredIndProjects,
    selectedReleaseData,
    selectedReleaseDetails,
    getLatestSelectedReleaseData,
    handleFolderSelect,
    handlePublisherSelect,
    handleToggleFolder,
    handleToggleProduct,
    handleSelectRelease,
    setSelectedCategory,
  } = useOpenReleaseDialog(accessType, open, currentReleaseId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="open-release-dialog-title"
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          minHeight: "75vh",
          width: "95vw",
          maxWidth: "1400px",
        },
      }}
    >
      <DialogTitle id="open-release-dialog-title">{t("openRelease")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
          <TextField
            select
            size="small"
            label={t("accessType")}
            value={accessType}
            onChange={(event) => onAccessTypeChange(event.target.value)}
            sx={(theme) => ({
              width: "30%",
              maxWidth: "30%",
              "& .MuiInputBase-root": {
                height: 36,
              },
              ...(theme.palette.mode === "dark"
                ? {
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: theme.palette.text.primary,
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.text.primary,
                    },
                  }
                : {}),
            })}
          >
            <MenuItem value="ACC">ACC</MenuItem>
            <MenuItem value="PUBLIC">PUBLIC</MenuItem>
          </TextField>

          {accessType === "ACC" && <ProjectPicker picker={projectPicker} />}

          {accessType === "PUBLIC" && (
            <TextField
              select
              size="small"
              label="Category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {categoryOptions.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>
        {(accessType === "ACC" || accessType === "PUBLIC") && (
          <Box sx={{ display: "flex", gap: 2, mt: 2, flex: 1, minHeight: 0 }}>
            {accessType === "ACC" && (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t("folders")}
                </Typography>
                <FolderTree
                  treeNodes={treeNodes}
                  accError={accError}
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={handleFolderSelect}
                  onToggleFolder={handleToggleFolder}
                />
              </Box>
            )}

            {accessType === "PUBLIC" && (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Publishers
                </Typography>
                <PublishersList
                  publishers={publishers}
                  selectedPublisherId={selectedPublisherId}
                  isLoading={isLoadingPublishers}
                  error={publishersError}
                  onSelectPublisher={handlePublisherSelect}
                />
              </Box>
            )}

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                IND Projects
              </Typography>
              <ProjectsList
                selectedContextId={selectedContextId}
                indProjects={filteredIndProjects}
                isLoading={isLoadingIndProjects}
                error={indProjectsError}
                expandedProductIds={expandedProductIds}
                productReleasesByProductId={productReleasesByProductId}
                productReleaseLoadingByProductId={productReleaseLoadingByProductId}
                productReleaseErrorByProductId={productReleaseErrorByProductId}
                selectedReleaseId={selectedReleaseId}
                onToggleProduct={handleToggleProduct}
                onSelectRelease={handleSelectRelease}
              />
            </Box>

            <Box
              sx={{
                flex: "0 0 286px",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Release Details
              </Typography>
              <ReleaseDetailsPanel
                details={selectedReleaseDetails}
                accessType={selectedReleaseData?.accessType}
                accessId={selectedReleaseData?.accessId}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 96, minHeight: 30 }}>
          {t("cancel")}
        </Button>
        <Button
          onClick={() => {
            const latestSelectedReleaseData = getLatestSelectedReleaseData() || selectedReleaseData;

            if (!latestSelectedReleaseData) {
              return;
            }

            onSubmit(latestSelectedReleaseData);
            window.location.reload();
          }}
          variant="contained"
          sx={{ minWidth: 96, minHeight: 30 }}
          disabled={!selectedReleaseData}
        >
          {t("openRelease")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
