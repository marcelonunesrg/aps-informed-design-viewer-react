import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronRight from "@mui/icons-material/ChevronRight";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import FolderOpenOutlined from "@mui/icons-material/FolderOpenOutlined";

export interface FolderTreeNode {
  id: string;
  name: string;
  hasChildren: boolean;
  children?: FolderTreeNode[];
  loaded?: boolean;
  expanded?: boolean;
  loading?: boolean;
}

interface FolderTreeProps {
  treeNodes: FolderTreeNode[];
  accError: string | null;
  selectedFolderId: string | null;
  onFolderSelect: (nodeId: string) => void;
  onToggleFolder: (nodeId: string) => void;
}

interface FolderTreeItemsProps {
  nodes: FolderTreeNode[];
  level?: number;
  selectedFolderId: string | null;
  onNodeClick: (nodeId: string) => void;
  onToggleExpand: (nodeId: string) => void;
}

function FolderTreeItems({
  nodes,
  level = 0,
  selectedFolderId,
  onNodeClick,
  onToggleExpand,
}: FolderTreeItemsProps) {
  return (
    <List dense disablePadding>
      {nodes.map((node) => {
        const isExpanded = Boolean(node.expanded);
        const showOpenFolder = node.hasChildren && isExpanded;

        return (
          <Box key={node.id}>
            <ListItemButton
              sx={{ pl: 1 + level * 2 }}
              selected={selectedFolderId === node.id}
              onClick={() => onNodeClick(node.id)}
            >
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  if (node.hasChildren) {
                    onToggleExpand(node.id);
                  }
                }}
                disabled={!node.hasChildren || Boolean(node.loading)}
              >
                {node.loading ? (
                  <CircularProgress size={14} />
                ) : isExpanded ? (
                  <ExpandMore fontSize="small" />
                ) : (
                  <ChevronRight fontSize="small" />
                )}
              </IconButton>

              {showOpenFolder ? (
                <FolderOpenOutlined fontSize="small" sx={{ mr: 1 }} />
              ) : (
                <FolderOutlined fontSize="small" sx={{ mr: 1 }} />
              )}

              <ListItemText primary={node.name} />
            </ListItemButton>

            {isExpanded && node.children && node.children.length > 0 && (
              <FolderTreeItems
                nodes={node.children}
                level={level + 1}
                selectedFolderId={selectedFolderId}
                onNodeClick={onNodeClick}
                onToggleExpand={onToggleExpand}
              />
            )}
          </Box>
        );
      })}
    </List>
  );
}

export function FolderTree({
  treeNodes,
  accError,
  selectedFolderId,
  onFolderSelect,
  onToggleFolder,
}: FolderTreeProps) {
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
      {accError && (
        <Box sx={{ px: 1.5, py: 1, color: "error.main", fontSize: 13 }}>
          {accError}
        </Box>
      )}
      <FolderTreeItems
        nodes={treeNodes}
        selectedFolderId={selectedFolderId}
        onNodeClick={onFolderSelect}
        onToggleExpand={onToggleFolder}
      />
    </Paper>
  );
}