import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getUserProfile, login } from "../../services/authService";

export type AuthGatekeeperStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthGatekeeperProps {
  onBeforeLoginRedirect?: () => void;
  children: ReactNode;
}

export function useAuthGatekeeper(onBeforeLoginRedirect?: () => void) {
  const [status, setStatus] = useState<AuthGatekeeperStatus>("loading");
  const redirectedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        const profile = await getUserProfile();

        if (!active) {
          return;
        }

        if (profile) {
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      } catch {
        if (active) {
          setStatus("unauthenticated");
        }
      }
    }

    void verifySession();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = useCallback(() => {
    onBeforeLoginRedirect?.();
    login();
  }, [onBeforeLoginRedirect]);

  useEffect(() => {
    if (status !== "unauthenticated" || redirectedRef.current) {
      return;
    }

    redirectedRef.current = true;
    handleLogin();
  }, [status, handleLogin]);

  return {
    status,
    handleLogin,
  };
}
