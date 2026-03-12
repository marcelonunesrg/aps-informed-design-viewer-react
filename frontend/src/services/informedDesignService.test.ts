import { describe, expect, it, vi } from "vitest";
import { getReleaseById, listProductReleases, listProducts } from "./informedDesignService";

describe("informedDesignService", () => {
  it("fetches a release and decodes accessId", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "r1", accessId: "h1", accessType: "acc", productId: "p1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const release = await getReleaseById({
      releaseId: "r1",
      accessId: "hub%252Fid",
      accessType: "acc",
      accessToken: "token",
    });

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get("accessId")).toBe("hub/id");
    expect(release.productId).toBe("p1");
  });

  it("throws when release request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, statusText: "Unauthorized" }),
    );

    await expect(
      getReleaseById({
        releaseId: "r1",
        accessId: "hub/id",
        accessType: "acc",
        accessToken: "token",
      }),
    ).rejects.toThrow("Failed to fetch release: Unauthorized");
  });

  it("lists products and decodes accessId", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "p1",
            attributes: {
              displayName: "Alpha Product",
              authoringApp: "INVENTOR",
              defaultRelease: { id: "r1" },
            },
          },
          { id: "p2", name: "Beta Product" },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const products = await listProducts({
      accessType: "ACC",
      accessId: "proj%257Cid",
      accessToken: "token",
    });

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get("accessType")).toBe("ACC");
    expect(calledUrl.searchParams.get("accessId")).toBe("proj|id");
    expect(products).toEqual([
      { id: "p1", name: "Alpha Product", authoringApp: "INVENTOR", defaultRelease: "r1" },
      { id: "p2", name: "Beta Product", authoringApp: undefined, defaultRelease: undefined },
    ]);
  });

  it("throws when products request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, statusText: "Forbidden" }),
    );

    await expect(
      listProducts({
        accessType: "ACC",
        accessId: "proj|folder",
        accessToken: "token",
      }),
    ).rejects.toThrow("Failed to fetch products: Forbidden");
  });

  it("lists releases for a product", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { id: "r1", attributes: { displayName: "Release A", releaseNumber: 7, state: "active" } },
          { id: "r2", name: "Release B", number: "8", status: "obsolete" },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const releases = await listProductReleases({
      accessType: "ACC",
      accessId: "proj%257Cfolder",
      productId: "prod-1",
      accessToken: "token",
    });

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get("accessType")).toBe("ACC");
    expect(calledUrl.searchParams.get("accessId")).toBe("proj|folder");
    expect(calledUrl.searchParams.get("productId")).toBe("prod-1");
    expect(releases).toEqual([
      { id: "r1", name: "Release A", releaseNumber: "7", state: "ACTIVE" },
      { id: "r2", name: "Release B", releaseNumber: "8", state: "OBSOLETE" },
    ]);
  });

  it("throws when releases request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, statusText: "Bad Request" }),
    );

    await expect(
      listProductReleases({
        accessType: "ACC",
        accessId: "proj|folder",
        productId: "prod-1",
        accessToken: "token",
      }),
    ).rejects.toThrow("Failed to fetch releases: Bad Request");
  });
});
