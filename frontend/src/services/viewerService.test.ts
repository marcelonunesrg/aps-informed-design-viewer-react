import { describe, expect, it, vi } from "vitest";
import {
  APS_VIEWER_SCRIPT_URL,
  APS_VIEWER_STYLE_URL,
  IND_EXTENSION_SCRIPT_URL,
} from "../constants";
import {
  applyViewerTheme,
  ensureViewerAssets,
  getInformedDesignExtension,
  initViewer,
  loadReleaseModel,
} from "./viewerService";

vi.mock("./authService", () => ({
  getViewerAccessToken: vi.fn(async () => ({ access_token: "token", expires_in: 3600 })),
}));

function seedViewerAssets() {
  const scriptA = document.createElement("script");
  scriptA.src = APS_VIEWER_SCRIPT_URL;
  document.body.appendChild(scriptA);

  const scriptB = document.createElement("script");
  scriptB.src = IND_EXTENSION_SCRIPT_URL;
  document.body.appendChild(scriptB);

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = APS_VIEWER_STYLE_URL;
  document.head.appendChild(style);
}

describe("viewerService", () => {
  it("injects viewer assets once", async () => {
    const bodyAppendSpy = vi.spyOn(document.body, "appendChild");
    const headAppendSpy = vi.spyOn(document.head, "appendChild");
    bodyAppendSpy.mockImplementation((node: Node) => {
      const element = node as HTMLScriptElement;
      if (element.tagName === "SCRIPT" && typeof element.onload === "function") {
        queueMicrotask(() => element.onload?.(new Event("load")));
      }
      return node;
    });

    await ensureViewerAssets();
    await ensureViewerAssets();

    const scriptAppends = bodyAppendSpy.mock.calls.filter(
      ([node]) => (node as HTMLElement).tagName === "SCRIPT",
    );
    const styleAppends = headAppendSpy.mock.calls.filter(
      ([node]) => (node as HTMLElement).tagName === "LINK",
    );

    expect(scriptAppends.length).toBe(2);
    expect(styleAppends.length).toBe(1);
  });

  it("handles pre-existing viewer assets without injecting duplicates", async () => {
    document.body.innerHTML = "";
    document.head.innerHTML = "";

    const scriptA = document.createElement("script");
    scriptA.src = APS_VIEWER_SCRIPT_URL;
    document.body.appendChild(scriptA);
    const scriptB = document.createElement("script");
    scriptB.src = IND_EXTENSION_SCRIPT_URL;
    document.body.appendChild(scriptB);
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = APS_VIEWER_STYLE_URL;
    document.head.appendChild(style);

    vi.resetModules();
    const viewerServiceModule = await import("./viewerService");

    await expect(viewerServiceModule.ensureViewerAssets()).resolves.toBeUndefined();
  });

  it("applies theme and calls extension", async () => {
    const extension = { setTheme: vi.fn() };
    const viewer = {
      setTheme: vi.fn(),
      setBackgroundColor: vi.fn(),
      impl: { invalidate: vi.fn() },
      getExtensionAsync: vi.fn(async () => extension),
    } as any;

    await applyViewerTheme(viewer, "dark");
    expect(viewer.setTheme).toHaveBeenCalledWith("dark-theme");
    expect(extension.setTheme).toHaveBeenCalledWith("dark-theme");

    await applyViewerTheme(viewer, "light");
    expect(viewer.setTheme).toHaveBeenCalledWith("light-theme");
  });

  it("returns extension and loads release model", async () => {
    const extension = {
      setProductReleaseDataToFetch: vi.fn(),
      fetchProductRelease: vi.fn(),
      loadProductReleaseDefaultVariantSVF: vi.fn(),
    };
    const viewer = { getExtensionAsync: vi.fn(async () => extension) } as any;

    await expect(getInformedDesignExtension(viewer)).resolves.toBe(extension);
    await loadReleaseModel(extension as any, {
      releaseId: "r1",
      accessId: "a1",
      accessType: "acc",
      productId: "p1",
    });

    expect(extension.fetchProductRelease).toHaveBeenCalled();
  });

  it("initializes viewer via Autodesk API", async () => {
    seedViewerAssets();
    const start = vi.fn(() => 0);
    const viewer = { start, setTheme: vi.fn() };

    let capturedInitializerOptions: any;
    (window as any).Autodesk = {
      Viewing: {
        Initializer: (options: unknown, callback: () => void) => {
          capturedInitializerOptions = options;
          callback();
        },
        GuiViewer3D: vi.fn(() => viewer),
      },
    };

    const container = document.createElement("div") as HTMLDivElement;
    const initialized = await initViewer(container);
    expect(initialized).toBe(viewer);

    const tokenHandler = capturedInitializerOptions.getAccessToken as (
      callback: (token: string, expiresIn: number) => void,
    ) => Promise<void>;
    const callback = vi.fn();
    await tokenHandler(callback);
    expect(callback).toHaveBeenCalledWith("token", 3600);
  });

  it("rejects initialization when viewer start fails", async () => {
    seedViewerAssets();
    const viewer = { start: vi.fn(() => 1), setTheme: vi.fn() };

    (window as any).Autodesk = {
      Viewing: {
        Initializer: (_: unknown, callback: () => void) => callback(),
        GuiViewer3D: vi.fn(() => viewer),
      },
    };

    const container = document.createElement("div") as HTMLDivElement;
    await expect(initViewer(container)).rejects.toThrow("Failed to create a Viewer");
  });

});
