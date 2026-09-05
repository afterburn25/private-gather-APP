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
- Current native package version in the control record: **1.1.199**

### Current GitHub-validated source baseline in control record
- Validated source commit: `e95a2815c8410a7261b11ee7f32c7813b42aab82`
- Commit title: **Establish GitHub native validation gate**
- Status: **GitHub-validated candidate**
- Documentation-only commits do not supersede a validated app-source baseline.

### Validation evidence in control record
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

**Rule:** Any future app-source change requires a fresh successful validation run on that exact new commit.

---

## 2. Native architecture to preserve

Private Gather native is a real React Native/Expo product rather than a WebView wrapper.

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

Do not replace working auth, backend authority, realtime, push, TURN/WebRTC or privacy rules without a deliberate architecture reason.

---

## 3. NEW DURABLE PRODUCT ARCHITECTURE — TWO NATIVE APPS

Decision date: **2026-09-05**.

Private Gather is moving to a **two-native-app architecture**, analogous to a social app plus a dedicated Messenger app.

### App A — Private Gather
Owns the broader community/product experience:
- Home/feed
- Discover/members
- Events/gatherings
- Clubs/groups
- Profile/account
- Notifications outside communication-specific alerts
- verification, privacy and safety settings
- entry points that open the dedicated Messenger app for conversations/calls

### App B — Private Gather Messenger
Owns all direct communication:
- conversation list
- 1:1 messaging
- group messaging
- speaker identity selection
- typing
- presence
- sent/delivered/read state
- reactions
- replies
- unsend/revoke
- attachments/media/live selfie where retained
- voice notes
- voice calling
- video calling
- call history
- incoming-call UI
- ringtone/ringback/audio routing
- camera switching
- CallKit/Android calling integration
- messaging/call notifications

### Shared backend/platform
Both apps use the same authoritative services and data model:
- Laravel account/API authority
- member/profile/speaker identity
- media/privacy/verification rules
- Reverb/WebSocket realtime
- Redis/queues as appropriate
- APNs/FCM/push gateway
- WebRTC signaling
- TURN/STUN infrastructure

Business truth must live in the backend/domain contract, not be independently duplicated in each app.

### Cross-app authentication
Do not use plaintext token sharing or deprecated shared-user mechanisms.
- Each app owns secure local credential storage.
- First sign-in can authenticate each app normally.
- Seamless handoff should use a short-lived, single-use backend-issued authorization handoff through verified App Links/Universal Links where supported.
- Logging out/revoking a session must be enforceable server-side across both apps.

### Cross-app navigation
- Tapping Messages in Private Gather opens Private Gather Messenger.
- Tapping a member/message notification opens the exact Messenger conversation.
- Tapping voice/video call entry points opens the exact Messenger call flow.
- Messenger can deep-link back to the corresponding member/event/profile in the main Private Gather app when appropriate.

---

## 4. MESSENGER PWA STATUS

The Messenger PWA is **no longer a parity target**.

Permanent rules:
- New messaging/calling work is native-first.
- PWA/browser limitations must not constrain the native architecture.
- Existing PWA/web Messenger may remain during migration as legacy/maintenance-only.
- Do not spend development time reproducing new native Messenger behavior in PWA unless the user explicitly requests it.
- The native Messenger app is intended to replace the PWA.

---

## 5. MESSAGING REBUILD DIRECTION

The current accumulated messaging/call patch line is not the architectural basis for the future Messenger product.

The replacement should be a clean Messaging VNext system with:
- one normalized conversation/message domain model
- cursor-based message history
- optimistic native sends with stable client-generated IDs/idempotency keys
- durable server acknowledgement
- one realtime event envelope/version contract
- ordered/deduplicated realtime delivery
- reconnect/catch-up from a server cursor
- local native message cache/offline queue
- authoritative read/delivery receipts
- throttled realtime typing state rather than repeated uncontrolled requests
- deterministic presence state
- media upload pipeline separated from message creation
- call signaling separated cleanly from chat rendering/state
- one incoming-call coordinator per device/session
- native full-screen camera/video surfaces designed independently from legacy web markup
- instrumentation for send latency, websocket reconnects, missed events and call setup failures

