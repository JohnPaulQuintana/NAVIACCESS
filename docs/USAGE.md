# NaviAccess — Developer Usage Guide

**Version:** 0.1.0  
**Package:** `naviaccess`  
**Purpose:** HTTP request signature verification and replay attack prevention

---

# 1. Introduction

NaviAccess is a TypeScript SDK that helps applications verify signed HTTP requests and prevent replay attacks.

It uses:

- Ed25519 digital signatures
- Server-issued one-time challenges
- Cryptographic nonces
- Request payload verification
- Challenge expiration
- Replay protection through challenge consumption

NaviAccess is designed to integrate into existing backend applications without requiring developers to replace their existing authentication or authorization systems.

## How it works

The general request flow is:

1. The client requests a challenge from the backend.
2. The backend generates and stores a one-time challenge.
3. The backend returns the challenge ID and nonce.
4. The client creates a signed request payload.
5. The client signs the payload using its private key.
6. The client sends the signed request to the backend.
7. NaviAccess verifies the signature and request data.
8. NaviAccess validates and consumes the challenge.
9. The application processes the request if verification succeeds.

**Important:** NaviAccess does not replace user authentication, authorization, or HTTPS. It adds request integrity verification and replay protection.

# 2. Requirements

Recommended environment:

- Node.js
- TypeScript
- A backend application capable of running Node.js
- An Ed25519-compatible cryptographic environment
- A challenge storage provider

For browser integrations, the client environment must support the Web Crypto API features used by NaviAccess.

For Express integrations, an Express-compatible backend is required.

# 3. Installation

Install NaviAccess into your application:

```bash
npm install naviaccess
```

Install the dependencies required by the integration you choose.

For an Express application:

```bash
npm install express
npm install -D @types/express
```

For Firebase integration:

```bash
npm install firebase-admin
```

**Note:** NaviAccess v0.1.0 has been tested through local package installation in a separate consumer application. It has not been published to the npm registry. The installation command above applies when the package is available through a registry or an appropriate private/local package distribution.

# 4. Choose a Challenge Storage Provider

NaviAccess supports different challenge storage approaches.

## Option A: In-memory storage

Use this for local development, testing, or a single-process application.

```ts
import { InMemoryChallengeStore } from "naviaccess";
```

Example:

```ts
const challengeStore = new InMemoryChallengeStore();
```

Advantages:

- No external database required.
- Simple configuration.
- Fast local operations.

Limitations:

- Challenges are lost when the process restarts.
- Separate application processes do not share challenge state.
- Not suitable for distributed deployments requiring shared replay protection.

## Option B: Firestore storage

Use this when your application already uses Firebase or needs a shared challenge store.

The application developer must configure their own Firebase project.

### Step 1: Create a Firebase project

1. Open the Firebase Console.
2. Create a project.
3. Enable Cloud Firestore.
4. Create the required Firestore database.

### Step 2: Configure Firebase Admin SDK

Install Firebase Admin:

```bash
npm install firebase-admin
```

Initialize Firebase Admin on your backend:

```ts
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseApp = initializeApp({
  credential: applicationDefault(),
});

const firestore = getFirestore(firebaseApp);
```

Use Application Default Credentials or another supported secure server-side credential mechanism.

Never expose service account credentials in frontend code.

### Step 3: Configure NaviAccess

Example adapter initialization:

```ts
import { FirestoreChallengeStore } from "naviaccess/firebase";

const challengeStore = new FirestoreChallengeStore({
  firestore,
  collectionName: "naviaccess_challenges",
});
```

This is an illustrative configuration example. Confirm the constructor signature against the installed v0.1.0 adapter implementation.

### Step 4: Configure Firestore TTL

The Firestore adapter stores a `ttlAt` timestamp for expired challenge cleanup.

Configure Firestore TTL policies for the corresponding field if you want automatic cleanup.

Firestore TTL deletion is asynchronous. NaviAccess must still enforce challenge expiration during verification and consumption.

## Option C: Custom storage provider

You can implement your own challenge storage using:

- PostgreSQL
- Redis
- MySQL
- MongoDB
- Another database or storage system

Implement the `ChallengeStore` interface.

The interface contract is:

```ts
export interface ChallengeStore {
  save(
    challenge: GeneratedChallenge
  ): void | Promise<void>;

  get(
    id: string
  ): GeneratedChallenge | undefined |
     Promise<GeneratedChallenge | undefined>;

  consume(
    id: string,
    expectedNonce: string
  ): ChallengeConsumeResult |
     Promise<ChallengeConsumeResult>;
}
```

