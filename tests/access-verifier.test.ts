import { describe, expect, it, vi, afterEach } from "vitest";

import {
  generateKeyPair,
  generateChallenge,
  generateRepresentation,
  InMemoryChallengeStore,
  signRequest,
  verifyAccess,
} from "../src/index.js";

describe("NaviAccess Access Verifier", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should reject an expired challenge", async () => {
    vi.useFakeTimers();

    const keys = generateKeyPair();
    const challenge = generateChallenge({
      expiresInSeconds: 1,
    });
    const store = new InMemoryChallengeStore();

    store.save(challenge);

    const generated = generateRepresentation({
      keyword: "naviaccess",
    });

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: "{}",
      challengeId: challenge.id,
      nonce: challenge.nonce,
      representation: generated.value,
    };

    const signed = signRequest({
      ...request,
      privateKey: keys.privateKey,
    });

    vi.advanceTimersByTime(1000);

    const result = await verifyAccess({
      ...request,
      signature: signed.signature,
      publicKey: keys.publicKey,
      keyword: "naviaccess",
      challengeStore: store,
    });

    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("Challenge expired.");
  });

  it("should authorize a valid request", async () => {
    const keys = generateKeyPair();
    const challenge = generateChallenge();
    const store = new InMemoryChallengeStore();

    store.save(challenge);

    const generated = generateRepresentation({
      keyword: "naviaccess",
    });

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: '{"amount":100}',
      challengeId: challenge.id,
      nonce: challenge.nonce,
      representation: generated.value,
    };

    const signed = signRequest({
      ...request,
      privateKey: keys.privateKey,
    });

    const result = await verifyAccess({
      ...request,
      signature: signed.signature,
      publicKey: keys.publicKey,
      keyword: "naviaccess",
      challengeStore: store,
    });

    expect(result.authorized).toBe(true);
  });

  it("should reject a reused challenge", async () => {
    const keys = generateKeyPair();
    const challenge = generateChallenge();
    const store = new InMemoryChallengeStore();

    store.save(challenge);

    const generated = generateRepresentation({
      keyword: "naviaccess",
    });

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: "{}",
      challengeId: challenge.id,
      nonce: challenge.nonce,
      representation: generated.value,
    };

    const signed = signRequest({
      ...request,
      privateKey: keys.privateKey,
    });

    const options = {
      ...request,
      signature: signed.signature,
      publicKey: keys.publicKey,
      keyword: "naviaccess",
      challengeStore: store,
    };

    const firstResult = await verifyAccess(options);
    const secondResult = await verifyAccess(options);

    expect(firstResult.authorized).toBe(true);
    expect(secondResult.authorized).toBe(false);
  });

  it("should reject an incorrect challenge nonce", async () => {
    const keys = generateKeyPair();
    const challenge = generateChallenge();
    const store = new InMemoryChallengeStore();

    store.save(challenge);

    const generated = generateRepresentation({
      keyword: "naviaccess",
    });

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: "{}",
      challengeId: challenge.id,
      nonce: "incorrect-nonce",
      representation: generated.value,
    };

    const signed = signRequest({
      ...request,
      privateKey: keys.privateKey,
    });

    const result = await verifyAccess({
      ...request,
      signature: signed.signature,
      publicKey: keys.publicKey,
      keyword: "naviaccess",
      challengeStore: store,
    });

    expect(result.authorized).toBe(false);
    expect(store.consume(challenge.id, challenge.nonce)).toBe("valid");
  });

  it("should not consume a challenge when the signature is invalid", async () => {
    const keys = generateKeyPair();
    const challenge = generateChallenge();
    const store = new InMemoryChallengeStore();

    store.save(challenge);

    const generated = generateRepresentation({
      keyword: "naviaccess",
    });

    const result = await verifyAccess({
      method: "POST",
      path: "/api/withdrawals",
      body: "{}",
      challengeId: challenge.id,
      nonce: challenge.nonce,
      representation: generated.value,
      signature: "invalid-signature",
      publicKey: keys.publicKey,
      keyword: "naviaccess",
      challengeStore: store,
    });

    expect(result.authorized).toBe(false);
    expect(store.consume(challenge.id, challenge.nonce)).toBe("valid");
  });
});
