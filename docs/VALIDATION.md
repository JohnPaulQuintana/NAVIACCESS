NaviAccess v0.1.0
Integration Validation and Security Documentation
Project: NaviAccess
Version: 0.1.0
Validation date: November 6, 2026
Status: Integration validation completed
Publication status: Not published to npm

1. Overview
NaviAccess is a TypeScript SDK for verifying signed HTTP requests and preventing request replay attacks.
It uses:
Ed25519 digital signatures.
Server-issued, one-time challenges.
Nonce validation.
Request representation verification.
Atomic challenge consumption.
Pluggable challenge storage providers.
The objective of this validation was to verify that NaviAccess works beyond isolated unit tests, including installation and integration into a separate application.
2. Architecture
The request verification process follows this sequence:
The client requests a challenge from the backend.
The backend generates a challenge with an expiration time and unique identifier.
The client constructs the request representation.
The client signs the request payload using its Ed25519 private key.
The client sends the signed request and verification metadata.
The backend retrieves the trusted public key associated with the client.
NaviAccess reconstructs the request payload and verifies the signature.
The backend validates the challenge and nonce.
The challenge is atomically consumed to prevent reuse.
The application processes the request only after successful verification.
Request signature payload
The request payload uses a deterministic JSON representation containing:
HTTP method
Request path
Request body
Challenge ID
Nonce
Request representation
The HTTP method is normalized to uppercase before serialization.
A shared payload serializer ensures that the client signer and server verifier use the same format.
3. Implementation Components
Component
Purpose
Ed25519 signer
Signs outgoing requests
Request verifier
Validates request signatures
Request payload serializer
Produces deterministic signing input
Challenge generator
Creates one-time challenges
Challenge validator
Validates challenge expiration and metadata
InMemoryChallengeStore
Stores challenges in process memory
FirestoreChallengeStore
Stores and consumes challenges using Firestore
Browser client SDK
Provides browser-side request signing
Express middleware
Integrates verification into Express applications
Firebase adapter
Supports Firebase-related integration

4. Validation Environment
Validation was performed using a separate consumer project rather than relying exclusively on the NaviAccess source repository.
Package project: NAVIACCESS
Consumer project: naviaccess-install-test
Environment:
Node.js
TypeScript
Express
Firebase Admin SDK
Firebase Firestore Emulator
Vitest
Windows development environment
Two independent Node.js server processes for cross-process concurrency testing
The consumer project was used to validate package imports and application-level integration.
5. Validation Results
5.1 Build and unit tests
Commands:
npm run build
npm test
Result: PASSED
The TypeScript build completed successfully, and the existing automated test suite passed.
5.2 Package installation and exports
The package was installed and imported in the separate consumer project.
Validated entry points:
import ... from "naviaccess";
import ... from "naviaccess/client";
import ... from "naviaccess/express";
import ... from "naviaccess/firebase";
Result: PASSED
This confirms that the tested package build and its configured export paths could be consumed by a separate application.
5.3 Request signature verification
The request verifier tests covered:
Valid signed request.
Modified request body.
Modified HTTP method.
Modified request path.
Modified challenge ID.
Modified nonce.
Modified request representation.
Signature generated using a different key pair.
Missing verification fields.
Result: PASSED
Modified or incomplete verification inputs were rejected.
5.4 Challenge expiration
Challenge expiration was tested through:
In-memory challenge validation.
Firestore adapter tests.
End-to-end verifyAccess validation.
The challenge generator also enforces its configured expiration range of 1–300 seconds.
Result: PASSED
5.5 Express integration and replay protection
The consumer application integrated NaviAccess with Express.
Observed results:
Request
HTTP status
Result
First valid request
200
Accepted
Replayed request
401
Rejected

Replay response:
{
  "message": "Challenge already used."
}
Result: PASSED
5.6 Concurrent request validation
Ten concurrent requests attempted to consume the same challenge using the in-memory implementation.
Observed results:
Metric
Result
Total requests
10
Accepted
1
Rejected
9

Result: PASSED
5.7 Firestore concurrency validation
The Firestore Challenge Store was tested using the Firestore Emulator.
Ten concurrent requests attempted to use the same challenge.
Observed results:
Metric
Result
Total requests
10
Accepted
1
Rejected
9