The `consume` operation must be atomic.

A challenge must never be successfully consumed more than once, even when multiple requests arrive concurrently.

# 5. Generate Client Keys

NaviAccess uses Ed25519 public/private key pairs.

Generate a key pair using the package's key-generation utility:

```ts
import { generateKeyPair } from "naviaccess";

const keys = generateKeyPair();
```

The private key is used by the client to sign requests.

The public key is registered with the backend and used to verify signatures.

## Key management rules

- Keep private keys protected.
- Never expose backend service credentials.
- Register public keys in a trusted server-side registry.
- Do not trust arbitrary public keys supplied by incoming requests.
- Never embed a shared private key in a public frontend bundle.
- Provide a key rotation and revocation strategy for production applications.

For browser applications, prefer non-extractable Web Crypto keys where supported by the implementation.

Non-extractable keys do not prevent malicious same-origin JavaScript from invoking signing operations.

# 6. Backend Integration with Express

NaviAccess provides Express middleware for protecting application routes.

## Step 1: Initialize Express

```ts
import express from "express";

const app = express();
```

## Step 2: Capture the raw request body

The exact body string used for signing must match the body string verified by the backend.

Capture the raw body before JSON parsing:

```ts
app.use(
  express.json({
    verify: (request, _response, buffer) => {
      request.rawBody = buffer.toString("utf8");
    },
  }),
);
```

Add a TypeScript declaration:

```ts
import "express";

declare module "express" {
  interface Request {
    rawBody?: string;
  }
}
```

## Step 3: Configure the challenge store

Choose the storage provider appropriate for your deployment.

For example:

```ts
import { InMemoryChallengeStore } from "naviaccess";

const challengeStore = new InMemoryChallengeStore();
```

For multi-process or distributed applications, use a shared store with atomic consumption.

## Step 4: Configure the public-key resolver

Your backend should retrieve the public key associated with the authenticated client from a trusted registry.

Example:

```ts
async function getTrustedPublicKey(request: express.Request) {
  // Resolve the authenticated client identity.
  // Look up its registered public key in your database.
  // Return the trusted public key.
}
```

Do not retrieve the verification public key directly from an untrusted request header or body.

## Step 5: Register NaviAccess middleware

Example:

```ts
import { naviAccess } from "naviaccess/express";

app.post(
  "/api/withdrawals",
  naviAccess({
    keyword: process.env.NAVIACCESS_KEYWORD!,
    challengeStore,
    getPublicKey: getTrustedPublicKey,
    getBody: (request) => request.rawBody ?? "",
  }),
  (request, response) => {
    response.json({
      success: true,
      message: "Request verified successfully.",
    });
  },
);
```

The example uses the Express adapter options discussed for v0.1.0. Confirm the exact option types and return behavior against the installed package declarations.

# 7. Challenge Endpoint

Your application must provide an endpoint that issues challenges to clients.

The challenge endpoint should:

1. Authenticate or identify the client.
2. Generate a challenge.
3. Save it using the configured challenge store.
4. Return the challenge ID and nonce.

Example response:

```json
{
  "id": "challenge-uuid",
  "nonce": "cryptographically-random-nonce",
  "expiresAt": 1793980000000
}
```

The challenge generator supports an expiration between 1 and 300 seconds, with a default of 60 seconds.

Example:

```ts
import { generateChallenge } from "naviaccess";

const challenge = generateChallenge({
  expiresInSeconds: 60,
});

await challengeStore.save(challenge);
```

Your application is responsible for implementing the HTTP challenge endpoint and applying suitable authentication, rate limiting, and authorization policies.

# 8. Client Integration

The client must obtain a challenge before sending a protected request.

The general client workflow is:

1. Request a challenge.
2. Receive the challenge ID and nonce.
3. Construct the request payload.
4. Sign the payload using the registered client's private key.
5. Send the request with the NaviAccess verification headers.

The required verification headers are:

| Header | Purpose |
|---|---|
| `X-NaviAccess-Challenge` | Challenge ID |
| `X-NaviAccess-Nonce` | Challenge nonce |
| `X-NaviAccess-Representation` | Request representation |
| `X-NaviAccess-Signature` | Ed25519 signature |

Use the browser client entry point:

```ts
import ... from "naviaccess/client";
```

