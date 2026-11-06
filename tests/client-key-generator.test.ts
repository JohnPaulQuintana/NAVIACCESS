import { describe, expect, it } from "vitest";

import {
  generateClientKeyPair,
} from "../src/client/key-generator.js";

import { signClientRequest } from "../src/client/request-signer.js";
import { verifyRequest } from "../src/index.js";

describe("NaviAccess Client Key Generator", () => {
  it("should generate a valid Ed25519 key pair", async () => {
    const keys = await generateClientKeyPair();

    expect(keys.publicKey).toContain("-----BEGIN PUBLIC KEY-----");
    expect(keys.privateKey).toContain("-----BEGIN PRIVATE KEY-----");
  });

  it("should generate keys accepted by the backend verifier", async () => {
    const keys = await generateClientKeyPair();

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
});