import { describe, expect, it } from "vitest";
import { generateChallenge } from "../src/index.js";

describe("NaviAccess Challenge Generator", () => {
  it("should generate a challenge", () => {
    const challenge = generateChallenge();

    expect(challenge.id).toBeTruthy();
    expect(challenge.nonce).toHaveLength(64);
    expect(challenge.expiresAt).toBeGreaterThan(challenge.createdAt);
  });

  it("should generate unique challenges", () => {
    const first = generateChallenge();
    const second = generateChallenge();

    expect(first.id).not.toBe(second.id);
    expect(first.nonce).not.toBe(second.nonce);
  });

  it("should respect custom expiration", () => {
    const challenge = generateChallenge({
      expiresInSeconds: 30,
    });

    expect(challenge.expiresAt - challenge.createdAt).toBe(30000);
  });

  it("should reject invalid expiration", () => {
    expect(() =>
      generateChallenge({
        expiresInSeconds: 0,
      }),
    ).toThrow();
  });
});
