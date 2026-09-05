# Private Gather — AI Development Workflow

**Purpose:** This file defines the mandatory development, validation, packaging, and promotion workflow for Private Gather. Future AI-assisted development must read this file before changing source code.

## 1. Source of truth

### Native app
- Authoritative repository: `afterburn25/private-gather-APP`
- Authoritative branch: `main`
- Do not reconstruct native source from old chat snippets, stale ZIPs, screenshots, or memory when the repository is available.
- `RELEASE-STATE.json` records the exact GitHub-validated source commit and validation run.
- A documentation-only commit does **not** replace the validated source commit unless application/build source changed and a fresh validation run passed.

### Laravel / website
- The native repository is **not** the source of truth for the Laravel website/backend version.
- Before modifying Laravel, retrieve the current authoritative Laravel core/package/repository and its `VERSION`, release manifest, or current master handoff.
- Never infer the Laravel live/source version from the native package version.

### Project continuity
- Read `PRIVATE-GATHER-MASTER-HANDOFF.md` together with this file and `RELEASE-STATE.json`.
- If a current authoritative project file conflicts with old conversation memory, the current authoritative file wins.
- Never silently substitute an older baseline.

## 2. Release-state vocabulary

Use these terms exactly:

1. **Prepared candidate** — source/package exists; local/static checks may have passed; not yet GitHub validated or accepted.
2. **GitHub-validated candidate** — required GitHub Actions gates passed on the **exact source commit** being handed off. This does not mean real-device behavior is confirmed.
3. **Device-tested candidate** — required real-device acceptance checks completed successfully; not live until explicit user acceptance.
4. **Confirmed live baseline** — user explicitly confirms the release works/is accepted; only then may it supersede the prior confirmed live baseline.
5. **Quarantined** — candidate failed installation, CI, runtime, device testing, or a regression gate. Do not use it as a new baseline.

Never call a prepared or CI-only build "live", "confirmed", or "working on device".

## 3. Native GitHub-first validation gate

For any native source change that affects application/build behavior, GitHub validation is mandatory before handoff.

Current required workflow: `.github/workflows/native-validate.yml`

### Public-safety job
Must pass:
- checkout with history
- Node `22.23.2`
- `node scripts/ci-public-safety.mjs`
- no secrets, credentials, private signing material, unsafe environment files, or prohibited public-repository content

### Android job
Must pass on the exact candidate commit:
- Node `22.23.2`
- Java `17` (Temurin)
- `npm ci --no-audit --no-fund`
- `npm run check:ready`
- `npm run typecheck`
- `npx expo config --type public`
- `npx expo prebuild --clean --platform android`
- `./gradlew :app:compileDebugKotlin --console=plain`
- `./gradlew assembleDebug --console=plain`
- upload `private-gather-android-debug` artifact

### iOS prebuild job
Must pass on the exact candidate commit:
- Node `22.23.2`
- `npm ci --no-audit --no-fund`
- `npm run check:ready`
- `npm run typecheck`
- `npx expo prebuild --clean --platform ios`
- `pod install`
- verify generated `.xcworkspace` using `xcodebuild -list`

### Exact-commit rule
A green run from another commit is not sufficient. Before saying a native candidate is GitHub validated, verify:
- workflow name is `Native Validate`
- run status is completed
- conclusion is success
- `head_sha` exactly matches the candidate source commit
- all required jobs succeeded
- Android artifact belongs to that same run and commit

If any condition is false, the candidate is **not GitHub validated**.

## 4. Real-device gate

GitHub CI reduces trial-and-error; it does not replace physical-device testing.

### Android minimum acceptance
For changes touching relevant areas, test:
- clean install / upgrade
- launch without Metro/local PC
- login/logout and token persistence
- correct production API endpoint; no localhost/LAN dependency
- Home / Discover / Messages / Events / Profile navigation
- Android safe area and keyboard; composer not behind navigation bar
- message send/receive
- typing, read receipts, reactions and realtime reconnect
- push notification registration/delivery
- camera/microphone permissions
- voice call
- video call
- local PiP / remote video
- speaker / earpiece / Bluetooth when applicable
- camera flip
- call answer/decline/end
- background/lock-screen call behavior when applicable
- Wi-Fi/cellular transition when relevant
- update-check behavior

### iOS minimum acceptance
In addition to shared checks:
- APNs
- PushKit VoIP delivery
- CallKit incoming-call behavior
- terminated/background state
- lock-screen behavior
- real camera/microphone
- speaker/earpiece/Bluetooth routing
- Face ID / biometric flows when applicable
- TestFlight behavior
- iOS safe areas

A simulator may support UI and logic validation, but cannot replace these physical-device checks.

## 5. Failure handling

When a test fails:
1. Capture the exact failing error/log/step.
2. Identify the smallest responsible surface.
3. Compare against the last passing exact baseline.
4. Make the smallest necessary repair.
5. Do not stack unrelated speculative patches.
6. Re-run the complete required GitHub gate on the new commit.
7. If the failure is device-only, preserve CI-passing source and isolate the platform-specific runtime fix.
8. Quarantine broken candidates when necessary.
9. Never claim a fix worked until the relevant gate actually passes.

Prefer delivering corrected files/packages over telling the user to manually make many edits.

## 6. Preserve working systems

Do not rewrite known-working systems merely because adjacent UI/features are changing.

