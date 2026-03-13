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
            main: "#0696D7",
            dark: "#006C9B",
            light: "#2BB9F2",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#4D4D4D",
            dark: "#2B2B2B",
            light: "#7A7A7A",
            contrastText: "#ffffff",
          },
          background:
            themeMode === "dark"
              ? {
                  default: "#1E1E1E",
                  paper: "#252525",
                }
              : {
                  default: "#F5F7FA",
                  paper: "#FFFFFF",
                },
          text:
            themeMode === "dark"
              ? {
                  primary: "#F3F3F3",
                  secondary: "#C7C7C7",
                }
              : {
                  primary: "#1F1F1F",
                  secondary: "#5F5F5F",
                },
          divider: themeMode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
          action: {
            hover: themeMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(6,150,215,0.06)",
            selected: themeMode === "dark" ? "rgba(6,150,215,0.24)" : "rgba(6,150,215,0.14)",
          },
        },
        shape: {
          borderRadius: 6,
        },
        typography: {
          fontFamily: "ArtifaktElement, Inter, system-ui, -apple-system, Segoe UI, sans-serif",
          button: {
            textTransform: "none",
            fontWeight: 600,
            letterSpacing: 0,
          },
          subtitle2: {
            fontWeight: 600,
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: themeMode === "dark" ? "#1E1E1E" : "#F5F7FA",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
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
                borderRadius: 6,
                textTransform: "none",
                fontWeight: 600,
                ...(theme.palette.mode === "dark" && ownerState.variant === "text"
                  ? {
                      color: theme.palette.text.primary,
                    }
                  : {}),
                ...(ownerState.variant === "contained"
                  ? {
                      boxShadow: "none",
                      "&:hover": {
                        boxShadow: "none",
                      },
                    }
                  : {}),
              }),
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: 6,
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 1,
                  borderColor: theme.palette.primary.main,
                },
              }),
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 8,
              },
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
