import { useCallback } from "react";
import type { MouseEvent } from "react";
import { create } from "zustand";

interface UseAppUiStateArgs {
  onLogout?: () => void;
}

interface AppUiState {
  accountMenuAnchor: HTMLElement | null;
  logoutDialogOpen: boolean;
  releaseDialogOpen: boolean;
  settingsDialogOpen: boolean;
  setAccountMenuAnchor: (value: HTMLElement | null) => void;
  setLogoutDialogOpen: (value: boolean) => void;
  setReleaseDialogOpen: (value: boolean) => void;
  setSettingsDialogOpen: (value: boolean) => void;
  closeSettingsDialog: () => void;
  closeReleaseDialog: () => void;
  closeLogoutDialog: () => void;
  openAccountMenu: (anchor: HTMLElement) => void;
  closeAccountMenu: () => void;
}

const initialAppUiState = {
  accountMenuAnchor: null,
  logoutDialogOpen: false,
  releaseDialogOpen: false,
  settingsDialogOpen: false,
};

const useAppUiStore = create<AppUiState>((set) => ({
  ...initialAppUiState,
  setAccountMenuAnchor: (value) => set({ accountMenuAnchor: value }),
  setLogoutDialogOpen: (value) => set({ logoutDialogOpen: value }),
  setReleaseDialogOpen: (value) => set({ releaseDialogOpen: value }),
  setSettingsDialogOpen: (value) => set({ settingsDialogOpen: value }),
  closeSettingsDialog: () => set({ settingsDialogOpen: false }),
  closeReleaseDialog: () => set({ releaseDialogOpen: false }),
  closeLogoutDialog: () => set({ logoutDialogOpen: false }),
  openAccountMenu: (anchor) => set({ accountMenuAnchor: anchor }),
  closeAccountMenu: () => set({ accountMenuAnchor: null }),
}));

export function resetAppUiState(): void {
  useAppUiStore.setState(initialAppUiState);
}

export function useAppUiState({ onLogout }: UseAppUiStateArgs = {}) {
  const accountMenuAnchor = useAppUiStore((state) => state.accountMenuAnchor);
  const setAccountMenuAnchor = useAppUiStore((state) => state.setAccountMenuAnchor);
  const logoutDialogOpen = useAppUiStore((state) => state.logoutDialogOpen);
  const setLogoutDialogOpen = useAppUiStore((state) => state.setLogoutDialogOpen);
  const releaseDialogOpen = useAppUiStore((state) => state.releaseDialogOpen);
  const setReleaseDialogOpen = useAppUiStore((state) => state.setReleaseDialogOpen);
  const settingsDialogOpen = useAppUiStore((state) => state.settingsDialogOpen);
  const setSettingsDialogOpen = useAppUiStore((state) => state.setSettingsDialogOpen);
  const closeSettingsDialog = useAppUiStore((state) => state.closeSettingsDialog);
  const closeReleaseDialog = useAppUiStore((state) => state.closeReleaseDialog);
  const closeLogoutDialog = useAppUiStore((state) => state.closeLogoutDialog);
  const openAccountMenuByAnchor = useAppUiStore((state) => state.openAccountMenu);
  const closeAccountMenu = useAppUiStore((state) => state.closeAccountMenu);

  const accountMenuOpen = Boolean(accountMenuAnchor);

  const handleLogout = useCallback((): void => {
    setLogoutDialogOpen(false);
    onLogout?.();
  }, [onLogout, setLogoutDialogOpen]);

  const openAccountMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    openAccountMenuByAnchor(event.currentTarget);
  }, [openAccountMenuByAnchor]);

  return {
    accountMenuAnchor,
    setAccountMenuAnchor,
    accountMenuOpen,
    logoutDialogOpen,
    setLogoutDialogOpen,
    releaseDialogOpen,
    setReleaseDialogOpen,
    settingsDialogOpen,
    setSettingsDialogOpen,
    closeSettingsDialog,
    closeReleaseDialog,
    closeLogoutDialog,
    handleLogout,
    openAccountMenu,
    closeAccountMenu,
  };
}
