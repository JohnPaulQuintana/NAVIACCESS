import type { InMemoryChallengeStore } from "./challenge-store.js";

import { validateRepresentation } from "./validator.js";
import { verifyRequest } from "./request-verifier.js";

export interface AccessVerificationOptions {
  method: string;
  path: string;
  body: string;
  challengeId: string;
  nonce: string;
  representation: string;
  signature: string;
  publicKey: string;
  keyword: string;
  challengeStore: InMemoryChallengeStore;
}

export interface AccessVerificationResult {
  authorized: boolean;
  reason: string;
}

export function verifyAccess(
  options: AccessVerificationOptions,
): AccessVerificationResult {
  const {
    method,
    path,
    body,
    challengeId,
    nonce,
    representation,
    signature,
    publicKey,
    keyword,
    challengeStore,
  } = options;

  // Step 1: Validate the shuffled representation.
  const representationResult = validateRepresentation({
    representation,
    keyword,
  });

  if (!representationResult.valid) {
    return {
      authorized: false,
      reason: representationResult.reason,
    };
  }

  // Step 2: Verify the digital signature.
  const signatureResult = verifyRequest({
    method,
    path,
    body,
    challengeId,
    nonce,
    representation,
    signature,
    publicKey,
  });

  if (!signatureResult.valid) {
    return {
      authorized: false,
      reason: signatureResult.reason,
    };
  }

  // Step 3: Check that the challenge matches.
  const challenge = challengeStore.get(challengeId);

  if (!challenge) {
    return {
      authorized: false,
      reason: "Challenge not found.",
    };
  }

  if (challenge.nonce !== nonce) {
    return {
      authorized: false,
      reason: "Challenge nonce does not match.",
    };
  }

  // Step 4: Consume the challenge exactly once.
  const consumeResult = challengeStore.consume(challengeId);

  if (consumeResult !== "valid") {
    return {
      authorized: false,
      reason: `Challenge ${consumeResult}.`,
    };
  }

  return {
    authorized: true,
    reason: "NaviAccess request authorized.",
  };
}