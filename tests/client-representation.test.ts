import { describe, expect, it } from "vitest";

import {
  generateClientRepresentation,
} from "../src/client/representation.js";

import {
  validateRepresentation,
} from "../src/index.js";

describe("NaviAccess Client Representation", () => {
  it("should generate a representation", () => {
    const result = generateClientRepresentation({
      keyword: "naviaccess",
    });

    expect(result.value).toBeTruthy();
    expect(result.value.length).toBe("naviaccess".length + 12);
    expect(result.createdAt).toBeTruthy();
  });

  it("should generate a representation accepted by the backend", () => {
    const keyword = "naviaccess";

    const generated = generateClientRepresentation({
      keyword,
    });

    const result = validateRepresentation({
      representation: generated.value,
      keyword,
    });

    expect(result.valid).toBe(true);
  });

  it("should generate different representations", () => {
    const first = generateClientRepresentation({
      keyword: "naviaccess",
    });

    const second = generateClientRepresentation({
      keyword: "naviaccess",
    });

    expect(first.value).not.toBe(second.value);
  });

  it("should reject an empty keyword", () => {
    expect(() =>
      generateClientRepresentation({
        keyword: "",
      }),
    ).toThrow("NaviAccess keyword cannot be empty.");
  });
});