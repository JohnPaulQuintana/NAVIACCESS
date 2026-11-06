import { describe, expect, it } from "vitest";

import {
  generateRepresentation,
  validateRepresentation,
} from "../src/index.js";

describe("NaviAccess Representation Validator", () => {
  const keyword = "naviaccess";

  it("should accept a valid generated representation", () => {
    const generated = generateRepresentation({ keyword });

    const result = validateRepresentation({
      representation: generated.value,
      keyword,
    });

    expect(result.valid).toBe(true);
  });

  it("should reject an incomplete representation", () => {
    const result = validateRepresentation({
      representation: "navia",
      keyword,
    });

    expect(result.valid).toBe(false);
  });

  it("should reject a representation with missing keyword characters", () => {
    const result = validateRepresentation({
      representation: "xxxxxxxxxxxxxx",
      keyword,
    });

    expect(result.valid).toBe(false);
  });

  it("should reject an incorrect representation length", () => {
    const result = validateRepresentation({
      representation: "naviaccess",
      keyword,
    });

    expect(result.valid).toBe(false);
  });
});
