# TACHYON native client

React + Vite frontend shared by the Web, Tauri desktop, Android, and iOS targets.

## Commands

Run commands from the repository root:

```bash
pnpm dev:web
pnpm build:web
pnpm test
pnpm dev:desktop
pnpm build:desktop
```

Initialize each generated mobile project once on a host with the required SDK,
then run or build it:

```bash
pnpm init:android
pnpm dev:android
pnpm build:android

# macOS and Xcode are required for iOS.
pnpm init:ios
pnpm dev:ios
pnpm build:ios
```

The UI imports reusable primitives from the workspace root package. Runtime
differences belong under `src/platform`; route and feature components must not
call Tauri APIs directly.

## Authentication architecture

- Public OAuth metadata is compiled from `src/platform/auth/auth-config.ts`.
  The Cognito app client is public and uses Authorization Code + PKCE; there is
  no client secret.
- Web tokens, including the refresh token, remain in memory. Only the
  short-lived PKCE verifier/state transaction uses tab-scoped `sessionStorage`
  so it can survive the full-page redirect, and it is removed before exchange.
- Desktop/mobile refresh tokens and pending PKCE transactions use the native
  secure-storage plugin: OS keyring on desktop, iOS Keychain, and encrypted
  Android storage backed by Android Keystore. They never use Web storage.
- Native authentication opens Cognito in the system browser. Bundled apps use
  `tachyon-native://auth/callback`; desktop development forwards the registered
  `http://localhost:1420/callback` response into that deep link.

The OAuth callback is an authentication boundary only: it verifies state,
nonce, issuer, audience/client ID, signature, and token use before issuing the
in-memory session. Tachyon tenant membership, RBAC, and app access belong to the
independent authorization adapter/route guard. A denied protected resource is
rendered as a 403 and is not represented as a failed login (§4-10).
