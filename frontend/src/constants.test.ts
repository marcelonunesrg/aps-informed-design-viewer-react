import { describe, expect, it } from "vitest";
import {
  accessIdQueryParam,
  accessTypeQueryParam,
  PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY,
  releaseIdQueryParam,
} from "./constants";

describe("constants", () => {
  it("exposes expected query/storage keys", () => {
    expect(releaseIdQueryParam).toBe("releaseId");
    expect(accessIdQueryParam).toBe("accessId");
    expect(accessTypeQueryParam).toBe("accessType");
    expect(PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY).toBe("productReleaseData");
  });
});
