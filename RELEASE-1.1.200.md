# Private Gather Native 1.1.200 — Authoritative GitHub Rebuild

Prepared from authoritative `main` head `bcb7317418151a6faeab655d7696f9db3145fd54` under `AI-WORKFLOW.md`.

## Purpose
This candidate replaces the abandoned local Rev3/Rev4 path and the non-authoritative recovery branch. It is rebuilt from current GitHub `main` and must pass a fresh `Native Validate` run on its exact commit before handoff.

## Changes
- native version truth advanced consistently to 1.1.200;
- direct Expo peer dependencies added for `expo-font` and `expo-asset` to address Expo Doctor native-module warnings;
- authenticated media cache namespace advanced to v200;
- Home Like/Dislike launchers use native thumb icons while preserving alternate reaction emoji;
- Home comment style array uses a React Native-safe false branch;
- incoming call state is preserved until explicit answer/decline transition;
- video-call self preview prefers a wider camera field of view and uses `contain` for large preview / `cover` for PiP;
- WebRTC signal IDs are marked consumed only after successful handling so HTTP fallback can retry transient realtime failures;
- late WebRTC receivers are synchronized into the remote render stream with bounded remote-video recovery;
- readiness gate now enforces 1.1.200 version truth, direct Expo peer dependency lock metadata, the Home text-rendering regression guard, and call retry/receiver guards;
- versioned backup screen files remain excluded from TypeScript compilation.

## Protected areas touched
`App.tsx` and `src/calls/CallManager.ts` are regression-sensitive. They are changed only for incoming-call state retention and the bounded WebRTC media/signaling reliability fixes above. Full Android and iOS GitHub gates are mandatory before this candidate can become GitHub validated.

## Backend boundary
No new Laravel delta is introduced by this native rebuild. The native repository does not establish Laravel authority; backend changes still require separate authoritative Laravel retrieval.

## Status
Prepared candidate only. Not GitHub validated, not device tested, not confirmed live.
