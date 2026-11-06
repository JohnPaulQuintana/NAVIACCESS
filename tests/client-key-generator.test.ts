import { describe, expect, it } from "vitest";

import { generateClientKeyPair } from "../src/client/key-generator.js";
import { signClientRequest } from "../src/client/request-signer.js";
import { verifyRequest } from "../src/index.js";

describe("NaviAccess Client Key Generator", () => {
  it("should generate a non-extractable Ed25519 private key", async () => {
    const keys = await generateClientKeyPair();

    expect(keys.publicKey).toContain("-----BEGIN PUBLIC KEY-----");

    expect(keys.privateKey).toBeInstanceOf(CryptoKey);
    expect(keys.privateKey.type).toBe("private");
    expect(keys.privateKey.algorithm.name).toBe("Ed25519");
    expect(keys.privateKey.extractable).toBe(false);
    expect(keys.privateKey.usages).toContain("sign");
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