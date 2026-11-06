import { describe, expect, it } from "vitest";
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

import { generateKeyPair } from "../src/index.js";

describe("NaviAccess Signature", () => {
  it("should generate a public and private key", () => {
    const keys = generateKeyPair();

    expect(keys.publicKey).toContain("PUBLIC KEY");
    expect(keys.privateKey).toContain("PRIVATE KEY");
  });

  it("should generate a working key pair", () => {
    const keys = generateKeyPair();

    const privateKey = createPrivateKey(keys.privateKey);
    const publicKey = createPublicKey(keys.publicKey);

    const message = new TextEncoder().encode("NaviAccess test request");

    const signature = sign(null, message, privateKey);

    const isValid = verify(null, message, publicKey, signature);

    expect(isValid).toBe(true);
  });

  it("should generate unique key pairs", () => {
    const first = generateKeyPair();
    const second = generateKeyPair();

    expect(first.publicKey).not.toBe(second.publicKey);
    expect(first.privateKey).not.toBe(second.privateKey);
  });
});