Protected areas unless the request requires changes:
- native authentication/token foundation
- Laravel native API contracts
- Reverb realtime transport
- WebRTC signaling/media path
- CallKeep / CallKit / Android ConnectionService seams
- PushKit / APNs / FCM delivery structure
- stable Private Gather call UUID mapping
- staged native update system
- privacy-safe native serializers
- established update/package allow-list rules

When changing a protected area, document why, add/extend a regression check where practical, and reverify the previously working behavior.

## 7. Native product architecture

Private Gather is now a **native-first two-app product**. PWA parity is no longer a product requirement.

### Private Gather
The main native app owns the broader community experience:
- Home/feed
- Discover/members
- Events/gatherings
- Clubs/groups
- Profile/account
- Notifications
- Verification, privacy and safety settings
- entry points into messaging and calls

### Private Gather Messenger
A separate native app owns communication:
- conversation list
- 1:1 and group messaging
- typing, presence, delivery and read receipts
- reactions, replies, unsend/revoke and media messaging
- voice/video calling
- incoming call UI, ringtone, CallKit/ConnectionService integration
- communication-specific notifications

### Shared platform
Both native apps must use the same authoritative backend account and shared service contracts:
- Laravel API/auth authority
- Reverb/WebSocket realtime infrastructure
- push gateway / APNs / FCM infrastructure
- WebRTC/TURN infrastructure
- member identity and speaker identity rules
- media/privacy/verification rules

Do not duplicate business truth independently in each app. Shared protocol/domain code should live in reusable modules/packages where practical, while UI/navigation remain app-specific.

### Cross-app authentication and handoff
- Do not depend on unsafe shared plaintext tokens or deprecated platform mechanisms.
- Each app keeps its own secure credential storage.
- Cross-app sign-in/handoff should use platform-supported secure app links/universal links or a short-lived backend-issued handoff token.
- Opening Messages/Call from the main app should deep-link into Private Gather Messenger when installed.
- If Messenger is not installed, the main app should route the user to the supported install path without recreating Messenger inside the main app.

### PWA status
- Messenger PWA is legacy/maintenance-only and is not a parity target for new native work.
- Do not delay, constrain or redesign native messaging/calling features merely to preserve PWA behavior.
- Existing web/PWA functionality may remain available during migration, but it is not the future architecture.

## 8. Production-runtime rules

Distributed builds must not depend on a developer computer.

Never ship:
- `localhost`
- `127.0.0.1`
- private LAN API hosts such as `192.168.x.x`
- Metro/dev-server dependencies
- development Reverb endpoints
- signing secrets in source
- private `.env` files in the public repository

Production/preview builds must use public HTTPS/WSS services and must start without Metro.

## 9. Sequential release discipline

- Build from the exact latest accepted/prepared authoritative source, not a reconstructed approximation.
- Preserve exact version boundaries.
- Do not skip or silently reuse old release packages.
- Failed/superseded packages remain quarantined.
- For Laravel Update Center releases, preserve the established manifest/hash/allow-list discipline and exact reconstruction checks.
- Do not add database changes unless the requested feature requires them.
- When migrations are unchanged, verify the migration count/hash boundary remains unchanged.

## 10. Validation reporting

Every candidate handoff should state:
- source repository / baseline
- exact candidate commit SHA
- application version
- files changed
- whether database migrations changed
- GitHub workflow name
- workflow run ID / run number
- workflow conclusion
- required job conclusions
- Android artifact name / artifact ID / digest when generated
- static/local checks used only as supplemental evidence
- real-device checks still required
- candidate status using the vocabulary in Section 2

Do not hide failed checks behind a generic "validated" label.

## 11. Future CI expansion

Recommended additions, but not mandatory until implemented in GitHub:
- unit tests for API client, auth, update selection, call UUID mapping, offline queues
- Laravel/native API contract tests
- Android emulator launch test
- Maestro UI flows
- screenshot regression tests
- production-endpoint/localhost prohibition gate
- message/reaction/read-receipt integration tests
- call lifecycle integration tests
- iOS simulator UI tests
- artifact smoke-install testing

When an item becomes implemented and consistently passing, update this file and `RELEASE-STATE.json` to make it part of the mandatory gate.

## 12. Start-of-chat protocol

At the beginning of any future Private Gather development chat:
1. Read `AI-WORKFLOW.md`.
2. Read `RELEASE-STATE.json`.
3. Read the current `PRIVATE-GATHER-MASTER-HANDOFF.md`.
4. Inspect the authoritative GitHub branch/head and relevant workflow.
5. If modifying native source, confirm the current GitHub-validated source commit and version.
6. If modifying Laravel/backend, retrieve its separate authoritative baseline before editing.
7. State any discrepancy instead of guessing.
8. Only then implement changes.

Suggested user prompt:

> Continue Private Gather using the authoritative project workflow. Read AI-WORKFLOW.md, RELEASE-STATE.json, and the current Private Gather master handoff before changing anything. Use GitHub-first validation and do not call a candidate ready until the exact required CI run passes.

## 13. End-of-work protocol

After a material development session:
1. Update source.
2. Run/obtain the required validation.
3. Update `RELEASE-STATE.json` when the authoritative validated source changes.
4. Update `PRIVATE-GATHER-MASTER-HANDOFF.md` with what changed, exact versions/commits, validation evidence, status, remaining device tests, and next work.
5. Do **not** promote to confirmed live without explicit user acceptance.
