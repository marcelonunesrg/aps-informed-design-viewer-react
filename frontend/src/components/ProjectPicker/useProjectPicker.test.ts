import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/bim360Service", () => ({
  getBim360Clients: vi.fn(),
}));

import { getBim360Clients } from "../../services/bim360Service";
import { resetFavoriteProjects } from "../../store/projectFavoritesStore";
import { regionToFlag, renderHighlightedMatch, useProjectPicker } from "./useProjectPicker";

describe("useProjectPicker", () => {
  beforeEach(() => {
    resetFavoriteProjects();
  });

  it("loads hub/projects incrementally, filters by query, and selects an item", async () => {
    const clients = [
      {
        id: "b.project-1",
        accountId: "b.hub-1",
        accountName: "Alpha Account",
        name: "Alpha Project",
        imageUrl: "https://example.com/a.png",
      },
      {
        id: "b.project-2",
        accountId: "b.hub-2",
        accountName: "Beta Account",
        name: "Beta Project",
        imageUrl: "https://example.com/b.png",
      },
    ];
    vi.mocked(getBim360Clients).mockImplementationOnce(async (_limit, onPage) => {
      onPage?.([clients[0]], [clients[0]]);
      await Promise.resolve();
      onPage?.([clients[1]], clients);
      return clients;
    });

    const { result } = renderHook(() => useProjectPicker("ACC"));
    const anchor = document.createElement("button");
    const clickEvent = { currentTarget: anchor };

    act(() => {
      // @ts-expect-error test event shim
      result.current.onHubProjectClick(clickEvent);
    });

    await waitFor(() => expect(getBim360Clients).toHaveBeenCalled());
    await waitFor(() => expect(result.current.filteredHubProjectItems).toHaveLength(2));
    expect(result.current.filteredHubProjectItems.map((item) => item.id)).toEqual([
      "b.project-1",
      "b.project-2",
    ]);

    act(() => {
      result.current.toggleFavoriteProject("b.project-2");
    });

    expect(result.current.filteredHubProjectItems.map((item) => item.id)).toEqual([
      "b.project-2",
      "b.project-1",
    ]);

    act(() => {
      result.current.setHubProjectSearch("beta");
    });

    expect(result.current.filteredHubProjectItems).toHaveLength(1);
    expect(result.current.filteredHubProjectItems[0].name).toBe("Beta Project");

    act(() => {
      result.current.selectHubProject(clients[1]);
    });

    expect(result.current.hubProjectValue).toBe("Beta Project");
    expect(result.current.selectedHubProject?.id).toBe("b.project-2");
    expect(result.current.isHubProjectMenuOpen).toBe(false);
  });

  it("does not load projects when access type is not ACC", async () => {
    const { result } = renderHook(() => useProjectPicker("PUBLIC"));
    const anchor = document.createElement("button");
    const clickEvent = { currentTarget: anchor };

    act(() => {
      // @ts-expect-error test event shim
      result.current.onHubProjectClick(clickEvent);
    });

    await waitFor(() => {
      expect(getBim360Clients).not.toHaveBeenCalled();
    });
  });

  it("renders highlight matches and maps region to flag", () => {
    const node = renderHighlightedMatch("North America", "america");
    expect(Array.isArray(node)).toBe(true);
    expect(regionToFlag("us")).toBe("🇺🇸");
    expect(regionToFlag("apac")).toBe("🌏");
  });
});
