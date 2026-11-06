import { afterEach, describe, expect, it, vi } from "vitest";

import { generateChallenge } from "../src/core/challenge.js";
import { FirestoreChallengeStore } from "../src/adapters/firebase.js";

function createFirestoreMock() {
  const documents = new Map<string, Record<string, unknown>>();

  const transactionUpdate = vi.fn(
    (reference: { id: string }, data: Record<string, unknown>) => {
      const existing = documents.get(reference.id);

      if (existing) {
        documents.set(reference.id, {
          ...existing,
          ...data,
        });
      }
    },
  );

  const transactionGet = vi.fn(async (reference: { id: string }) => {
    const data = documents.get(reference.id);

    return {
      exists: Boolean(data),
      data: () => data,
    };
  });

  const document = (id: string) => ({
    id,

    create: vi.fn(async (data: Record<string, unknown>) => {
      if (documents.has(id)) {
        throw new Error("Document already exists.");
      }

      documents.set(id, data);
    }),

    get: vi.fn(async () => {
      const data = documents.get(id);

      return {
        exists: Boolean(data),
        data: () => data,
      };
    }),
  });

  const collection = {
    doc: vi.fn(document),
  };

  const firestore = {
    collection: vi.fn(() => collection),

    runTransaction: vi.fn(
      async (
        callback: (transaction: {
          get: typeof transactionGet;
          update: typeof transactionUpdate;
        }) => Promise<unknown>,
      ) => {
        return callback({
          get: transactionGet,
          update: transactionUpdate,
        });
      },
    ),
  };

  return {
    firestore,
    documents,
    transactionGet,
    transactionUpdate,
  };
}

describe("NaviAccess Firestore Challenge Store", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should reject a challenge at the exact expiration time", async () => {
    vi.useFakeTimers();

    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const challenge = generateChallenge({
      expiresInSeconds: 1,
    });

    await store.save(challenge);

    vi.advanceTimersByTime(1000);

    expect(Date.now()).toBe(challenge.expiresAt);

    const result = await store.consume(challenge.id, challenge.nonce);

    expect(result).toBe("expired");
    expect(mock.documents.get(challenge.id)?.consumed).toBe(false);
  });

  it("should save a challenge to Firestore", async () => {
    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const challenge = generateChallenge();

    await store.save(challenge);

    expect(mock.documents.get(challenge.id)).toEqual({
      ...challenge,
      consumed: false,
      ttlAt: new Date(challenge.expiresAt),
    });
  });

  it("should retrieve a saved challenge", async () => {
    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const challenge = generateChallenge();

    await store.save(challenge);

    const result = await store.get(challenge.id);

    expect(result).toEqual(challenge);
  });

  it("should return undefined for an unknown challenge", async () => {
    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const result = await store.get("unknown-id");

    expect(result).toBeUndefined();
  });

  it("should consume a valid challenge", async () => {
    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const challenge = generateChallenge();

    await store.save(challenge);

    const result = await store.consume(challenge.id, challenge.nonce);

    expect(result).toBe("valid");
    expect(mock.documents.get(challenge.id)?.consumed).toBe(true);
  });

  it("should reject an already consumed challenge", async () => {
    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const challenge = generateChallenge();

    await store.save(challenge);

    await store.consume(challenge.id, challenge.nonce);

    const result = await store.consume(challenge.id, challenge.nonce);

    expect(result).toBe("already_used");
  });

  it("should reject an incorrect nonce without consuming the challenge", async () => {
    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const challenge = generateChallenge();

    await store.save(challenge);

    const result = await store.consume(challenge.id, "incorrect-nonce");

    expect(result).toBe("nonce_mismatch");
    expect(mock.documents.get(challenge.id)?.consumed).toBe(false);
  });

  it("should reject an expired challenge", async () => {
    vi.useFakeTimers();

    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const challenge = generateChallenge({
      expiresInSeconds: 1,
    });

    await store.save(challenge);

    vi.advanceTimersByTime(1001);

    const result = await store.consume(challenge.id, challenge.nonce);

    expect(result).toBe("expired");
    expect(mock.documents.get(challenge.id)?.consumed).toBe(false);
  });

  it("should reject an unknown challenge during consumption", async () => {
    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const result = await store.consume("unknown-id", "some-nonce");

    expect(result).toBe("not_found");
  });

  it("should reject duplicate challenge IDs", async () => {
    const mock = createFirestoreMock();

    const store = new FirestoreChallengeStore(mock.firestore as never);

    const challenge = generateChallenge();

    await store.save(challenge);

    await expect(store.save(challenge)).rejects.toThrow(
      "Document already exists.",
    );
  });

  it("should reject an empty collection name", () => {
    const mock = createFirestoreMock();

    expect(
      () => new FirestoreChallengeStore(mock.firestore as never, " "),
    ).toThrow("Firestore collection name is required.");
  });
});
