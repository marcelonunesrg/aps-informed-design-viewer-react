import { useEffect } from "react";
import { create } from "zustand";
import { getUserProfile } from "../services/authService";
import type { UserProfile } from "../types";

interface AuthSessionState {
  userProfile: UserProfile | null;
  setUserProfile: (next: UserProfile | null) => void;
}

const useAuthSessionStore = create<AuthSessionState>((set) => ({
  userProfile: null,
  setUserProfile: (next) => set({ userProfile: next }),
}));

export function resetAuthSessionState(): void {
  useAuthSessionStore.setState({ userProfile: null });
}

export function useAuthSession() {
  const userProfile = useAuthSessionStore((state) => state.userProfile);
  const setUserProfile = useAuthSessionStore((state) => state.setUserProfile);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await getUserProfile();
        if (active && profile) {
          setUserProfile(profile);
        }
      } catch {
        if (active) {
          setUserProfile(null);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [setUserProfile]);

  return {
    userProfile,
    setUserProfile,
  };
}
