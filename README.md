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
- TypeScript support

## Installation

```bash
npm install naviaccess
```

If you are using the Express adapter:

```bash
npm install express
```

## Package Entry Points

| Import | Description |
|---|---|
| `naviaccess` | Core signing and verification |
| `naviaccess/client` | Browser-side signing SDK |
| `naviaccess/express` | Express middleware |

## Security Notice

NaviAccess uses Ed25519 signatures to authenticate requests. The server must maintain a trusted association between clients and their public keys.

Dynamic representations provide additional request variation but are not authentication credentials or standalone secrets.

Browser applications must protect private keys appropriately. A private key embedded in frontend source code must be considered exposed.

The included in-memory challenge store is intended for development and single-process use. Production deployments with multiple server instances should use a shared, atomic challenge store.

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT