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

    expect(store.consume(challenge.id)).toBe("valid");
    expect(store.consume(challenge.id)).toBe("already_used");
  });

  it("should reject an unknown challenge", () => {
    const store = new InMemoryChallengeStore();

    expect(store.consume("unknown-id")).toBe("not_found");
  });

  it("should reject expired challenges", () => {
    vi.useFakeTimers();

    const store = new InMemoryChallengeStore();
    const challenge = generateChallenge({
      expiresInSeconds: 1,
    });

    store.save(challenge);

    vi.advanceTimersByTime(1001);

    expect(store.consume(challenge.id)).toBe("expired");
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
});
