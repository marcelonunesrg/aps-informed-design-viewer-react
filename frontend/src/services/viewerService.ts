import {
  APS_VIEWER_SCRIPT_URL,
  APS_VIEWER_STYLE_URL,
  IND_EXTENSION_ID,
  IND_EXTENSION_SCRIPT_URL,
} from "../constants";
import { getViewerAccessToken } from "./authService";
import type { ThemeMode } from "../types";

export interface AutodeskViewer {
  start: () => number;
  finish: () => void;
  resize: () => void;
  setTheme: (theme: string) => void;
  setBackgroundColor: (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number,
  ) => void;
  getExtensionAsync: (extensionId: string) => Promise<InformedDesignExtension>;
  impl: {
    invalidate: (force?: boolean, materials?: boolean, lights?: boolean) => void;
  };
}

export interface InformedDesignExtension {
  setTheme: (theme: string) => void;
  setProductReleaseDataToFetch: (data: {
    releaseId: string;
    accessId: string;
    accessType: string;
    productId: string;
  }) => void;
  fetchProductRelease: () => void;
  loadProductReleaseDefaultVariantSVF: () => void;
}

interface LoadReleaseModelParams {
  releaseId: string;
  accessId: string;
  accessType: string;
  productId: string;
}

let scriptsReadyPromise: Promise<void> | undefined;

function toAutodeskTheme(themeMode: ThemeMode): string {
  return themeMode === "dark" ? "dark-theme" : "light-theme";
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load script: ${src}`));
    document.body.appendChild(script);
  });
}

function injectStyle(href: string): void {
  const existing = document.querySelector(`link[href="${href}"]`);
  if (existing) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export async function ensureViewerAssets(): Promise<void> {
  if (!scriptsReadyPromise) {
    injectStyle(APS_VIEWER_STYLE_URL);

    scriptsReadyPromise = (async () => {
      await injectScript(APS_VIEWER_SCRIPT_URL);
      await injectScript(IND_EXTENSION_SCRIPT_URL);
    })();
  }

  return scriptsReadyPromise;
}

function tokenCallback(): (callback: (accessToken: string, expiresIn: number) => void) => Promise<void> {
  return async (callback) => {
    const token = await getViewerAccessToken();
    callback(token.access_token, token.expires_in);
  };
}

export async function initViewer(containerElement: HTMLDivElement): Promise<AutodeskViewer> {
  await ensureViewerAssets();

  return new Promise((resolve, reject) => {
    window.Autodesk.Viewing.Initializer(
      {
        env: "AutodeskProduction",
        getAccessToken: tokenCallback(),
      },
      () => {
        const viewer = new window.Autodesk.Viewing.GuiViewer3D(containerElement, {
          extensions: [IND_EXTENSION_ID],
        }) as AutodeskViewer;

        const startedCode = viewer.start();
        if (startedCode > 0) {
          reject(
            new Error("Failed to create a Viewer: WebGL not supported or init error."),
          );
          return;
        }

        viewer.setTheme("light-theme");
        resolve(viewer);
      },
    );
  });
}

export async function applyViewerTheme(viewer: AutodeskViewer, themeMode: ThemeMode): Promise<void> {
  const autodeskTheme = toAutodeskTheme(themeMode);
  viewer.setTheme(autodeskTheme);

  if (themeMode === "dark") {
    viewer.setBackgroundColor(36, 36, 36, 36, 36, 36);
  } else {
    viewer.setBackgroundColor(242, 242, 242, 255, 255, 255);
  }

  viewer.impl.invalidate(true, true, true);

  const extension = await viewer.getExtensionAsync(IND_EXTENSION_ID);
  extension.setTheme(autodeskTheme);
}

export async function getInformedDesignExtension(
  viewer: AutodeskViewer,
): Promise<InformedDesignExtension> {
  const extension = await viewer.getExtensionAsync(IND_EXTENSION_ID);
  return extension;
}

export async function loadReleaseModel(
  extension: InformedDesignExtension,
  {
  releaseId,
  accessId,
  accessType,
  productId,
}: LoadReleaseModelParams): Promise<void> {
  extension.setProductReleaseDataToFetch({
    releaseId,
    accessId,
    accessType,
    productId,
  });
  extension.fetchProductRelease();
  extension.loadProductReleaseDefaultVariantSVF();
}
