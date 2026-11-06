export interface ClientKeyPair {
  publicKey: string;
  privateKey: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function toPem(label: string, buffer: ArrayBuffer): string {
  const base64 = arrayBufferToBase64(buffer);
  const lines = base64.match(/.{1,64}/g) ?? [];

  return [`-----BEGIN ${label}-----`, ...lines, `-----END ${label}-----`].join(
    "\n",
  );
}

export async function generateClientKeyPair(): Promise<ClientKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "Ed25519",
    },
    true,
    ["sign", "verify"],
  );

  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: toPem("PUBLIC KEY", publicKey),
    privateKey: toPem("PRIVATE KEY", privateKey),
  };
}
