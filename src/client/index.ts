export { generateClientKeyPair } from "./key-generator.js";

export type { ClientKeyPair } from "./key-generator.js";

export { signClientRequest } from "./request-signer.js";

export type {
  ClientSignatureOptions,
  ClientSignedRequest,
} from "./request-signer.js";

export { generateClientRepresentation } from "./representation.js";

export type {
  ClientRepresentationOptions,
  ClientGeneratedRepresentation,
} from "./representation.js";

export { createNaviAccessClient } from "./naviaccess-client.js";

export type {
  NaviAccessClient,
  NaviAccessClientOptions,
  NaviAccessSignOptions,
  NaviAccessSignedRequest,
} from "./naviaccess-client.js";
