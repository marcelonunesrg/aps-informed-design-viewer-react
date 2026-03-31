import { FormEvent, useMemo, useState } from "react";
import TerminalOutlined from "@mui/icons-material/TerminalOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Close from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import type { ProductReleaseData } from "../../types";
import {
  executeTerminalCommand,
  type TerminalCommandContext,
  type TerminalExecuteResult,
  type TerminalReleaseListItem,
} from "../../services/terminalService";

interface TerminalDrawerProps {
  open: boolean;
  onClose: () => void;
  activeReleaseData: ProductReleaseData | null;
  onApplyReleaseSelection: (next: ProductReleaseData) => void;
}

type TerminalMessageType = "user" | "system";

interface TerminalMessage {
  id: string;
  type: TerminalMessageType;
  text: string;
}

function formatReleaseList(releases: TerminalReleaseListItem[]): string {
  if (!releases.length) {
    return "No releases found.";
  }

  const header = "ID | Name | Release # | State | Updated";
  const separator = "---|---|---|---|---";
  const lines = releases.map((release) => {
    const columns = [
      release.id,
      release.name || "-",
      release.releaseNumber || "-",
      release.state || "-",
      release.updatedAt || "-",
    ];

    return columns.join(" | ");
  });

  return [header, separator, ...lines].join("\n");
}

function createMessage(type: TerminalMessageType, text: string): TerminalMessage {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    text,
  };
}

export function TerminalDrawer({
  open,
  onClose,
  activeReleaseData,
  onApplyReleaseSelection,
}: TerminalDrawerProps) {
  const { t } = useTranslation();
  const [commandInput, setCommandInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<TerminalMessage[]>([
    createMessage("system", "Type 'help' to see available commands."),
  ]);
  const [confirmationToken, setConfirmationToken] = useState<string | undefined>(undefined);
  const [currentProductId, setCurrentProductId] = useState<string | undefined>(undefined);

  const hasActiveReleaseContext = Boolean(
    activeReleaseData?.releaseId && activeReleaseData?.accessId && activeReleaseData?.accessType,
  );

  const terminalContext = useMemo<TerminalCommandContext | null>(() => {
    if (!activeReleaseData) {
      return null;
    }

    if (!activeReleaseData.releaseId || !activeReleaseData.accessId || !activeReleaseData.accessType) {
      return null;
    }

    return {
      currentReleaseId: activeReleaseData.releaseId,
      accessId: activeReleaseData.accessId,
      accessType: activeReleaseData.accessType,
      currentProductId,
    };
  }, [activeReleaseData, currentProductId]);

  async function runCommand(rawCommand: string): Promise<void> {
    const command = rawCommand.trim();
    if (!command) {
      return;
    }

    setMessages((previous) => [...previous, createMessage("user", command)]);

    if (command.toLowerCase() === "clear") {
      setMessages([createMessage("system", "Terminal output cleared.")]);
      setCommandInput("");
      setConfirmationToken(undefined);
      return;
    }

    if (!terminalContext && !["help"].includes(command.toLowerCase())) {
      setMessages((previous) => [
        ...previous,
        createMessage("system", "Open a release first so terminal commands have context."),
      ]);
      setCommandInput("");
      return;
    }

    setIsRunning(true);
    setCommandInput("");

    try {
      const response = await executeTerminalCommand({
        command,
        context:
          terminalContext || {
            accessId: "",
            accessType: "",
            currentReleaseId: "",
          },
        confirmationToken,
      });

      applyTerminalResponse(command, response);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        createMessage(
          "system",
          error instanceof Error ? error.message : "Command failed.",
        ),
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  function applyTerminalResponse(command: string, response: TerminalExecuteResult): void {
    const nextMessages: TerminalMessage[] = [createMessage("system", response.output)];

    if (response.data?.releases) {
      nextMessages.push(createMessage("system", formatReleaseList(response.data.releases)));
    }

    if (response.data?.releaseSelection) {
      onApplyReleaseSelection(response.data.releaseSelection);
    }

    if (response.data?.productId) {
      setCurrentProductId(response.data.productId);
    }

    if (response.status === "confirmation_required") {
      setConfirmationToken(response.confirmationToken);
    } else if (command.toLowerCase() === "confirm" || command.toLowerCase() === "cancel") {
      setConfirmationToken(undefined);
    }

    setMessages((previous) => [...previous, ...nextMessages]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void runCommand(commandInput);
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 520 },
          maxWidth: "100%",
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TerminalOutlined fontSize="small" />
            <Typography variant="h6">Terminal</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label={t("close")}>
            <Close />
          </IconButton>
        </Box>

        <Divider />

        <Box sx={{ px: 2, py: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            size="small"
            label={
              hasActiveReleaseContext
                ? `Release: ${activeReleaseData?.releaseId}`
                : "No release selected"
            }
            color={hasActiveReleaseContext ? "primary" : "default"}
          />
          {currentProductId ? (
            <Chip size="small" label={`Product: ${currentProductId}`} variant="outlined" />
          ) : null}
        </Box>

        {confirmationToken ? (
          <Box sx={{ px: 2, pb: 1 }}>
            <Alert severity="warning">
              A mutating command is pending confirmation. Run confirm to continue or cancel to abort.
            </Alert>
          </Box>
        ) : null}

        <Box sx={{ px: 2, pb: 2, flex: 1, minHeight: 0 }}>
          <Paper
            variant="outlined"
            sx={{
              height: "100%",
              overflow: "auto",
              p: 1.5,
              bgcolor: "#111",
              color: "#e4e4e4",
            }}
          >
            <Stack spacing={1}>
              {messages.map((message) => (
                <Typography
                  key={message.id}
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    m: 0,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: "0.8rem",
                    color: message.type === "user" ? "#9be7ff" : "#e4e4e4",
                  }}
                >
                  {message.type === "user" ? `> ${message.text}` : message.text}
                </Typography>
              ))}
            </Stack>
          </Paper>
        </Box>

        <Divider />

        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <TextField
              value={commandInput}
              onChange={(event) => setCommandInput(event.target.value)}
              disabled={isRunning}
              autoComplete="off"
              placeholder="release list"
              fullWidth
              size="small"
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" disabled={isRunning || !commandInput.trim()}>
                Run
              </Button>
              <Button
                variant="text"
                disabled={isRunning}
                onClick={() => {
                  void runCommand("help");
                }}
              >
                Help
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  );
}
