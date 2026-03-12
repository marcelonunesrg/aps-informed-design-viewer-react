import Logout from "@mui/icons-material/Logout";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Settings from "@mui/icons-material/Settings";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import type { HeaderProps } from "./useHeader";

export function Header({
  userProfile,
  hasOpenRelease,
  accountMenuAnchor,
  accountMenuOpen,
  onOpenAccountMenu,
  onCloseAccountMenu,
  onOpenSettingsDialog,
  onOpenReleaseDialog,
  onRequestLogout,
}: HeaderProps) {
  const { t } = useTranslation();

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ bgcolor: "#000", color: "#fff", width: "100%" }}
    >
      <Toolbar variant="dense" sx={{ width: "100%", minWidth: 0 }}>
        <Typography
          variant="h6"
          component="div"
          noWrap
          sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {t("appTitle")}
        </Typography>
        <Button
          color="inherit"
          size="small"
          startIcon={<OpenInNew fontSize="small" />}
          onClick={onOpenReleaseDialog}
          sx={{ mr: 1, textTransform: "none" }}
        >
          {hasOpenRelease ? t("openAnotherRelease") : t("openRelease")}
        </Button>
        <IconButton
          color="inherit"
          onClick={onOpenAccountMenu}
          aria-label="account menu"
          aria-controls={accountMenuOpen ? "account-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={accountMenuOpen ? "true" : undefined}
        >
          <Avatar
            src={userProfile?.picture || undefined}
            alt={userProfile?.name || "User"}
            sx={{ width: 28, height: 28 }}
          >
            {userProfile?.name?.[0] || "U"}
          </Avatar>
        </IconButton>
        <Menu
          id="account-menu"
          anchorEl={accountMenuAnchor}
          open={accountMenuOpen}
          onClose={onCloseAccountMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', minWidth: 240 }}>
            <Avatar
              src={userProfile?.picture || undefined}
              alt={userProfile?.name || 'User'}
              sx={{ width: 48, height: 48 }}
            >
              {userProfile?.name?.[0] || 'U'}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Typography noWrap sx={{ fontWeight: 600 }}>{userProfile?.name || ''}</Typography>
              <Typography noWrap variant="caption" color="text.secondary">
                {userProfile?.email || ''}
              </Typography>
            </Box>
          </Box>
          <Divider />
          <MenuItem onClick={onOpenSettingsDialog}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            {t("settings")}
          </MenuItem>
          <Divider />
          <MenuItem onClick={onRequestLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            {t("logout")}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
