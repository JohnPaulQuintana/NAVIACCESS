import type { GeneratedChallenge } from "./challenge.js";

export type ChallengeConsumeResult =
  | "valid"
  | "not_found"
  | "expired"
  | "already_used"
  | "nonce_mismatch";

/**
 * Shared contract for NaviAccess challenge storage providers.
 */
export interface ChallengeStore {
  save(challenge: GeneratedChallenge): void | Promise<void>;

  get(
    id: string,
  ): GeneratedChallenge | undefined | Promise<GeneratedChallenge | undefined>;

  consume(
    id: string,
    expectedNonce: string,
  ): ChallengeConsumeResult | Promise<ChallengeConsumeResult>;
}

interface StoredChallenge {
  challenge: GeneratedChallenge;
  consumed: boolean;
}

/**
 * Temporary in-memory challenge storage.
 */
export class InMemoryChallengeStore implements ChallengeStore {
  private readonly challenges = new Map<string, StoredChallenge>();

  save(challenge: GeneratedChallenge): void {
    if (this.challenges.has(challenge.id)) {
      throw new Error("Challenge already exists.");
    }

    this.challenges.set(challenge.id, {
      challenge,
      consumed: false,
    });
  }

  get(id: string): GeneratedChallenge | undefined {
    return this.challenges.get(id)?.challenge;
  }

  consume(
    id: string,
    expectedNonce: string,
  ): ChallengeConsumeResult {
    const stored = this.challenges.get(id);

    if (!stored) return "not_found";
    if (stored.consumed) return "already_used";

    if (stored.challenge.nonce !== expectedNonce) {
      return "nonce_mismatch";
    }

    if (Date.now() >= stored.challenge.expiresAt) {
      return "expired";
    }

    stored.consumed = true;

    return "valid";
  }

  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [id, stored] of this.challenges) {
      if (stored.consumed || now >= stored.challenge.expiresAt) {
        this.challenges.delete(id);
        removed++;
      }
    }

    return removed;
  }

  get size(): number {
    return this.challenges.size;
  }
}