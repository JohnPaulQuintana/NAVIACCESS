import { generateClientRepresentation } from "./representation.js";
import { signClientRequest } from "./request-signer.js";

export interface NaviAccessClientOptions {
  keyword: string;
  privateKey: string;
}

export interface NaviAccessSignOptions {
  method: string;
  path: string;
  body: string;
  challenge: {
    id: string;
    nonce: string;
  };
}

export interface NaviAccessSignedRequest {
  challengeId: string;
  nonce: string;
  representation: string;
  signature: string;
  headers: Record<string, string>;
}

export interface NaviAccessClient {
  sign(options: NaviAccessSignOptions): Promise<NaviAccessSignedRequest>;
}

export function createNaviAccessClient(
  options: NaviAccessClientOptions,
): NaviAccessClient {
  const { keyword, privateKey } = options;

  if (!keyword.trim() || !privateKey.trim()) {
    throw new Error("NaviAccess client configuration is incomplete.");
  }

  return {
    async sign(requestOptions) {
      const representation = generateClientRepresentation({
        keyword,
      });

      const signed = await signClientRequest({
        method: requestOptions.method,
        path: requestOptions.path,
        body: requestOptions.body,
        challengeId: requestOptions.challenge.id,
        nonce: requestOptions.challenge.nonce,
        representation: representation.value,
        privateKey,
      });

      return {
        challengeId: requestOptions.challenge.id,
        nonce: requestOptions.challenge.nonce,
        representation: representation.value,
        signature: signed.signature,

        headers: {
          "X-NaviAccess-Challenge": requestOptions.challenge.id,
          "X-NaviAccess-Nonce": requestOptions.challenge.nonce,
          "X-NaviAccess-Representation": representation.value,
          "X-NaviAccess-Signature": signed.signature,
        },
      };
    },
  };
}
