import { getViewerAccessToken } from "./authService";
import type { ProductReleaseData } from "../types";

export interface TerminalCommandContext {
  accessType: string;
  accessId: string;
  currentReleaseId: string;
  currentProductId?: string;
}

export interface TerminalReleaseListItem {
  id: string;
  name: string;
  releaseNumber?: string;
  state?: string;
  updatedAt?: string;
}

export interface TerminalExecuteResult {
  status: "ok" | "error" | "confirmation_required";
  output: string;
  code?: string;
  confirmationToken?: string;
  data?: {
    clear?: boolean;
    summary?: string;
    productId?: string;
    releases?: TerminalReleaseListItem[];
    releaseSelection?: ProductReleaseData;
  };
}

export interface TerminalExecuteRequest {
  command: string;
  context: TerminalCommandContext;
  confirmationToken?: string;
}

export async function executeTerminalCommand(
  request: TerminalExecuteRequest,
): Promise<TerminalExecuteResult> {
  const token = await getViewerAccessToken();

  const response = await fetch("/api/terminal/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.access_token}`,
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as TerminalExecuteResult;

  if (!response.ok) {
    return {
      status: "error",
      output: payload.output || "Command failed.",
      code: payload.code || "request_failed",
    };
  }

  return payload;
}
