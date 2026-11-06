import { sign, createPrivateKey } from "node:crypto";

export interface RequestSignatureOptions {
  method: string;
  path: string;
  body: string;
  challengeId: string;
  nonce: string;
  representation: string;
  privateKey: string;
}

export interface SignedRequest {
  signature: string;
  signedPayload: string;
}

export function signRequest(options: RequestSignatureOptions): SignedRequest {
  const { method, path, body, challengeId, nonce, privateKey, representation } = options;

  if (!method.trim() || !path.trim() || !challengeId.trim() || !nonce.trim() || !representation.trim()) {
    throw new Error("Missing required request-signing fields.");
  }

  const normalizedMethod = method.toUpperCase();

  const signedPayload = [normalizedMethod, path, body, challengeId, nonce, representation].join(
    "\n",
  );

  const key = createPrivateKey(privateKey);

  const signature = sign(
    null,
    Buffer.from(signedPayload, "utf8"),
    key,
  ).toString("base64");

  return {
    signature,
    signedPayload,
  };
}
