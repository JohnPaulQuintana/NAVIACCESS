import type { ChallengeStore } from "./challenge-store.js";

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
  challengeStore: ChallengeStore;
}

export interface AccessVerificationResult {
  authorized: boolean;
  reason: string;
}

export async function verifyAccess(
  options: AccessVerificationOptions,
): Promise<AccessVerificationResult> {
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

  // Step 3: Atomically validate and consume the challenge.
  const consumeResult = await challengeStore.consume(
    challengeId,
    nonce,
  );

  if (consumeResult !== "valid") {
    const reasons = {
      not_found: "Challenge not found.",
      expired: "Challenge expired.",
      already_used: "Challenge already used.",
      nonce_mismatch: "Challenge nonce does not match.",
    } as const;

    return {
      authorized: false,
      reason: reasons[consumeResult],
    };
  }

  return {
    authorized: true,
    reason: "NaviAccess request authorized.",
  };
}