import { useCallback } from "react";
import type { MouseEvent } from "react";
import { getUserProfile } from "../../services/authService";
import type { UserProfile } from "../../types";

export interface HeaderProps {
  userProfile: UserProfile | null;
  accountMenuAnchor: HTMLElement | null;
  accountMenuOpen: boolean;
  onOpenAccountMenu: (event: MouseEvent<HTMLElement>) => void;
  onCloseAccountMenu: () => void;
  onOpenSettingsDialog: () => void;
  onOpenReleaseDialog: () => void;
  onRequestLogout: () => void;
}

interface UseHeaderArgs {
  setAccountMenuAnchor: (value: HTMLElement | null) => void;
  setLogoutDialogOpen: (value: boolean) => void;
  setReleaseDialogOpen: (value: boolean) => void;
  setSettingsDialogOpen: (value: boolean) => void;
  setUserProfile: (value: UserProfile | null) => void;
}

export function useHeader({
  setAccountMenuAnchor,
  setLogoutDialogOpen,
  setReleaseDialogOpen,
  setSettingsDialogOpen,
  setUserProfile,
}: UseHeaderArgs) {
  const closeAccountMenu = useCallback((): void => {
    setAccountMenuAnchor(null);
  }, [setAccountMenuAnchor]);

  const openAccountMenu = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      setAccountMenuAnchor(event.currentTarget);

      void (async () => {
        try {
          const profile = await getUserProfile();
          if (profile) {
            setUserProfile(profile);
          }
        } catch {
          // ignore
        }
      })();
    },
    [setAccountMenuAnchor, setUserProfile],
  );

  const requestLogout = useCallback((): void => {
    closeAccountMenu();
    setLogoutDialogOpen(true);
  }, [closeAccountMenu, setLogoutDialogOpen]);

  const openSettingsDialog = useCallback((): void => {
    closeAccountMenu();
    setSettingsDialogOpen(true);
  }, [closeAccountMenu, setSettingsDialogOpen]);

  const openReleaseDialog = useCallback((): void => {
    closeAccountMenu();
    setReleaseDialogOpen(true);
  }, [closeAccountMenu, setReleaseDialogOpen]);

  return {
    openAccountMenu,
    closeAccountMenu,
    requestLogout,
    openSettingsDialog,
    openReleaseDialog,
  };
}
