import { describe, expect, it } from "vitest";
import i18n from "./index";

describe("i18n index", () => {
  it("initializes with english as default", () => {
    expect(i18n.language).toBe("en");
    expect(i18n.t("appTitle")).toBeTruthy();
  });
});
