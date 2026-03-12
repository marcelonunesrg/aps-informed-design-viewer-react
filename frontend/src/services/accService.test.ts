import { describe, expect, it, vi } from "vitest";

vi.mock("./authService", () => ({
  getViewerAccessToken: vi.fn(async () => ({ access_token: "token" })),
}));

import { getFolderContents, getTopFolders } from "./accService";

describe("accService", () => {
  it("maps top folders response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: "f1", attributes: { displayName: "Main" }, type: "folders" }] }),
      }),
    );

    await expect(getTopFolders("hub", "project")).resolves.toEqual([
      { id: "f1", name: "Main", type: "folders", hasChildren: undefined },
    ]);
  });

  it("maps folder contents response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: "f2", attributes: { name: "Sub", childCount: 1 }, type: "folders" }] }),
      }),
    );

    await expect(getFolderContents("project", "urn:abc")).resolves.toEqual([
      { id: "f2", name: "Sub", type: "folders", hasChildren: true },
    ]);
  });

  it("throws response text when top folders request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: async () => "BIM360DM_ERROR",
      }),
    );

    await expect(getTopFolders("hub", "project")).rejects.toThrow("BIM360DM_ERROR");
  });
});
