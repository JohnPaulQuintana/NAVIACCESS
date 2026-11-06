import { describe, expect, it } from "vitest";

import { generateKeyPair, signRequest, verifyRequest } from "../src/index.js";

describe("NaviAccess Request Verifier", () => {
  it("should verify a valid signed request", () => {
    const keys = generateKeyPair();

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: '{"amount":100}',
      challengeId: "challenge-123",
      nonce: "nonce-123",
      representation: "naviaaccess123",
    };

    const signed = signRequest({
      ...request,
      privateKey: keys.privateKey,
    });

    const result = verifyRequest({
      ...request,
      signature: signed.signature,
      publicKey: keys.publicKey,
    });

    expect(result.valid).toBe(true);
  });

  it("should reject a modified request body", () => {
    const keys = generateKeyPair();

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: '{"amount":100}',
      challengeId: "challenge-123",
      nonce: "nonce-123",
      representation: "naviaaccess123",
    };

    const signed = signRequest({
      ...request,
      privateKey: keys.privateKey,
    });

    const result = verifyRequest({
      ...request,
      body: '{"amount":500}',
      signature: signed.signature,
      publicKey: keys.publicKey,
    });

    expect(result.valid).toBe(false);
  });

  it("should reject a signature from another key pair", () => {
    const firstKeys = generateKeyPair();
    const secondKeys = generateKeyPair();

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: "{}",
      challengeId: "challenge-123",
      nonce: "nonce-123",
      representation: "naviaaccess123",
    };

    const signed = signRequest({
      ...request,
      privateKey: firstKeys.privateKey,
    });

    const result = verifyRequest({
      ...request,
      signature: signed.signature,
      publicKey: secondKeys.publicKey,
    });

    expect(result.valid).toBe(false);
  });

  it("should reject missing verification fields", () => {
    const result = verifyRequest({
      method: "",
      path: "/api/withdrawals",
      body: "{}",
      challengeId: "challenge-123",
      nonce: "nonce-123",
      representation: "",
      signature: "invalid",
      publicKey: "invalid",
    });

    expect(result.valid).toBe(false);
  });
});
