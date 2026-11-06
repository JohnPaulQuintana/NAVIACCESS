
# NaviAccess

Dynamic request verification and replay protection for web applications and APIs.

NaviAccess is a security protocol and SDK designed to verify signed HTTP requests using Ed25519 cryptography, one-time challenges, and replay protection.

## Features

- Ed25519 request signing and verification
- Dynamic request representations
- Server-issued one-time challenges
- Replay attack prevention
- Browser client SDK
- Express middleware integration
- Firestore-backed challenge storage
- Pluggable challenge storage providers
- TypeScript support

## Installation

```bash
npm install naviaccess
```

For Express integration:

```bash
npm install express
```

For Firebase Firestore integration:

```bash
npm install firebase-admin
```

## Package Entry Points

| Import | Description |
|---|---|
| `naviaccess` | Core signing and verification |
| `naviaccess/client` | Browser-side signing SDK |
| `naviaccess/express` | Express middleware |
| `naviaccess/firebase` | Firebase Firestore challenge storage |

## Firebase Integration

NaviAccess supports Firestore as a shared challenge store.

This allows multiple backend instances to use the same challenge records and provides atomic challenge consumption through Firestore transactions.

### 1. Initialize Firebase Admin

Initialize Firebase Admin in your backend application.

```typescript
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
});

const firestore = getFirestore();
```

Configure your Firebase credentials using your server environment or the Google Application Default Credentials mechanism.

Never expose Firebase Admin credentials in browser applications or commit service account credentials to your repository.

### 2. Create the Challenge Store

```typescript
import { FirestoreChallengeStore } from "naviaccess/firebase";

const challengeStore = new FirestoreChallengeStore(firestore);
```

By default, NaviAccess uses the Firestore collection:

`naviaccess_challenges`

You can provide a custom collection name:

```typescript
const challengeStore = new FirestoreChallengeStore(
  firestore,
  "my_custom_challenges",
);
```

### 3. Use the Challenge Store

Pass the Firestore store to your challenge generation and verification workflow.

```typescript
import {
  generateChallenge,
  verifyAccess,
} from "naviaccess";

const challenge = generateChallenge();

await challengeStore.save(challenge);

// Use the challenge ID and nonce in your client request.
// After receiving the signed request, verify it using verifyAccess().
```

Pass the same shared store to every backend instance that verifies requests for the same challenge collection.

### 4. Firestore TTL Configuration

NaviAccess stores a `ttlAt` timestamp alongside each challenge.

To enable automatic cleanup:

1. Open Firebase Console.
2. Navigate to Firestore Database.
3. Open the TTL policies section.
4. Create a TTL policy for the `naviaccess_challenges` collection group.
5. Set the timestamp field to `ttlAt`.

TTL deletion is asynchronous. NaviAccess independently checks challenge expiration during verification, so TTL cleanup is not responsible for authorization or replay prevention.

## Express Integration

NaviAccess provides an Express middleware adapter.

```typescript
import { naviAccess } from "naviaccess/express";

app.post(
  "/api/withdrawals",
  naviAccess({
    keyword: process.env.NAVIACCESS_KEYWORD!,
    challengeStore,

    getPublicKey: async (request) => {
      // Resolve the trusted public key for this client.
      return await getTrustedClientPublicKey(request);
    },

    getBody: (request) => {
      // Return the exact body representation used during signing.
      return JSON.stringify(request.body);
    },
  }),
  withdrawalHandler,
);
```

The example assumes that `getTrustedClientPublicKey` is implemented by your application.

Ensure that the body serialization used by the server exactly matches the serialization used when signing the request.

## Security Notice

NaviAccess uses Ed25519 signatures to authenticate requests. The server must maintain a trusted association between clients and their public keys.

Dynamic representations provide additional request variation but are not authentication credentials or standalone secrets.

Browser applications must protect private keys appropriately. A private key embedded in frontend source code must be considered exposed. Non-extractable browser keys reduce key-export risk but do not protect against same-origin malicious scripts.

The included in-memory challenge store is intended for development and single-process use.

For production deployments with multiple server instances, use a shared atomic challenge store such as Firestore.

Firestore transactions ensure that a challenge can only be successfully consumed once across instances sharing the same database.

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT

## Documentation

- [Developer Usage Guide](docs/USAGE.md)
- [Integration Validation and Security Documentation](docs/VALIDATION.md)