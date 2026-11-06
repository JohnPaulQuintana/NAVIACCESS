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

  it("should reject a modified HTTP method", () => {
    const keys = generateKeyPair();

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
      privateKey: keys.privateKey,
    });

    const result = verifyRequest({
      ...request,
      method: "DELETE",
      signature: signed.signature,
      publicKey: keys.publicKey,
    });

    expect(result.valid).toBe(false);
  });

  it("should reject a modified request path", () => {
    const keys = generateKeyPair();

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
      privateKey: keys.privateKey,
    });

    const result = verifyRequest({
      ...request,
      path: "/api/admin",
      signature: signed.signature,
      publicKey: keys.publicKey,
    });

    expect(result.valid).toBe(false);
  });

  it("should reject a modified challenge ID", () => {
    const keys = generateKeyPair();

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
      privateKey: keys.privateKey,
    });

    const result = verifyRequest({
      ...request,
      challengeId: "challenge-456",
      signature: signed.signature,
      publicKey: keys.publicKey,
    });

    expect(result.valid).toBe(false);
  });

  it("should reject a modified nonce", () => {
    const keys = generateKeyPair();

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
      privateKey: keys.privateKey,
    });

    const result = verifyRequest({
      ...request,
      nonce: "nonce-456",
      signature: signed.signature,
      publicKey: keys.publicKey,
    });

    expect(result.valid).toBe(false);
  });

  it("should reject a modified representation", () => {
    const keys = generateKeyPair();

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
      privateKey: keys.privateKey,
    });

    const result = verifyRequest({
      ...request,
      representation: "modified-representation",
      signature: signed.signature,
      publicKey: keys.publicKey,
    });

    expect(result.valid).toBe(false);
  });
});
