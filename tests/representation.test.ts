import { describe, expect, it } from "vitest";
import { generateRepresentation } from "../src/core/representation.js";

describe("NaviAccess Representation", () => {
  it("should generate a representation", () => {
    const result = generateRepresentation({
      keyword: "naviaccess",
    });

    expect(result.value).toBeTruthy();
    expect(result.createdAt).toBeTruthy();
  });

  it("should produce different representations", () => {
    const first = generateRepresentation({
      keyword: "naviaccess",
    });

    const second = generateRepresentation({
      keyword: "naviaccess",
    });

    expect(first.value).not.toBe(second.value);
  });

  it("should reject an empty keyword", () => {
    expect(() =>
      generateRepresentation({
        keyword: "",
      }),
    ).toThrow();
  });
});
