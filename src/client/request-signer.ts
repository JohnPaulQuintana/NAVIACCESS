import { createRequestPayload } from "../core/request-payload.js";

export interface ClientSignatureOptions {
  method: string;
  path: string;
  body: string;
  challengeId: string;
  nonce: string;
  representation: string;
  privateKey: CryptoKey;
}

export interface ClientSignedRequest {
  signature: string;
  signedPayload: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export async function signClientRequest(
  options: ClientSignatureOptions,
): Promise<ClientSignedRequest> {
  const {
    method,
    path,
    body,
    challengeId,
    nonce,
    representation,
    privateKey,
  } = options;

  if (
    !method.trim() ||
    !path.trim() ||
    !challengeId.trim() ||
    !nonce.trim() ||
    !representation.trim()
  ) {
    throw new Error("Missing required request-signing fields.");
  }

  if (
    !(privateKey instanceof CryptoKey) ||
    privateKey.type !== "private" ||
    privateKey.algorithm.name !== "Ed25519" ||
    !privateKey.usages.includes("sign")
  ) {
    throw new Error("Invalid Ed25519 private key.");
  }

  const signedPayload = createRequestPayload({
    method,
    path,
    body,
    challengeId,
    nonce,
    representation,
  });

  const signature = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    new TextEncoder().encode(signedPayload),
  );

  return {
    signature: arrayBufferToBase64(signature),
    signedPayload,
  };
}