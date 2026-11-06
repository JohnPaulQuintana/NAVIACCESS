export interface RequestPayloadOptions {
  method: string;
  path: string;
  body: string;
  challengeId: string;
  nonce: string;
  representation: string;
}

/**
 * Creates an unambiguous, deterministic payload for request signing.
 */
export function createRequestPayload(
  options: RequestPayloadOptions,
): string {
  return JSON.stringify([
    options.method.toUpperCase(),
    options.path,
    options.body,
    options.challengeId,
    options.nonce,
    options.representation,
  ]);
}