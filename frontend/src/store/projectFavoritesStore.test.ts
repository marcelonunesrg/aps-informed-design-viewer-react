import { beforeEach, describe, expect, it } from "vitest";
import {
  getFavoriteProjectIds,
  isFavoriteProject,
  resetFavoriteProjects,
  setFavoriteProject,
  toggleFavoriteProject,
} from "./projectFavoritesStore";

describe("projectFavoritesStore", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFavoriteProjects();
  });

  it("toggles favorite project ids", () => {
    toggleFavoriteProject("b.project-1");
    expect(isFavoriteProject("b.project-1")).toBe(true);

    toggleFavoriteProject("b.project-1");
    expect(isFavoriteProject("b.project-1")).toBe(false);
  });

  it("sets favorite state explicitly", () => {
    setFavoriteProject("b.project-1", true);
    setFavoriteProject("b.project-2", true);
    setFavoriteProject("b.project-1", false);

    expect(getFavoriteProjectIds()).toEqual(["b.project-2"]);
  });

  it("loads and sanitizes invalid localStorage values", () => {
    localStorage.setItem("projectPickerFavorites", JSON.stringify(["", "b.project-2", 42, "b.project-2"]));

    expect(getFavoriteProjectIds()).toEqual(["b.project-2"]);
  });
});