Do not carry forward old UI timers, repeated tail-scroll timers, duplicate browser-tab ringtone ownership logic, or PWA-specific code into the new native Messenger core.

---

## 6. Product direction

Approved native brand direction:
- dark midnight/black base
- premium neon pink → violet → cyan accents
- heart + lock Private Gather brand mark
- premium/privacy-first visual identity
- tagline: **Real People. Private Moments.**

The native apps should become the best version of Private Gather, not merely duplicate the website.

---

## 7. Native update policy

Private Gather's controlled release model remains:
- Admin releases can become eligible immediately for testing.
- Members receive no development release until explicitly released.
- Member rollout should be deterministic and gradual.
- Devices should jump to the newest compatible eligible release rather than install every intermediate admin build.
- Binary/store updates and OTA JS/assets updates remain distinct.
- OTA updates must respect runtime compatibility.

Do not confuse a GitHub artifact with a member release.

---

## 8. GitHub-first testing discipline

Before native handoff, the exact candidate commit must pass the mandatory GitHub workflow defined in `AI-WORKFLOW.md`.

CI does not replace physical-device testing for camera, microphone, audio routing, notifications, lock-screen calls, background behavior, Wi-Fi/cellular handoff or manufacturer-specific restrictions.

For the future two-app architecture, each native app must eventually have its own exact build/validation artifact and cross-app deep-link/auth handoff tests.

---

## 9. Local-development vs distributed-build boundary

Development builds may use Metro locally.

Distributed preview/production builds must:
- run without the developer PC
- use public production/test HTTPS endpoints
- use public secure WebSocket endpoints
- never require localhost, LAN addresses or Metro
- keep production infrastructure on servers, not the developer Windows PC

---

## 10. Android-first / iOS strategy

Current practical strategy:
1. Stabilize shared domain/protocol behavior.
2. Build the dedicated Messenger native app Android-first.
3. Keep shared core platform-neutral.
4. Isolate Android/iOS calling, push and audio adapters.
5. Validate the same Messenger product on iPhone before iOS release.
6. Keep the main Private Gather app focused on community functionality and clean Messenger handoff.

---

## 11. Laravel/backend authority boundary

The native GitHub repository does **not** establish the current Laravel live/source version.

Before implementing the new Messaging VNext backend:
- retrieve the current authoritative Laravel core/package/repository
- read its `VERSION`
- inspect existing conversations/messages/reactions/attachments/calls/realtime migrations and controllers
- design additive migrations/protocol changes from that exact baseline
- preserve Update Center manifest/hash/allow-list discipline

---

## 12. Candidate promotion rules

Use these statuses:
- Prepared candidate
- GitHub-validated candidate
- Device-tested candidate
- Confirmed live baseline
- Quarantined

Never promote automatically.

---

## 13. Current known issue / superseded patch direction

The recent native call/video/ringtone repair line continued to show device issues including incomplete full-screen video behavior, preview blinking and ringtone restart behavior. Rather than continue stacking incremental patches, the user chose on 2026-09-05 to stop that direction and rebuild messaging/calling on a cleaner native-first architecture.

Any unfinished Rev7-style patch work should not be treated as the architecture for Messaging VNext.

---

## 14. Next planned work

1. Retrieve the exact current authoritative Laravel/backend baseline.
2. Inventory the existing message/conversation/call schema and API contracts worth preserving for data compatibility.
3. Write the Messaging VNext protocol/schema before UI implementation.
4. Build a dedicated Private Gather Messenger native application shell with its own bundle IDs/package IDs and shared core modules.
5. Implement realtime conversation/message lifecycle first.
6. Add media, reactions, receipts, typing/presence and speaker identity.
7. Implement calls as a separate communication subsystem after messaging lifecycle is stable.
8. Add main-app ↔ Messenger secure auth/deep-link handoff.
9. Validate Android then iOS.

---

## 15. Handoff maintenance rule

Update this handoff after:
- a release becomes confirmed live
- a new candidate supersedes the previous candidate
- a candidate is quarantined
- the authoritative GitHub source commit changes
- the mandatory CI gate changes
- a major architecture decision changes
- a persistent device issue is discovered/resolved

Do not fill the handoff with every minor conversational detail. Keep facts needed to resume development correctly.
