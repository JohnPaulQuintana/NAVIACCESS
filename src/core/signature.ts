import { generateKeyPairSync } from "node:crypto";

export interface NaviAccessKeyPair {
  publicKey: string;
  privateKey: string;
}

export function generateKeyPair(): NaviAccessKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");

  return {
    publicKey: publicKey.export({
      type: "spki",
      format: "pem",
    }),

    privateKey: privateKey.export({
      type: "pkcs8",
      format: "pem",
    }),
  };
}
