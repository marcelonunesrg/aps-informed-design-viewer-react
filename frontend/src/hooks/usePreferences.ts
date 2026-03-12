import { useEffect, useMemo, useState } from "react";
import { createTheme } from "@mui/material/styles";
import type { ThemeMode, Language } from "../types";
import {
  getLanguage,
  getThemeMode,
  setLanguage as persistLanguage,
  setThemeMode as persistThemeMode,
} from "../store/settingsStore";

export function usePreferences(changeLanguage: (lang: string) => Promise<unknown>) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getThemeMode());
  const [language, setLanguage] = useState<Language>(() => getLanguage());

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: "#000000",
            dark: "#000000",
            light: "#000000",
            contrastText: "#ffffff",
          },
        },
        components: {
          MuiToolbar: {
            defaultProps: {
              variant: "dense",
            },
          },
          MuiButton: {
            defaultProps: {
              size: "small",
            },
            styleOverrides: {
              root: ({ ownerState, theme }) => ({
                textTransform: "capitalize",
                ...(theme.palette.mode === "dark" && ownerState.variant === "text"
                  ? {
                      color: theme.palette.text.primary,
                    }
                  : {}),
              }),
            },
          },
          MuiMenuItem: {
            defaultProps: {
              dense: true,
            },
          },
        },
      }),
    [themeMode],
  );

  useEffect(() => {
    persistThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    const updateViewportSize = () => {
      const viewportWidthPx = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeightPx = window.visualViewport?.height ?? window.innerHeight;
      const viewportWidth = viewportWidthPx * 0.01;
      const viewportHeight = viewportHeightPx * 0.01;
      const root = document.getElementById("root");

      document.documentElement.style.setProperty("--app-vw", `${viewportWidth}px`);
      document.documentElement.style.setProperty("--app-vh", `${viewportHeight}px`);

      if (root) {
        root.style.removeProperty("width");
        root.style.removeProperty("height");
        root.style.removeProperty("min-width");
        root.style.removeProperty("min-height");
      }
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    window.addEventListener("orientationchange", updateViewportSize);
    window.visualViewport?.addEventListener("resize", updateViewportSize);

    return () => {
      window.removeEventListener("resize", updateViewportSize);
      window.removeEventListener("orientationchange", updateViewportSize);
      window.visualViewport?.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  useEffect(() => {
    persistLanguage(language);
    void changeLanguage(language);
  }, [language, changeLanguage]);

  return {
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    theme,
  };
}
