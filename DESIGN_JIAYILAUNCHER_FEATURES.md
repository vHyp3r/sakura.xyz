# JiayiLauncher Feature Inventory & Mapping (initial)

Goal: reach feature parity with JiayiLauncher while keeping existing Sakura web features and enabling Windows desktop + Android apps.

1) Core features to replicate and prioritize
- Launcher UI: install/run/update flows, version selection, profiles
- Game discovery: list available builds, mirrors, metadata
- Installer: download, verify, extract, place files in user folder
- Updater: check remote versions, delta updates, auto-update installs
- Run integration: execute game with args, manage JVM/Bedrock runtime options
- Proxy / networking: optional proxy config for downloads/runtime
- Mod/pack management: import/export packs, apply patches
- Account sync: sync installs, preferences, uploads via Firebase
- Backup & restore: project backups, save user mods
- Settings & preferences: themes, paths, language
- Telemetry & logging: diagnostics, upload logs (opt-in)

2) Additional Sakura-specific features to keep/merge
- Web-based authentication and uploads (current web UI)
- Uploads metadata and download links (Firestore/Storage)
- Simple dashboard and links

3) Suggested implementation order (1-by-1)
1. Design: map Jiayi features to Sakura (this doc) — scope & wireframes.
2. Refactor web UI into reusable components (UI library folder `src/components/shared`).
3. Scaffold Electron (done) and wire renderer to shared components.
4. Implement Installer & Run flow in Electron main process (downloads, extraction, run IPC).
5. Add Updater (check, download, apply) and integrate into UI.
6. Implement Mod/Pack management UI + storage handling.
7. Integrate Account Sync across web/electron using Firebase (uploads, installs metadata).
8. Scaffold Android (React Native) using shared components where possible.
9. Packaging & CI: electron-builder for Windows, Fastlane/Play Console for Android.

4) Milestones & deliverables (per step)
- M1 (Design): feature map, data model (Firestore collections), UI wireframes.
- M2 (Shared UI): exported shared components + docs, examples in web and electron renderer.
- M3 (Installer): download manager, verified extraction, install list UI.
- M4 (Run/Update): process spawn, update installer, auto-update checks.
- M5 (Mod Manager): import/export packs, UI, storage integration.
- M6 (Sync & Packaging): cross-platform sync and build artifacts.

5) Risks & notes
- Native file operations and running executables require careful security (validate paths, avoid arbitrary exec from web).
- Electron bundle size and auto-update complexity — consider Squirrel/NSIS or built-in electron-updater.
- Android native launcher features require permissions and platform-specific handling for files.

Next actions I can take now (pick one):
- A: Start refactoring web UI into shared components (create `src/components/shared` and move small components).
- B: Implement Electron installer/run IPC and a minimal download+extract proof-of-concept.
- C: Inventory JiayiLauncher repo (clone and extract exact feature list/code references).

Choose A, B, or C and I will proceed with the next task.