Result: PASSED
This provided evidence that the emulator-backed transaction implementation rejected concurrent reuse of the same challenge.
5.8 Cross-process replay protection
Two independent Node.js server processes were started:
Server 1: port 3003
Server 2: port 3004
Both used the same Firestore Emulator collection.
Ten concurrent requests across the two processes attempted to consume the same challenge.
Observed result:
One request was accepted.
Nine requests were rejected.
Result: PASSED
This demonstrates cross-process replay rejection in the tested Firestore Emulator environment.
5.9 Package archive validation
Command:
npm pack --dry-run
Observed package information:
Metric
Result
Package
naviaccess
Version
0.1.0
Files
71
Compressed size
16.0 kB
Unpacked size
66.6 kB

The archive preview included:
README.md
LICENSE
package.json
Compiled JavaScript
TypeScript declaration files
Source maps
Test files and development-only source files were not included in the package archive.
Result: PASSED
This validated the package contents in a dry run. It did not publish the package.
6. Security Design and Important Considerations
6.1 Ed25519 signatures
Ed25519 provides cryptographic request authentication and integrity verification.
A valid signature establishes that the signed payload was produced using the private key corresponding to the public key used for verification.
It does not independently establish that a user is authorized to perform the requested application action. Application authorization must still be enforced separately.
6.2 Trusted public-key management
Production applications must resolve public keys from a trusted server-side client registry.
Do not trust a public key supplied directly by the incoming request as the authority for verifying that same request.
The backend must associate the client identity with its registered public key.
6.3 One-time challenges
A challenge must only be accepted once.
The challenge store must support atomic consumption to prevent multiple requests from successfully consuming the same challenge.
The in-memory implementation is intended for single-process scenarios.
For multi-instance or distributed deployments, use a shared storage provider with appropriate atomic operations.
6.4 Firestore transactions
The Firestore implementation uses transactions to protect challenge consumption.
The Firestore Emulator concurrency tests passed, including tests involving two independent server processes.
However, emulator validation is not a substitute for production Firestore deployment testing, operational monitoring, or infrastructure review.
6.5 Browser private keys
Browser-side private keys should be protected using appropriate Web Crypto capabilities.
Non-extractable CryptoKey objects reduce direct private-key extraction risk.
However, they do not prevent malicious same-origin JavaScript, including XSS, from invoking signing operations.
Frontend applications must still implement strong XSS protections and secure deployment practices.
A private key embedded in a frontend bundle must not be treated as secret.
6.6 Request body consistency
The body verified by the backend must match the exact body string used when signing the request.
For Express applications using JSON parsing, capture the raw body before parsing:
app.use(
  express.json({
    verify: (request, _response, buffer) => {
      request.rawBody = buffer.toString("utf8");
    },
  }),
);
The consumer application should provide the captured raw body to the verification middleware.
Differences in body serialization can cause legitimate signatures to fail verification.
6.7 Challenge expiration and cleanup
Challenge expiration must be enforced during verification and consumption.
Firestore TTL cleanup is asynchronous and should only be treated as storage cleanup, not as the security mechanism responsible for rejecting expired challenges.
7. Known Limitations
The following limitations should be considered before production deployment:
InMemoryChallengeStore is not suitable for shared replay protection across multiple independent server processes.
Firestore Emulator results do not guarantee identical behavior under every production deployment condition.
Browser-side signing does not protect against malicious same-origin scripts invoking the signing operation.
The backend must maintain a trusted public-key registry.
The application must ensure that the raw request body used for verification matches the signed body.
Application authorization, authentication, rate limiting, and transport security remain the responsibility of the integrating application.
Production Firestore credentials and Firebase Admin SDK credentials must remain server-side.
The current validation does not constitute an independent cryptographic audit or penetration test.
8. Validation Summary
Validation area
Status
TypeScript build
PASSED
Unit test suite
PASSED
Package installation
PASSED
Package exports
PASSED
Signature verification
PASSED
Request tampering detection
PASSED
Challenge expiration
PASSED
Express integration
PASSED
In-memory replay protection
PASSED
Firestore replay protection
PASSED
Cross-process replay protection
PASSED
Package archive dry run
PASSED
npm publication
NOT PERFORMED

9. Release Status
NaviAccess v0.1.0 has completed the documented local integration and validation checks.
The package has not been published to the npm registry.
The current validation establishes that the tested implementation works in the tested consumer application and emulator environment. It does not claim that the package has undergone a formal security audit or production-scale deployment validation.
Recommended next milestone: Use NaviAccess in an actual application with a trusted server-side client registry and production-configured challenge storage, then document the integration results separately.

End of document

