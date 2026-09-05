# Private Gather — Master Handoff

**Role:** Cross-chat continuity record for Private Gather.  
**Read with:** `AI-WORKFLOW.md` and `RELEASE-STATE.json` before development.  
**Last refreshed:** 2026-09-05.

> This handoff records broad project state and durable rules. GitHub is the source of truth for native source/test state. The current Laravel/backend source must be retrieved separately before backend changes.

---

## 1. Current authoritative native state

### Repository
- Repository: `afterburn25/private-gather-APP`
- Default/authoritative branch: `main`
- Repository is public.
- Current native package version in `package.json`: **1.1.199**

### Current GitHub-validated source baseline
- Validated source commit: `e95a2815c8410a7261b11ee7f32c7813b42aab82`
- Commit title: **Establish GitHub native validation gate**
- Status: **GitHub-validated candidate**
- This is not automatically the confirmed-live or device-tested baseline.

### Validation evidence
- Workflow: **Native Validate**
- Run ID: **33973554381**
- Run number: **12**
- Conclusion: **success**
- Exact head SHA: `e95a2815c8410a7261b11ee7f32c7813b42aab82`
- `public-safety`: success
- `android`: success
- `ios-prebuild`: success
- Android artifact: `private-gather-android-debug`
- Artifact ID: `9971835782`
- GitHub artifact ZIP SHA-256: `3ef5e8fe40a24944b4af6951d0bcf918b40b53adba81a0617a685f30ac7a00e3`

The Android job performs exact dependency install, readiness, TypeScript, Expo config, Android prebuild, Kotlin compile, `assembleDebug`, and artifact upload. The iOS job performs exact dependency install, readiness, TypeScript, iOS prebuild, CocoaPods, and Xcode workspace verification.

**Rule:** A future source change requires a fresh successful run on that exact new commit. Do not reuse Run 12 to validate later source.

---

## 2. Native architecture to preserve

Private Gather native is a real React Native/Expo application rather than a WebView wrapper.

Current core stack includes:
- Expo SDK 57
- React Native 0.86.3
- TypeScript
- bearer-token native API
- Laravel Reverb realtime
- WebRTC via `react-native-webrtc`
- native calling seams using `react-native-callkeep`
- iOS VoIP push integration seam using `react-native-voip-push-notification`
- Expo/native notifications
- Expo Updates / controlled Private Gather release policy
- secure keychain-backed installation/session handling
- stable call identity mapping
- native navigation
- production build/readiness scripts
- GitHub Actions validation

Bundle/application ID historically used for the native product: `com.privoralabs.privategather`

Do not replace working transport/auth/update foundations merely to restyle screens.

---

## 3. Product direction

Approved native/web brand direction:
- dark midnight/black base
- premium neon pink → violet → cyan accents
- heart + lock Private Gather brand mark
- premium/privacy-first visual identity
- tagline: **Real People. Private Moments.**

Native product direction:
- Home
- Discover
- Messages
- Events
- Profile
- Notifications
- Clubs
- member/event/club detail
- fullscreen voice/video calling
- privacy/safety-first settings

The native app should become the best version of Private Gather, not merely duplicate the website.

---

## 4. Working systems / protected behavior

Treat these as regression-sensitive:
- authentication/session foundation
- native API contracts
- privacy-safe API payloads
- Reverb realtime
- message/typing/read/reaction realtime behavior
- WebRTC call signaling/media path
- stable call UUID mapping
- CallKeep/CallKit/ConnectionService integration seams
- APNs/PushKit/FCM push architecture
- staged native update architecture
- working web/PWA call transport
- production endpoint independence from local Metro

When a request does not require touching one of these systems, avoid rewriting it.

---

## 5. Native update policy

Private Gather's desired controlled release model:

### Admin devices
- Admin releases can become eligible immediately.
- Admins can test frequent development updates.

### Member devices
- Members receive no development release until an administrator explicitly chooses **Release to Members**.
- Member rollout should be deterministic and gradual to avoid server spikes.
- Devices should jump to the newest compatible eligible release rather than installing every intermediate admin build.
- Binary/store updates and OTA JS/assets updates remain distinct.
- OTA updates must respect runtime compatibility.
- Production signing/store rules remain Apple/Google controlled.

Do not confuse "GitHub build artifact" with "released to members."

---

## 6. GitHub-first testing discipline

Before native handoff, the exact candidate commit must pass the mandatory GitHub workflow defined in `AI-WORKFLOW.md`.

Current mandatory CI covers:
- public-repository safety
- Node/toolchain setup
- exact `npm ci`
- readiness
- TypeScript
- Expo config
- Android clean prebuild
- Kotlin compile
- Android debug APK build
- Android artifact upload
- iOS clean prebuild
- CocoaPods
- Xcode workspace verification

