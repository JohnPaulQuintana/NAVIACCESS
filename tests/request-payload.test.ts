import { describe, expect, it } from "vitest";

import { createRequestPayload } from "../src/core/request-payload.js";

describe("NaviAccess Request Payload", () => {
  it("should create a deterministic payload", () => {
    const options = {
      method: "post",
      path: "/api/test",
      body: '{"amount":100}',
      challengeId: "challenge-123",
      nonce: "nonce-123",
      representation: "representation-123",
    };

    const first = createRequestPayload(options);
    const second = createRequestPayload(options);

    expect(first).toBe(second);
  });

  it("should prevent newline-based field ambiguity", () => {
    const first = createRequestPayload({
      method: "POST",
      path: "/api/test",
      body: "hello\nworld",
      challengeId: "challenge-123",
      nonce: "nonce-123",
      representation: "representation-123",
    });

    const second = createRequestPayload({
      method: "POST",
      path: "/api/test\nhello",
      body: "world",
      challengeId: "challenge-123",
      nonce: "nonce-123",
      representation: "representation-123",
    });

    expect(first).not.toBe(second);
  });
});