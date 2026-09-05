# Private Gather Native 1.1.200 — GitHub Recovery Candidate

Prepared 2026-09-05 from the last green GitHub `main` commit (`e95a2815c8410a7261b11ee7f32c7813b42aab82`).

This recovery branch exists to restore the GitHub-first development workflow after local source trees diverged during device testing. It carries the 1.1.200 version truth and the 1.1.200 device-test fixes while preserving the CI repairs already proven on `main`.

## Recovery rules
- GitHub `Native Validate` is the compile/typecheck/prebuild gate.
- Do not promote or package this branch as accepted until Android, iOS-prebuild and public-safety jobs all pass.
- Do not use the prior local Rev3/Rev4 trees as the authoritative source.
- Real-device acceptance is still required after GitHub validation.

## 1.1.200 fixes retained
- authenticated wall/feed media with a fresh v200 cache;
- native verification routing;
- native Like/Dislike launcher icons;
- incoming call Answer/Decline state retention;
- less-cropped local camera preview and filled self PiP;
- retry-safe WebRTC signal consumption;
- late receiver synchronization and remote-video recovery.

## Backend pairing
The matching website boundary remains Private Gather 1.1.199 -> 1.1.200. No additional Laravel delta is required for this recovery branch.
