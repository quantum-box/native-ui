# TACHYON native client

React + Vite frontend shared by the Web, Tauri desktop, Android, and iOS targets.

## Commands

Run commands from the repository root:

```bash
pnpm dev:web
pnpm build:web
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
