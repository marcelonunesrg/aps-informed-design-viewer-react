import { describe, expect, it } from "vitest";
import { ensureStringQueryParam, ensureValidUuidQueryParam } from "./validation";

describe("validation", () => {
  it("ensures string params", () => {
    expect(ensureStringQueryParam("accessId", "  abc  ")).toBe("abc");
    expect(() => ensureStringQueryParam("accessId", "   ")).toThrow();
    expect(() => ensureStringQueryParam("accessId", null)).toThrow(
      "accessId query parameter must be a string.",
    );
    expect(() => ensureStringQueryParam("accessId", "undefined")).toThrow(
      "accessId query parameter is required.",
    );
    expect(() => ensureStringQueryParam("accessId", "null")).toThrow(
      "accessId query parameter is required.",
    );
  });

  it("validates uuid params", () => {
    expect(
      ensureValidUuidQueryParam("releaseId", "123e4567-e89b-12d3-a456-426614174000"),
    ).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(() => ensureValidUuidQueryParam("releaseId", "invalid")).toThrow();
  });
});
