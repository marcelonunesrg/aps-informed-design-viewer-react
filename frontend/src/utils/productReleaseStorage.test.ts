import { describe, expect, it } from "vitest";
import {
  buildUrlWithProductReleaseData,
  getProductReleaseDataFromLocalStorage,
  hasCompleteProductReleaseData,
  parseProductReleaseFromUrl,
  saveProductReleaseDataToLocalStorage,
  validateProductReleaseData,
} from "./productReleaseStorage";

describe("productReleaseStorage", () => {
  it("parses data from URL", () => {
    const location = {
      search:
        "?releaseId=123e4567-e89b-12d3-a456-426614174000&accessId=hub-1&accessType=acc",
    } as Location;

    expect(parseProductReleaseFromUrl(location)).toEqual({
      releaseId: "123e4567-e89b-12d3-a456-426614174000",
      accessId: "hub-1",
      accessType: "acc",
    });
  });

  it("builds URL from data", () => {
    const url = buildUrlWithProductReleaseData({
      releaseId: "123e4567-e89b-12d3-a456-426614174000",
      accessId: "hub-1",
      accessType: "acc",
    });

    expect(url).toContain("releaseId=123e4567-e89b-12d3-a456-426614174000");
    expect(url).toContain("accessId=hub-1");
    expect(url).toContain("accessType=acc");
  });

  it("validates and checks completeness", () => {
    const data = {
      releaseId: "123e4567-e89b-12d3-a456-426614174000",
      accessId: "hub-1",
      accessType: "acc",
    };

    expect(() => validateProductReleaseData(data)).not.toThrow();
    expect(hasCompleteProductReleaseData(data)).toBe(true);
    expect(hasCompleteProductReleaseData({ ...data, accessType: "" })).toBe(false);
  });

  it("saves and restores from localStorage", () => {
    const data = {
      releaseId: "123e4567-e89b-12d3-a456-426614174000",
      accessId: "hub-1",
      accessType: "acc",
    };

    saveProductReleaseDataToLocalStorage(data);
    expect(getProductReleaseDataFromLocalStorage()).toEqual(data);

    localStorage.setItem("productReleaseData", "not-json");
    expect(getProductReleaseDataFromLocalStorage()).toBeNull();
  });
});
