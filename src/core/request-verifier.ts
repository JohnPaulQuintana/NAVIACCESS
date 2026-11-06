import { createPublicKey, verify } from "node:crypto";

export interface RequestVerificationOptions {
  method: string;
  path: string;
  body: string;
  challengeId: string;
  nonce: string;
  signature: string;
  representation: string;
  publicKey: string;
}

export interface RequestVerificationResult {
  valid: boolean;
  reason: string;
}

export function verifyRequest(
  options: RequestVerificationOptions,
): RequestVerificationResult {
  const { method, path, body, challengeId, nonce, signature, representation, publicKey } =
    options;

  if (
    !method.trim() ||
    !path.trim() ||
    !challengeId.trim() ||
    !nonce.trim() ||
    !signature.trim() ||
    !representation.trim() ||
    !publicKey.trim()
  ) {
    return {
      valid: false,
      reason: "Missing required verification fields.",
    };
  }

  try {
    const signedPayload = [
      method.toUpperCase(),
      path,
      body,
      challengeId,
      nonce,
      representation
    ].join("\n");

    const key = createPublicKey(publicKey);

    const isValid = verify(
      null,
      Buffer.from(signedPayload, "utf8"),
      key,
      Buffer.from(signature, "base64"),
    );

    return {
      valid: isValid,
      reason: isValid
        ? "Request signature is valid."
        : "Request signature is invalid.",
    };
  } catch {
    return {
      valid: false,
      reason: "Unable to verify request signature.",
    };
  }
}
