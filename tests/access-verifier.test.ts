import { describe, expect, it } from "vitest";

import {
  generateKeyPair,
  generateChallenge,
  generateRepresentation,
  InMemoryChallengeStore,
  signRequest,
  verifyAccess,
} from "../src/index.js";

describe("NaviAccess Access Verifier", () => {
  it("should authorize a valid request", () => {
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

    const result = verifyAccess({
      ...request,
      signature: signed.signature,
      publicKey: keys.publicKey,
      keyword: "naviaccess",
      challengeStore: store,
    });

    expect(result.authorized).toBe(true);
  });

  it("should reject a reused challenge", () => {
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

    expect(verifyAccess(options).authorized).toBe(true);
    expect(verifyAccess(options).authorized).toBe(false);
  });

  it("should reject an incorrect challenge nonce", () => {
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

    const result = verifyAccess({
      ...request,
      signature: signed.signature,
      publicKey: keys.publicKey,
      keyword: "naviaccess",
      challengeStore: store,
    });

    expect(result.authorized).toBe(false);
    expect(store.consume(challenge.id)).toBe("valid");
  });

  it("should not consume a challenge when the signature is invalid", () => {
    const keys = generateKeyPair();
    const challenge = generateChallenge();
    const store = new InMemoryChallengeStore();

    store.save(challenge);

    const generated = generateRepresentation({
      keyword: "naviaccess",
    });

    const result = verifyAccess({
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
    expect(store.consume(challenge.id)).toBe("valid");
  });
});
