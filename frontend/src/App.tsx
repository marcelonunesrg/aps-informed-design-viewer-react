import { useCallback, useEffect } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import { useTranslation } from "react-i18next";
import { AuthGatekeeper } from "./components/AuthGatekeeper";
import { Header } from "./components/Header";
import { InformedDesignViewer } from "./components/InformedDesignViewer";
import { LogoutConfirmDialog } from "./components/LogoutConfirmDialog";
import { OpenReleaseDialog } from "./components/OpenReleaseDialog";
import { SettingsDialog } from "./components/SettingsDialog";
import { TerminalDrawer } from "./components/TerminalDrawer";
import { useHeader } from "./components/Header/useHeader";
import { logout } from "./services/authService";
import { useAuthSession } from "./hooks/useAuthSession";
import { useReleaseWorkflow } from "./hooks/useReleaseWorkflow";
import { useAppUiState } from "./hooks/useAppUiState";
import { usePreferences } from "./hooks/usePreferences";
import { useViewerMessageState } from "./store/viewerMessageStore";
import { hasCompleteProductReleaseData, parseProductReleaseFromUrl } from "./utils/productReleaseStorage";
import "./App.css";

function App() {
  const { t, i18n } = useTranslation();
  const handleChangeLanguage = useCallback(
    (lang: string) => i18n.changeLanguage(lang),
    [i18n],
  );
  const {
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    theme,
  } = usePreferences(handleChangeLanguage);
  const {
    accountMenuAnchor,
    setAccountMenuAnchor,
    accountMenuOpen,
    logoutDialogOpen,
    setLogoutDialogOpen,
    releaseDialogOpen,
    setReleaseDialogOpen,
    settingsDialogOpen,
    setSettingsDialogOpen,
    terminalDrawerOpen,
    setTerminalDrawerOpen,
    closeSettingsDialog,
    closeReleaseDialog,
    closeLogoutDialog,
    closeTerminalDrawer,
    handleLogout,
  } = useAppUiState({ onLogout: logout });
  const { userProfile, setUserProfile } = useAuthSession();
  const {
    releaseData,
    activeReleaseData,
    loadRequestId,
    isComplete,
    persistCurrentUrlStateBeforeLogin,
    submitSpecificReleaseData,
    updateReleaseData,
  } = useReleaseWorkflow();
  const viewerMessageState = useViewerMessageState();
  const snackbarOffsetSx = { mt: 7 };

  const {
    openAccountMenu,
    closeAccountMenu,
    requestLogout,
    openSettingsDialog,
    openReleaseDialog,
    openTerminalDrawer,
  } = useHeader({
    setAccountMenuAnchor,
    setLogoutDialogOpen,
    setReleaseDialogOpen,
    setSettingsDialogOpen,
    setTerminalDrawerOpen,
    setUserProfile,
  });

  useEffect(() => {
    const releaseFromUrl = parseProductReleaseFromUrl(window.location);

    if (!hasCompleteProductReleaseData(releaseFromUrl)) {
      setReleaseDialogOpen(true);
    }
  }, [setReleaseDialogOpen]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthGatekeeper onBeforeLoginRedirect={persistCurrentUrlStateBeforeLogin}>
        <div className="page-shell">
          <Header
            userProfile={userProfile}
            hasOpenRelease={isComplete}
            accountMenuAnchor={accountMenuAnchor}
            accountMenuOpen={accountMenuOpen}
            onOpenAccountMenu={openAccountMenu}
            onCloseAccountMenu={closeAccountMenu}
            onOpenSettingsDialog={openSettingsDialog}
            onOpenReleaseDialog={openReleaseDialog}
            onOpenTerminalDrawer={openTerminalDrawer}
            onRequestLogout={requestLogout}
          />

          <TerminalDrawer
            open={terminalDrawerOpen}
            onClose={closeTerminalDrawer}
            activeReleaseData={activeReleaseData}
            onApplyReleaseSelection={(nextReleaseData) => submitSpecificReleaseData(nextReleaseData)}
          />

          <OpenReleaseDialog
            open={releaseDialogOpen}
            onClose={closeReleaseDialog}
            accessType={releaseData.accessType}
            currentReleaseId={activeReleaseData?.releaseId || releaseData.releaseId}
            onAccessTypeChange={(value) => updateReleaseData("accessType", value)}
            onSubmit={(selectedReleaseData) => submitSpecificReleaseData(selectedReleaseData, closeReleaseDialog)}
          />

          <SettingsDialog
            open={settingsDialogOpen}
            onClose={closeSettingsDialog}
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
            language={language}
            onLanguageChange={setLanguage}
          />

          <LogoutConfirmDialog
            open={logoutDialogOpen}
            onCancel={closeLogoutDialog}
            onConfirm={handleLogout}
          />

          {isComplete ? (
            <>
              <InformedDesignViewer
                releaseId={activeReleaseData.releaseId}
                accessId={activeReleaseData.accessId}
                accessType={activeReleaseData.accessType}
                requestId={loadRequestId}
                themeMode={themeMode}
              />
              {viewerMessageState.status === "loading" && (
                <Snackbar
                  open
                  anchorOrigin={{ vertical: "top", horizontal: "left" }}
                  sx={snackbarOffsetSx}
                >
                  <Alert severity="info" variant="filled">
                    {t("loadingRelease")}
                  </Alert>
                </Snackbar>
              )}
              {viewerMessageState.status === "error" && (
                <Snackbar
                  open
                  anchorOrigin={{ vertical: "top", horizontal: "left" }}
                  sx={snackbarOffsetSx}
                >
                  <Alert severity="error" variant="filled">
                    {viewerMessageState.error}
                  </Alert>
                </Snackbar>
              )}
            </>
          ) : (
            <div className="viewer-shell">
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  color: "text.secondary",
                  textAlign: "center",
                  px: 2,
                }}
              >
                <Inventory2Outlined sx={{ fontSize: 56, opacity: 0.75 }} />
                <Typography variant="body1">{t("provideParameters")}</Typography>
              </Box>
            </div>
          )}
        </div>
      </AuthGatekeeper>
    </ThemeProvider>
  );
}

export default App;
