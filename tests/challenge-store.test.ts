import { describe, expect, it, vi, afterEach } from "vitest";

import { generateChallenge, InMemoryChallengeStore } from "../src/index.js";

describe("NaviAccess Challenge Store", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should save and retrieve a challenge", () => {
    const store = new InMemoryChallengeStore();
    const challenge = generateChallenge();

    store.save(challenge);

    expect(store.get(challenge.id)).toEqual(challenge);
    expect(store.size).toBe(1);
  });

  it("should consume a challenge only once", () => {
    const store = new InMemoryChallengeStore();
    const challenge = generateChallenge();

    store.save(challenge);

    expect(store.consume(challenge.id, challenge.nonce)).toBe("valid");
    expect(store.consume(challenge.id, challenge.nonce)).toBe("already_used");
  });

  it("should reject an unknown challenge", () => {
    const store = new InMemoryChallengeStore();

    expect(store.consume("unknown-id", "some-nonce")).toBe("not_found");
  });

  it("should reject an incorrect nonce without consuming the challenge", () => {
    const store = new InMemoryChallengeStore();
    const challenge = generateChallenge();

    store.save(challenge);

    expect(store.consume(challenge.id, "incorrect-nonce")).toBe(
      "nonce_mismatch",
    );

    expect(store.consume(challenge.id, challenge.nonce)).toBe("valid");
  });

  it("should reject expired challenges", () => {
    vi.useFakeTimers();

    const store = new InMemoryChallengeStore();
    const challenge = generateChallenge({
      expiresInSeconds: 1,
    });

    store.save(challenge);

    vi.advanceTimersByTime(1001);

    expect(store.consume(challenge.id, challenge.nonce)).toBe("expired");
  });

  it("should remove expired challenges", () => {
    vi.useFakeTimers();

    const store = new InMemoryChallengeStore();
    const challenge = generateChallenge({
      expiresInSeconds: 1,
    });

    store.save(challenge);

    vi.advanceTimersByTime(1001);

    expect(store.cleanup()).toBe(1);
    expect(store.size).toBe(0);
  });

  it("should reject duplicate challenge IDs", () => {
    const store = new InMemoryChallengeStore();
    const challenge = generateChallenge();

    store.save(challenge);

    expect(() => store.save(challenge)).toThrow();
  });

  it("should reject a challenge at the exact expiration time", () => {
    vi.useFakeTimers();

    const store = new InMemoryChallengeStore();
    const challenge = generateChallenge({
      expiresInSeconds: 1,
    });

    store.save(challenge);

    vi.advanceTimersByTime(1000);

    expect(Date.now()).toBe(challenge.expiresAt);

    expect(store.consume(challenge.id, challenge.nonce)).toBe("expired");
  });
});
