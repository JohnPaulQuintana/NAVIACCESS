
import type { Firestore } from "firebase-admin/firestore";

import type { GeneratedChallenge } from "../core/challenge.js";
import type {
  ChallengeConsumeResult,
  ChallengeStore,
} from "../core/challenge-store.js";

interface StoredFirestoreChallenge extends GeneratedChallenge {
  consumed: boolean;
   ttlAt: Date;
}

export class FirestoreChallengeStore implements ChallengeStore {
  private readonly collectionName: string;

  constructor(
    private readonly firestore: Firestore,
    collectionName = "naviaccess_challenges",
  ) {
    if (!collectionName.trim()) {
      throw new Error("Firestore collection name is required.");
    }

    this.collectionName = collectionName;
  }

  async save(challenge: GeneratedChallenge): Promise<void> {
    const document = this.firestore
      .collection(this.collectionName)
      .doc(challenge.id);

    const storedChallenge: StoredFirestoreChallenge = {
      ...challenge,
      consumed: false,
      ttlAt: new Date(challenge.expiresAt),
    };

    await document.create(storedChallenge);
  }

  async get(id: string): Promise<GeneratedChallenge | undefined> {
    const document = await this.firestore
      .collection(this.collectionName)
      .doc(id)
      .get();

    if (!document.exists) {
      return undefined;
    }

    const data = document.data() as StoredFirestoreChallenge;

    return {
      id: data.id,
      nonce: data.nonce,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    };
  }

  async consume(
    id: string,
    expectedNonce: string,
  ): Promise<ChallengeConsumeResult> {
    const document = this.firestore
      .collection(this.collectionName)
      .doc(id);

    return this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(document);

      if (!snapshot.exists) {
        return "not_found";
      }

      const challenge = snapshot.data() as StoredFirestoreChallenge;

      if (challenge.consumed) {
        return "already_used";
      }

      if (challenge.nonce !== expectedNonce) {
        return "nonce_mismatch";
      }

      if (Date.now() >= challenge.expiresAt) {
        return "expired";
      }

      transaction.update(document, {
        consumed: true,
      });

      return "valid";
    });
  }
}
