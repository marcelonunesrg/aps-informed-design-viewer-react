import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import type { InformedDesignPublisher } from "../../services/informedDesignService";

interface PublishersListProps {
  publishers: InformedDesignPublisher[];
  selectedPublisherId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectPublisher: (publisherId: string) => void;
}

export function PublishersList({
  publishers,
  selectedPublisherId,
  isLoading,
  error,
  onSelectPublisher,
}: PublishersListProps) {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        flex: 1,
        overflow: "auto",
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

      {!isLoading && error && <Box sx={{ px: 1.5, py: 1, color: "error.main", fontSize: 13 }}>{error}</Box>}

      {!isLoading && !error && publishers.length > 0 && (
        <List dense disablePadding>
          {publishers.map((publisher) => (
            <ListItemButton
              key={publisher.id}
              selected={selectedPublisherId === publisher.id}
              onClick={() => onSelectPublisher(publisher.id)}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ApartmentOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={publisher.name} />
            </ListItemButton>
          ))}
        </List>
      )}

      {!isLoading && !error && publishers.length === 0 && (
        <Box sx={{ color: "text.secondary", p: 1 }}>No publishers found.</Box>
      )}
    </Paper>
  );
}
