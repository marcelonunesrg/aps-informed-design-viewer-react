import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import Search from "@mui/icons-material/Search";
import StarBorder from "@mui/icons-material/StarBorder";
import Star from "@mui/icons-material/Star";
import {
  renderHighlightedMatch,
  UseProjectPickerResult,
} from "./useProjectPicker";

interface ProjectPickerProps {
  picker: UseProjectPickerResult;
}

export function ProjectPicker({ picker }: ProjectPickerProps) {
  return (
    <>
      <TextField
        size="small"
        label="Hub/Project"
        value={picker.hubProjectValue}
        inputRef={picker.hubProjectInputRef}
        onClick={picker.onHubProjectClick}
        InputProps={{
          readOnly: true,
          startAdornment: picker.selectedHubProject?.imageUrl ? (
            <InputAdornment position="start">
              <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                <img
                  src={picker.selectedHubProject.imageUrl}
                  alt={picker.selectedHubProject.name}
                  style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }}
                />
              </Box>
            </InputAdornment>
          ) : undefined,
          endAdornment: (
            <InputAdornment position="end">
              <KeyboardArrowDown fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{
          flex: 1,
          "& .MuiInputBase-root": {
            height: 36,
            cursor: "pointer",
          },
          "& .MuiInputBase-input": {
            cursor: "pointer",
          },
        }}
      />

      <Popover
        open={picker.isHubProjectMenuOpen}
        anchorEl={picker.hubProjectAnchorEl}
        onClose={() => {
          picker.closeHubProjectMenu();
          try {
            picker.hubProjectInputRef.current?.blur();
          } catch {
            // ignore
          }
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {picker.isHubProjectMenuOpen ? (
          <Box ref={picker.hubProjectPopoverContentRef} sx={{ px: 1, py: 1.5, width: 420 }}>
            <TextField
              size="small"
              placeholder="Search"
              value={picker.hubProjectSearch}
              onChange={(event) => picker.setHubProjectSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              fullWidth
            />

            <List dense sx={{ mt: 1, maxHeight: 260, overflowY: "auto" }}>
              {picker.hubProjectsError && !picker.isLoadingHubProjects && (
                <Box sx={{ px: 1.5, py: 1, color: "error.main", fontSize: 14 }}>
                  {picker.hubProjectsError}
                </Box>
              )}
              {picker.filteredHubProjectItems.map((item, index) => (
                <ListItemButton
                  key={`${item.id}-${item.name}-${index}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => picker.selectHubProject(item)}
                  sx={{ px: 0 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                    {item.imageUrl && (
                      <Box sx={{ minWidth: 40, display: "flex", alignItems: "center", mr: 1 }}>
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }}
                        />
                      </Box>
                    )}

                    <ListItemText
                      primary={
                        <Typography>{renderHighlightedMatch(item.name, picker.hubProjectSearch)}</Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {renderHighlightedMatch(item.accountName, picker.hubProjectSearch)}
                        </Typography>
                      }
                      sx={{ mr: 1 }}
                    />

                    {item.platform && (
                      <Chip label={item.platform} size="small" sx={{ ml: "auto", textTransform: "uppercase" }} />
                    )}

                    <IconButton
                      size="small"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        picker.toggleFavoriteProject(item.id);
                      }}
                      aria-label={
                        picker.isFavoriteProject(item.id)
                          ? `Remove ${item.name} from favorites`
                          : `Add ${item.name} to favorites`
                      }
                      sx={{ ml: 1 }}
                    >
                      {picker.isFavoriteProject(item.id) ? (
                        <Star fontSize="small" color="warning" />
                      ) : (
                        <StarBorder fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                </ListItemButton>
              ))}
              {!picker.isLoadingHubProjects &&
                !picker.hubProjectsError &&
                picker.filteredHubProjectItems.length === 0 && (
                  <Box sx={{ px: 1.5, py: 1, color: "text.secondary", fontSize: 14 }}>No results</Box>
                )}
              {picker.isLoadingHubProjects && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <LinearProgress />
                </Box>
              )}
            </List>
          </Box>
        ) : (
          <Box sx={{ px: 1, py: 1.5, width: 420 }} />
        )}
      </Popover>
    </>
  );
}