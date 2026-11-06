import { randomBytes, randomUUID } from "node:crypto";

export interface ChallengeOptions {
  expiresInSeconds?: number;
}

export interface GeneratedChallenge {
  id: string;
  nonce: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Generate a cryptographically random challenge.
 */
export function generateChallenge(
  options: ChallengeOptions = {},
): GeneratedChallenge {
  const { expiresInSeconds = 60 } = options;

  if (
    !Number.isInteger(expiresInSeconds) ||
    expiresInSeconds < 1 ||
    expiresInSeconds > 300
  ) {
    throw new Error("Challenge expiration must be between 1 and 300 seconds.");
  }

  const now = Date.now();

  return {
    id: randomUUID(),
    nonce: randomBytes(32).toString("hex"),
    createdAt: now,
    expiresAt: now + expiresInSeconds * 1000,
  };
}
