import { useCallback } from "react";
import type { ChangeEvent } from "react";
import type { Language, ThemeMode } from "../../types";

export interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  onThemeModeChange: (value: ThemeMode) => void;
  language: Language;
  onLanguageChange: (value: Language) => void;
}

export function useSettingsDialog({
  onThemeModeChange,
  onLanguageChange,
}: Pick<SettingsDialogProps, "onThemeModeChange" | "onLanguageChange">) {
  const handleThemeModeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onThemeModeChange(event.target.value as ThemeMode);
    },
    [onThemeModeChange],
  );

  const handleLanguageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onLanguageChange(event.target.value as Language);
    },
    [onLanguageChange],
  );

  return {
    handleThemeModeChange,
    handleLanguageChange,
  };
}