Current CI does **not yet prove**:
- physical camera quality
- microphone/audio routing
- Bluetooth
- real Wi-Fi ↔ cellular handoff
- manufacturer battery restrictions
- actual FCM/APNs timing
- Android lock-screen behavior
- iOS PushKit/CallKit runtime behavior

Those remain device tests.

Recommended future GitHub additions:
- API contract tests
- unit tests
- Android emulator smoke launch
- Maestro UI flows
- screenshot regressions
- messaging lifecycle integration
- call lifecycle integration
- production endpoint gate
- iOS simulator UI checks

---

## 7. Local-development vs distributed-build boundary

Development builds may use Metro locally.

Distributed preview/production builds must:
- run without the developer PC
- contain bundled JS/runtime as appropriate
- use public production/test HTTPS endpoints
- use public secure WebSocket endpoints
- never require `localhost`, `127.0.0.1`, or a private LAN host
- not depend on Metro being online

The servers that must remain online belong on production infrastructure (Laravel/API, Reverb, queues, Redis as used, push gateway, TURN), not on the developer Windows PC.

---

## 8. Android-first / iOS strategy

Current practical strategy:
1. Stabilize shared product behavior on Android.
2. Keep shared code platform-neutral.
3. Isolate Android-only/iOS-only adapters.
4. Reuse the stable shared app on iOS.
5. Validate Apple-specific behavior on a real iPhone.

Android success makes iOS substantially easier because most UI, API, realtime, messaging, state, media, and WebRTC logic is shared.

Real iPhone testing is still required before iOS public release for PushKit/APNs/CallKit, camera/mic/audio routing, lock-screen/background behavior, biometrics, and TestFlight behavior.

---

## 9. Laravel/backend authority boundary

The native GitHub repository does **not** establish the current Laravel live/source version.

For future Laravel work:
- retrieve the current authoritative Laravel core/repository/package
- read its `VERSION`
- inspect the current release/update manifest
- preserve sequential upgrade boundaries
- preserve migration discipline
- preserve exact reconstruction/hash gates
- never assume a Laravel version merely because the native app version is newer/similar

If a previous handoff, Library artifact, or repository exists for Laravel, use the newest authoritative source rather than old chat memory.

---

## 10. Candidate promotion rules

Use these statuses:

### Prepared candidate
Created but not GitHub validated.

### GitHub-validated candidate
Exact required CI passed.

### Device-tested candidate
Physical device acceptance passed.

### Confirmed live baseline
User explicitly says the candidate is accepted/working and promotes it.

### Quarantined
Failed candidate; do not use as a new baseline.

**Never promote automatically.**

---

## 11. Required future-chat startup

When a new chat begins, the user can say:

> Continue Private Gather using the authoritative project workflow. Read AI-WORKFLOW.md, RELEASE-STATE.json, and the current Private Gather master handoff first. Check GitHub before changing native source. Use GitHub-first validation and do not call anything live unless I explicitly accept it.

The assistant should then:
1. read these three records
2. inspect current GitHub state
3. retrieve separate Laravel authority if backend work is requested
4. identify the exact source baseline
5. proceed without making the user re-explain the entire history

---

# Update section for future handoffs

Whenever material project state changes, replace/update the sections below.

## A. Newly accepted live baseline
- Product area:
- Version:
- Source commit/package:
- Date:
- User acceptance wording:
- Validation evidence:

## B. Newest prepared candidate
- Version:
- Title:
- Built from:
- Exact source commit/package SHA:
- Major changes:
- Database changes:
- GitHub run:
- Device tests still required:
- Status:

## C. Quarantined candidates
- Version/build:
- Reason:
- Failure evidence:
- Safe fallback:

## D. Current known issues
- Issue:
- Platform:
- Reproduction:
- Evidence/log:
- Suspected surface:
- Status:

## E. Next planned work
- Priority 1:
- Priority 2:
- Priority 3:

## F. Durable decisions
Record architectural/product decisions that future chats must preserve.

## G. Artifact register
For each important package/artifact:
- filename/name
- version
- SHA-256/digest
- source commit
- GitHub run/artifact ID if applicable
- status (prepared / validated / device-tested / live / quarantined)

---

## 12. Handoff maintenance rule

Update this handoff after:
- a release becomes confirmed live
- a new candidate supersedes the previous candidate
- a candidate is quarantined
- the authoritative GitHub source commit changes
- the mandatory CI gate changes
- a major architecture decision changes
- a persistent device issue is discovered/resolved

Do not fill the handoff with every minor conversational detail. Keep only facts needed to resume development correctly.
