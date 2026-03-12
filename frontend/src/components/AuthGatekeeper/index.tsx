import { useAuthGatekeeper } from "./useAuthGatekeeper";
import type { AuthGatekeeperProps } from "./useAuthGatekeeper";

export function AuthGatekeeper({ onBeforeLoginRedirect, children }: AuthGatekeeperProps) {
  const { status } = useAuthGatekeeper(onBeforeLoginRedirect);

  if (status !== "authenticated") {
    return null;
  }

  return children;
}
