export interface ClientSignatureOptions {
  method: string;
  path: string;
  body: string;
  challengeId: string;
  nonce: string;
  representation: string;
  privateKey: string;
}

export interface ClientSignedRequest {
  signature: string;
  signedPayload: string;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binary = atob(base64);
  const bytes = Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0),
  );

  return bytes.buffer;
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
    !representation.trim() ||
    !privateKey.trim()
  ) {
    throw new Error("Missing required request-signing fields.");
  }

  const signedPayload = [
    method.toUpperCase(),
    path,
    body,
    challengeId,
    nonce,
    representation,
  ].join("\n");

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "Ed25519" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "Ed25519",
    key,
    new TextEncoder().encode(signedPayload),
  );

  return {
    signature: arrayBufferToBase64(signature),
    signedPayload,
  };
}