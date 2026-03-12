import { describe, expect, it, vi } from "vitest";

vi.mock("./authService", () => ({
  getViewerAccessToken: vi.fn(async () => ({ access_token: "token" })),
}));

import { getBim360Clients } from "./bim360Service";

describe("bim360Service", () => {
  it("fetches and maps paginated clients", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              accountId: "3d6b7b19-c2b6-452e-9b6e-dd332ed32352",
              defaultUrl:
                "https://acc.autodesk.com/projects/b.fd4442d3-ca7f-4ee4-ac94-2242bee74f1c/files",
              name: "A",
              accountName: "Account A",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    vi.stubGlobal("fetch", fetchMock);

    const clients = await getBim360Clients(1);
    expect(clients).toEqual([
      {
        id: "b.fd4442d3-ca7f-4ee4-ac94-2242bee74f1c",
        projectId: "b.fd4442d3-ca7f-4ee4-ac94-2242bee74f1c",
        name: "A",
        accountName: "Account A",
        imageUrl: undefined,
        platform: undefined,
        region: undefined,
        accountId: "3d6b7b19-c2b6-452e-9b6e-dd332ed32352",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses payload id as projectId when defaultUrl is absent", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "b.fd4442d3-ca7f-4ee4-ac94-2242bee74f1c",
              accountId: "3d6b7b19-c2b6-452e-9b6e-dd332ed32352",
              name: "Project B",
              accountName: "Account A",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    vi.stubGlobal("fetch", fetchMock);

    const clients = await getBim360Clients(1);
    expect(clients[0]).toMatchObject({
      id: "b.fd4442d3-ca7f-4ee4-ac94-2242bee74f1c",
      projectId: "b.fd4442d3-ca7f-4ee4-ac94-2242bee74f1c",
      accountId: "3d6b7b19-c2b6-452e-9b6e-dd332ed32352",
    });
  });

  it("falls back to accountId when project identifier is urn", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "urn:adsk.wipprod:fs.folder:co.XYZ",
              accountId: "account-1",
              name: "Project C",
              accountName: "Account C",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    vi.stubGlobal("fetch", fetchMock);

    const clients = await getBim360Clients(1);
    expect(clients[0]).toMatchObject({
      id: "account-1",
      projectId: undefined,
      accountId: "account-1",
    });
  });

  it("throws when clients request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Server Error" }),
    );

    await expect(getBim360Clients(1)).rejects.toThrow("Could not fetch clients");
  });
});
