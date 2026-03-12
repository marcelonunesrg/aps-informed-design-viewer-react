import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useTranslation } from "react-i18next";
import { useLogoutConfirmDialog } from "./useLogoutConfirmDialog";
import type { LogoutConfirmDialogProps } from "./useLogoutConfirmDialog";

export function LogoutConfirmDialog({ open, onCancel, onConfirm }: LogoutConfirmDialogProps) {
  const { handleCancel, handleConfirm } = useLogoutConfirmDialog({ onCancel, onConfirm });
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="logout-confirmation-title"
      aria-describedby="logout-confirmation-description"
    >
      <DialogTitle id="logout-confirmation-title">{t("confirmLogout")}</DialogTitle>
      <DialogContent>
        <DialogContentText id="logout-confirmation-description">
          {t("confirmLogoutMessage")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleCancel}
          variant="outlined"
          color="inherit"
          sx={{ minWidth: 96, minHeight: 30 }}
        >
          {t("cancel")}
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained" sx={{ minWidth: 96, minHeight: 30 }}>
          {t("logout")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
