import DarkMode from "@mui/icons-material/DarkMode";
import LightMode from "@mui/icons-material/LightMode";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { useSettingsDialog } from "./useSettingsDialog";
import type { SettingsDialogProps } from "./useSettingsDialog";

export function SettingsDialog({
  open,
  onClose,
  themeMode,
  onThemeModeChange,
  language,
  onLanguageChange,
}: SettingsDialogProps) {
  const { handleThemeModeChange, handleLanguageChange } = useSettingsDialog({
    onThemeModeChange,
    onLanguageChange,
  });
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="settings-dialog-title" fullWidth maxWidth="md">
      <DialogTitle id="settings-dialog-title">{t("settings")}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t("theme")}
            </Typography>
            <RadioGroup
              value={themeMode}
              onChange={handleThemeModeChange}
            >
              <FormControlLabel
                value="light"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LightMode fontSize="small" />
                    <span>{t("lightTheme")}</span>
                  </Box>
                }
              />
              <FormControlLabel
                value="dark"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DarkMode fontSize="small" />
                    <span>{t("darkTheme")}</span>
                  </Box>
                }
              />
            </RadioGroup>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t("language")}
            </Typography>
            <RadioGroup
              value={language}
              onChange={handleLanguageChange}
            >
              <FormControlLabel value="en" control={<Radio size="small" />} label={t("english")} />
              <FormControlLabel value="es" control={<Radio size="small" />} label={t("spanish")} />
              <FormControlLabel value="fr" control={<Radio size="small" />} label={t("french")} />
              <FormControlLabel value="pt" control={<Radio size="small" />} label={t("portuguese")} />
            </RadioGroup>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
