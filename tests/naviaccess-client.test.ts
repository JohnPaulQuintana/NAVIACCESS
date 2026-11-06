import { describe, expect, it } from "vitest";

import { generateClientKeyPair } from "../src/client/key-generator.js";
import { createNaviAccessClient } from "../src/client/naviaccess-client.js";
import { verifyRequest } from "../src/core/request-verifier.js";

describe("NaviAccess Client", () => {
  it("should create a signed request", async () => {
    const keys = await generateClientKeyPair();

    const client = createNaviAccessClient({
      keyword: "naviaccess",
      privateKey: keys.privateKey,
    });

    const request = {
      method: "POST",
      path: "/api/withdrawals",
      body: '{"amount":100}',
      challenge: {
        id: "challenge-123",
        nonce: "nonce-456",
      },
    };

    const signed = await client.sign(request);

    const verification = verifyRequest({
      ...request,
      challengeId: signed.challengeId,
      nonce: signed.nonce,
      representation: signed.representation,
      signature: signed.signature,
      publicKey: keys.publicKey,
    });

    expect(verification.valid).toBe(true);
    
    expect(signed.headers["X-NaviAccess-Challenge"]).toBe(request.challenge.id);

    expect(signed.headers["X-NaviAccess-Nonce"]).toBe(request.challenge.nonce);

    expect(signed.headers["X-NaviAccess-Representation"]).toBe(
      signed.representation,
    );

    expect(signed.headers["X-NaviAccess-Signature"]).toBe(signed.signature);
  });

  it("should reject incomplete client configuration", () => {
    expect(() =>
      createNaviAccessClient({
        keyword: "",
        privateKey: "",
      }),
    ).toThrow("NaviAccess client configuration is incomplete.");
  });
});
