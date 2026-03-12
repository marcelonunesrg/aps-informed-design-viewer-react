import { describe, expect, it } from "vitest";
import { resources } from "./resources";

describe("i18n resources", () => {
  it("contains supported languages", () => {
    expect(Object.keys(resources)).toEqual(expect.arrayContaining(["en", "es", "fr", "pt"]));
  });

  it("contains common translation keys", () => {
    const enTranslation = resources.en.translation as Record<string, string>;
    const ptTranslation = resources.pt.translation as Record<string, string>;

    expect(enTranslation.appTitle).toBeTruthy();
    expect(ptTranslation.logout).toBeTruthy();
  });
});
