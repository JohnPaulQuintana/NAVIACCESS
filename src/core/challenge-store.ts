import type { GeneratedChallenge } from "./challenge.js";

interface StoredChallenge {
  challenge: GeneratedChallenge;
  consumed: boolean;
}

export type ChallengeConsumeResult =
  | "valid"
  | "not_found"
  | "expired"
  | "already_used";

/**
 * Temporary in-memory challenge storage.
 *
 * Each challenge can only be consumed once
 * within this Node.js process.
 */
export class InMemoryChallengeStore {
  private readonly challenges = new Map<string, StoredChallenge>();

  /**
   * Save a generated challenge.
   */
  save(challenge: GeneratedChallenge): void {
    if (this.challenges.has(challenge.id)) {
      throw new Error("Challenge already exists.");
    }

    this.challenges.set(challenge.id, {
      challenge,
      consumed: false,
    });
  }

  /**
   * Retrieve a challenge without consuming it.
   */
  get(id: string): GeneratedChallenge | undefined {
    return this.challenges.get(id)?.challenge;
  }

  /**
   * Validate and consume a challenge.
   */
  consume(id: string): ChallengeConsumeResult {
    const stored = this.challenges.get(id);

    if (!stored) {
      return "not_found";
    }

    if (stored.consumed) {
      return "already_used";
    }

    if (Date.now() >= stored.challenge.expiresAt) {
      return "expired";
    }

    // Synchronous operation prevents duplicate consumption
    // within this Node.js process.
    stored.consumed = true;

    return "valid";
  }

  /**
   * Remove expired or consumed challenges.
   */
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

  /**
   * Return the number of stored challenges.
   */
  get size(): number {
    return this.challenges.size;
  }
}
