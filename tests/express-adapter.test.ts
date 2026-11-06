import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";

import { naviAccess } from "../src/adapters/express.js";
import { InMemoryChallengeStore } from "../src/core/challenge-store.js";

import { generateKeyPair } from "../src/core/signature.js";
import { generateChallenge } from "../src/core/challenge.js";
import { signRequest } from "../src/core/request-signer.js";
import { generateRepresentation } from "../src/core/representation.js";

describe("NaviAccess Express Adapter", () => {
  it("should reject requests with missing authentication headers", async () => {
    const app = express();
    const challengeStore = new InMemoryChallengeStore();

    app.use(
      naviAccess({
        keyword: "naviaccess",
        challengeStore,
        getPublicKey: () => "",
        getBody: () => "",
      }),
    );

    app.get("/protected", (_req, res) => {
      res.json({ message: "Access granted." });
    });

    const response = await request(app).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Missing NaviAccess authentication headers.",
    );
  });

  it("should reject requests when the client public key is not found", async () => {
    const app = express();
    const challengeStore = new InMemoryChallengeStore();

    app.use(
      naviAccess({
        keyword: "naviaccess",
        challengeStore,
        getPublicKey: () => "",
        getBody: () => "",
      }),
    );

    app.get("/protected", (_req, res) => {
      res.json({ message: "Access granted." });
    });

    const response = await request(app)
      .get("/protected")
      .set("X-NaviAccess-Challenge", "test-challenge")
      .set("X-NaviAccess-Nonce", "test-nonce")
      .set("X-NaviAccess-Representation", "test-representation")
      .set("X-NaviAccess-Signature", "test-signature");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Client public key not found.");
  });

  it("should reject requests with an invalid signature", async () => {
    const app = express();
    const challengeStore = new InMemoryChallengeStore();

    app.use(
      naviAccess({
        keyword: "naviaccess",
        challengeStore,
        getPublicKey: () => "invalid-public-key",
        getBody: () => "",
      }),
    );

    app.get("/protected", (_req, res) => {
      res.json({ message: "Access granted." });
    });

    const response = await request(app)
      .get("/protected")
      .set("X-NaviAccess-Challenge", "test-challenge")
      .set("X-NaviAccess-Nonce", "test-nonce")
      .set("X-NaviAccess-Representation", "naviaccess123456")
      .set("X-NaviAccess-Signature", "invalid-signature");

    expect(response.status).toBe(401);
  });

  it("should allow requests with a valid NaviAccess signature", async () => {
    const app = express();
    const challengeStore = new InMemoryChallengeStore();

    const keyword = "naviaccess";
    const keys = generateKeyPair();
    const challenge = generateChallenge();

    challengeStore.save(challenge);

    const representation = generateRepresentation({ keyword }).value;

    const signed = signRequest({
      method: "GET",
      path: "/protected",
      body: "",
      challengeId: challenge.id,
      nonce: challenge.nonce,
      representation,
      privateKey: keys.privateKey,
    });

    app.use(
      naviAccess({
        keyword,
        challengeStore,
        getPublicKey: () => keys.publicKey,
        getBody: () => "",
      }),
    );

    app.get("/protected", (_req, res) => {
      res.json({ message: "Access granted." });
    });

    const response = await request(app)
      .get("/protected")
      .set("X-NaviAccess-Challenge", challenge.id)
      .set("X-NaviAccess-Nonce", challenge.nonce)
      .set("X-NaviAccess-Representation", representation)
      .set("X-NaviAccess-Signature", signed.signature);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Access granted.");
  });

  it("should reject a reused challenge", async () => {
    const app = express();
    const challengeStore = new InMemoryChallengeStore();

    const keyword = "naviaccess";
    const keys = generateKeyPair();
    const challenge = generateChallenge();

    challengeStore.save(challenge);

    const representation = generateRepresentation({ keyword }).value;

    const signed = signRequest({
      method: "GET",
      path: "/protected",
      body: "",
      challengeId: challenge.id,
      nonce: challenge.nonce,
      representation,
      privateKey: keys.privateKey,
    });

    app.use(
      naviAccess({
        keyword,
        challengeStore,
        getPublicKey: () => keys.publicKey,
        getBody: () => "",
      }),
    );

    app.get("/protected", (_req, res) => {
      res.json({ message: "Access granted." });
    });

    const sendRequest = () =>
      request(app)
        .get("/protected")
        .set("X-NaviAccess-Challenge", challenge.id)
        .set("X-NaviAccess-Nonce", challenge.nonce)
        .set("X-NaviAccess-Representation", representation)
        .set("X-NaviAccess-Signature", signed.signature);

    const firstResponse = await sendRequest();
    const secondResponse = await sendRequest();

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(401);
  });
});
