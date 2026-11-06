export const NAVIACCESS_VERSION = "0.1.0";

export { generateRepresentation } from "./core/representation.js";

export type {
  RepresentationOptions,
  GeneratedRepresentation,
} from "./core/representation.js";

export { validateRepresentation } from "./core/validator.js";

export type { ValidationOptions, ValidationResult } from "./core/validator.js";

export { generateChallenge } from "./core/challenge.js";

export type { ChallengeOptions, GeneratedChallenge } from "./core/challenge.js";

export { InMemoryChallengeStore } from "./core/challenge-store.js";

export type { ChallengeConsumeResult } from "./core/challenge-store.js";

export { generateKeyPair } from "./core/signature.js";

export type { NaviAccessKeyPair } from "./core/signature.js";

export { signRequest } from "./core/request-signer.js";

export type {
  RequestSignatureOptions,
  SignedRequest,
} from "./core/request-signer.js";

export { verifyRequest } from "./core/request-verifier.js";

export type {
  RequestVerificationOptions,
  RequestVerificationResult,
} from "./core/request-verifier.js";

export { verifyAccess } from "./core/access-verifier.js";

export type {
  AccessVerificationOptions,
  AccessVerificationResult,
} from "./core/access-verifier.js";

export { signClientRequest } from "./client/request-signer.js";

export type {
  ClientSignatureOptions,
  ClientSignedRequest,
} from "./client/request-signer.js";

export { generateClientKeyPair } from "./client/key-generator.js";

export type { ClientKeyPair } from "./client/key-generator.js";

export { generateClientRepresentation } from "./client/representation.js";

export type {
  ClientRepresentationOptions,
  ClientGeneratedRepresentation,
} from "./client/representation.js";
