import { describe, expect, it } from "vitest";
import { createPublicKey, verify } from "node:crypto";

import { generateKeyPair, signRequest } from "../src/index.js";

describe("NaviAccess Request Signer", () => {
  it("should sign a request successfully", () => {
    const keys = generateKeyPair();

    const result = signRequest({
      method: "POST",
      path: "/api/withdrawals",
      body: '{"amount":100}',
      challengeId: "challenge-123",
      nonce: "random-nonce",
      representation: "naviaaccess123",
      privateKey: keys.privateKey,
    });

    const isValid = verify(
      null,
      new TextEncoder().encode(result.signedPayload),
      createPublicKey(keys.publicKey),
      Uint8Array.from(atob(result.signature), (character) =>
        character.charCodeAt(0),
      ),
    );

    expect(isValid).toBe(true);
  });

  it("should produce different signatures for different requests", () => {
    const keys = generateKeyPair();

    const first = signRequest({
      method: "POST",
      path: "/api/withdrawals",
      body: '{"amount":100}',
      challengeId: "challenge-123",
      nonce: "nonce-123",
      representation: "naviaaccess123",
      privateKey: keys.privateKey,
    });

    const second = signRequest({
      method: "POST",
      path: "/api/withdrawals",
      body: '{"amount":200}',
      challengeId: "challenge-123",
      nonce: "nonce-123",
      representation: "naviaaccess123",
      privateKey: keys.privateKey,
    });

    expect(first.signedPayload).not.toBe(second.signedPayload);
    expect(first.signature).not.toBe(second.signature);
  });

  it("should reject missing required fields", () => {
    const keys = generateKeyPair();

    expect(() =>
      signRequest({
        method: "",
        path: "/api/withdrawals",
        body: "{}",
        challengeId: "challenge-123",
        nonce: "nonce-123",
        representation: "naviaaccess123",
        privateKey: keys.privateKey,
      }),
    ).toThrow();
  });
});