The exact client signer constructor and signing method should be taken from the exported v0.1.0 TypeScript declarations.

## Request payload format

The shared serializer creates a deterministic representation:

```ts
JSON.stringify([
  method.toUpperCase(),
  path,
  body,
  challengeId,
  nonce,
  representation,
]);
```

The client and backend must use identical values.

Important:

- Use the same HTTP method.
- Use the same request path.
- Use the exact body string.
- Use the same challenge ID.
- Use the same nonce.
- Use the same request representation.

Changing any signed value invalidates the signature.

# 9. Handling Verification Failures

A protected request should only proceed when NaviAccess verification succeeds.

Typical failure conditions include:

| Failure | Meaning |
|---|---|
| Missing headers | Required verification metadata was not provided |
| Invalid signature | Signature does not match the request |
| Unknown challenge | Challenge does not exist |
| Expired challenge | Challenge expiration has passed |
| Nonce mismatch | Supplied nonce does not match the stored challenge |
| Already used | Challenge has already been consumed |
| Invalid public key | Trusted verification key could not be resolved |

The Express integration should reject unauthorized requests instead of allowing them to reach protected application handlers.

Do not expose private cryptographic details or sensitive key material in error responses.

# 10. Security Guidelines

## HTTPS

Always use HTTPS in production.

NaviAccess does not replace TLS.

## Private-key protection

Private keys must remain protected.

Do not place server-side secrets in frontend environment variables or public JavaScript bundles.

## Trusted public-key registry

Maintain a server-side registry mapping client identities to trusted public keys.

## Challenge expiration

Keep challenge lifetimes reasonably short.

The default expiration is 60 seconds.

## Atomic challenge consumption

Use storage that supports atomic challenge consumption when deploying multiple backend processes.

## Request body consistency

Sign and verify the same raw request body.

Avoid independently serializing parsed JSON on the client and backend.

## Authentication and authorization

NaviAccess does not replace application authentication or authorization.

Continue validating user identity, permissions, and business rules.

## Rate limiting

Protect challenge-generation and verification endpoints against abuse.

## XSS protection

Browser signing does not eliminate XSS risks. Apply secure frontend development practices, content security policies, and appropriate input/output handling.

# 11. Troubleshooting

| Problem | Possible cause | Recommended action |
|---|---|---|
| Signature verification fails | Signed payload differs from verified payload | Compare all payload fields |
| Valid request rejected | Raw body mismatch | Capture and verify the raw body |
| Challenge not found | Challenge was not saved or wrong storage was used | Check challenge creation and storage |
| Challenge expired | Request arrived after expiration | Request a fresh challenge |
| Challenge already used | Request was replayed | Generate a new challenge |
| Concurrent requests fail | Challenge was consumed by another request | Obtain a new challenge for each operation |
| Firestore initialization fails | Incorrect Firebase credentials or configuration | Check backend Firebase configuration |
| Multiple servers accept duplicate requests | Challenge storage is not shared or consumption is not atomic | Use a shared atomic storage provider |

# 12. Recommended Deployment Architecture

For production deployments, use a shared challenge storage provider.

```text
                  CLIENT APPLICATION
                         |
                         |
                  Request Challenge
                         |
                         v
                  BACKEND APPLICATION
                         |
                  Generate Challenge
                         |
                         v
                  SHARED CHALLENGE STORE
                         |
                         |
                  Return Challenge
                         |
                         v
                  CLIENT SIGNS REQUEST
                         |
                         |
                  Send Signed Request
                         |
                         v
                  BACKEND VERIFICATION
                         |
                  Verify Ed25519 Signature
                         |
                  Validate Challenge
                         |
                  Atomic Challenge Consume
                         |
                  +------+------+
                  |             |
                VALID         INVALID
                  |             |
                  v             v
             Process API     Reject Request
                Request
```

The shared challenge store can be Firestore, Redis, PostgreSQL, or another implementation that satisfies the atomic storage contract.

# 13. Final Notes

NaviAccess is intended to be integrated into an existing application.

The application developer is responsible for:

- Configuring their own backend.
- Managing their own client keys.
- Registering trusted public keys.
- Providing a challenge endpoint.
- Selecting and configuring a challenge storage provider.
- Enforcing application authentication and authorization.
- Securing production infrastructure.

NaviAccess provides the request-signing and verification components.

**NaviAccess v0.1.0 — Developer Usage Guide**

For integration validation results and known limitations, see [VALIDATION.md](VALIDATION.md).