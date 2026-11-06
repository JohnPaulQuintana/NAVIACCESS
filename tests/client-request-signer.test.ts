import { describe, expect, it } from "vitest";

import {
  generateKeyPair,
  verifyRequest,
} from "../src/index.js";

import { signClientRequest } from "../src/client/request-signer.js";

describe("NaviAccess Client Request Signer", () => {
  it("should generate a signature accepted by the backend verifier", async () => {
    const keys = generateKeyPair();

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: '{"amount":100}',
      challengeId: "challenge-123",
      nonce: "nonce-456",
      representation: "naviaaccess123",
    };

    const signed = await signClientRequest({
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

  it("should reject a modified request body", async () => {
    const keys = generateKeyPair();

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: '{"amount":100}',
      challengeId: "challenge-123",
      nonce: "nonce-456",
      representation: "naviaaccess123",
    };

    const signed = await signClientRequest({
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
});