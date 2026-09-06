# Private Gather — Master Handoff

**Role:** Cross-chat continuity record for Private Gather.  
**Read with:** `AI-WORKFLOW.md`, `LOCAL-BUILD-WORKFLOW.md`, and `RELEASE-STATE.json` before development.  
**Last refreshed:** 2026-09-06.

> This handoff records the current durable project state and the user's required build/test workflow. When older documentation conflicts with this file or `LOCAL-BUILD-WORKFLOW.md`, use the newer 2026-09-06 workflow/state.

---

## 1. Current native release state

### Stable repository baseline
- Repository: `afterburn25/private-gather-APP`
- Default branch: `main`
- Main branch native baseline: **1.2.1**
- Main baseline commit: `531cf7098ec3266bc1042248e999ad6d718713a8`
- Main 1.2.1 was GitHub validated, but do not infer later physical-device acceptance unless explicitly confirmed by the user.

### Native 1.3 foundation
- Development branch: `feature/native-1.3.0-platform-expansion`
- Last exact GitHub-validated 1.3 foundation commit: `779b28127ddc4c2b4cae1c4073a43ad3e1e9b56b`
- Native Validate run: **#69**, run ID `34010605805`, success on that exact SHA.
- This historical validation does **not** automatically validate later direct local Rev2 repairs.

### Current direct local candidate
- Version: **Native 1.3.0 Rev2**
- Artifact: `Private-Gather-Native-App-1.3.0-Rev2-Telecom-Startup-Splash-Repair-Complete-Direct-Windows-Build-Kit.zip`
- SHA-256: `fd92264e5af2ce79e92fb9da4e6fa61a52878865333314261eabc752fa9114bc`
- Status: **prepared candidate / physical-device testing**
- Do not call it live, confirmed, or GitHub-validated as Rev2 unless later evidence specifically supports that status.

Rev2 currently includes:
- Native 1.3 account/profile/privacy foundation
- default-OFF adult-content viewing control
- Discreet Profile / Privacy Shield foundation
- Safety Center / App Lock
- corrected Main Me layout: Safety Center is a large main-body card directly below Verification rather than a tiny bottom/footer row
- Main app no longer owns Android Telecom/CallKeep PhoneAccount registration
- Private Gather Messenger remains native calling / Android Telecom owner
- startup splash repair so branded splash/overlay appears before React/Metro dev loading and hides the white → gray → bundle-counter sequence until the app is ready

---

## 2. Permanent user-facing build/test workflow

The user explicitly requires the **direct complete-kit local Windows workflow**. Preserve it exactly unless the user asks to change it.

### Packaging rule
Always provide these as separate artifacts by default:
1. **Website Core ZIP**
2. **Website Upgrade ZIP**
3. **Native App complete build-kit ZIP**

Do not combine them into one acceptance kit unless explicitly requested. Do not replace the Native App kit with a one-file hotfix/overlay when the user asks for the app; provide a complete build kit.

### Native local workflow
The user should not be required to clone GitHub, checkout commits, switch branches, use GitHub Actions, or fetch CI artifacts for normal device testing.

Expected directory:
`C:\PrivateGatherNative\package.json`

Standard PowerShell flow:

```powershell
cd C:\PrivateGatherNative
npm install --no-audit --no-fund
npm run check:ready
npm run typecheck
npx expo prebuild --clean --platform android
cd android
.\gradlew.bat assembleDebug --no-daemon --max-workers=1
```

Install:

```powershell
cd C:\PrivateGatherNative
adb devices
adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk
```

Metro for the dev-client build:

```powershell
cd C:\PrivateGatherNative
npx expo start --dev-client --clear
```

Main launch helper:

```powershell
adb shell monkey -p com.privoralabs.privategather -c android.intent.category.LAUNCHER 1
```

GitHub remains a durable project/source/documentation archive for future chats, but it must not silently replace this user-facing direct-kit workflow.

---

## 3. Current website/backend state

The native repository does not establish the live Laravel version.

Last user-reported installed website version:
- **1.1.201**

Prepared backend candidate paired with Native 1.3 Wave A:
- **Private Gather 1.1.204 — Default-Off Adult Content Marketplace Safety**
- Website Core: `Private-Gather-1.1.204-Default-Off-Adult-Content-Marketplace-Safety-Core.zip`
- Core SHA-256: `e04d4f7903415572ee6768bc79279bc9cfcab0597c652c434592fd1092f43e88`
- Direct Upgrade: `Private-Gather-1.1.201-to-1.1.204-Native-Wave-A-Adult-Content-Direct-Upgrade.zip`
- Upgrade SHA-256: `2e4a689fea35dfb4804419d5d3584e79efb32bed4de5df48664f17dc1aefa2cc`
- 1.1.204 installation/acceptance is not confirmed unless the user explicitly reports success.

1.1.204 backend purpose includes:
- Native profile/account/privacy API foundation
- Discreet Profile / Privacy Shield server contract
- default-OFF adult-content preference and server-side enforcement
- website-based explicit adult-content opt-in for conservative marketplace compliance

---

## 4. Native architecture to preserve

Private Gather is a **native-first two-app product**.

### App A — Private Gather
Owns:
- Home/feed
- Discover/members
- Events/gatherings
- Clubs/groups
- Profile/account
- Notifications
- verification/privacy/safety settings
- entry points into Messenger

### App B — Private Gather Messenger
Owns:
- conversations
- messaging
- typing/presence/read/delivery
- reactions/replies/unsend/revoke/media
- voice/video calls
- incoming-call UI/ringtone
- CallKeep / CallKit / Android Telecom integration
- communication-specific notifications

### Critical calling rule
**Messenger is the Telecom/native-calling owner. Main must not register its own Android Telecom PhoneAccount unless the architecture is deliberately changed.**

This rule exists because device testing exposed:
`java.lang.SecurityException: Registering a PhoneAccount requires either ... BIND_TELECOM_CONNECTION_SERVICE ... or CAPABILITY_SUPPORTS_TRANSACTIONAL_OPERATIONS`

Rev2 repairs that by preventing Main from initializing the PhoneAccount path while retaining calling ownership in Messenger.

---

## 5. Startup/splash rule

The user does not want the development startup sequence to visibly show:
- white screen
- gray screen
- bundle counter/loading UI

Required behavior:
- Private Gather branded splash is the first visible app surface.
- Native startup/splash overlay remains on top while React/Metro/dev-client startup occurs underneath.
- Splash is removed only once Login, App Lock, or the authenticated app surface is ready.
- `expo prebuild --clean` must preserve this behavior; do not rely on manual generated-Android edits that disappear on prebuild.

---

## 6. Safety Center / App Lock rule

Safety Center belongs in the **main body** of the Main app's Me screen.

Expected body order:
1. Profile card
2. Connections / Unread / Verified summary
3. Profile Completion
4. Verification
5. **Safety & Privacy / Safety Center large card**
6. Account and remaining preference sections

It must not be reduced to a tiny row just above the footer.

App Lock supports local device PIN/biometric protection. Main and Messenger are separate native apps and may maintain separate secure local credentials/settings.

---

## 7. Adult-content marketplace control

Durable product rule:
- NSFW/adult-content viewing defaults **OFF**.
- Server preference is authoritative.
- Native apps obey the preference.
- Native may immediately turn adult content OFF.
- Conservative iOS flow does not expose a one-tap in-app enable switch; user enables via website after required verification/confirmation.
- When OFF, adult photos remain blurred and adult video is blocked/locked at the media-delivery layer, not merely hidden in UI.

Do not promote this as guaranteeing store approval; it is a conservative compliance mechanism.

---

## 8. Discreet Profile / Privacy Shield direction

Native 1.3 foundation includes/plans:
- Discreet Mode
- face/eye/tattoo masking preferences
- manual mask regions
- non-destructive original image preservation
- geo-block states/cities/regions
- per-photo audiences
- selected-member grants
- reveal after accepted connection
- Emergency Hide My Profile

Do not claim automatic face/eye/tattoo detection unless it is actually implemented and tested.

---

## 9. Messaging direction

The dedicated native Messenger is the future messaging product. Messenger PWA is legacy/maintenance-only and is not a parity target.

Messaging VNext principles:
- normalized conversation/message domain
- stable client IDs/idempotency
- durable outgoing queue
- cursor/catch-up realtime recovery
- local cache/offline-first behavior
- authoritative delivery/read state
- deterministic typing/presence
- media pipeline separate from message creation
- calling subsystem separate from chat rendering
- one incoming-call coordinator per device/app ownership boundary

Do not carry browser-tab/PWA ringtone hacks into the native architecture.

---

## 10. Device-test history relevant to current work

### Version-code downgrade
Device reported:
`Downgrade detected: Update version code 1 is older than current 1185`

User resolved it by uninstalling the prior app and reinstalling; install returned `Success`.

**Rule:** keep the current kit as-is for that issue unless the user asks to change versionCode. Do not silently rebuild just because a clean reinstall was needed.

### Android Telecom crash
Device then reported the CallKeep PhoneAccount `SecurityException` described above.
- Rev2 repair: Main no longer owns/registers Android Telecom PhoneAccount.
- Messenger remains Telecom owner.

### Startup visuals
User reported white → gray → bundle-counter sequence before the app.
- Rev2 repair: branded native startup splash/overlay should cover that work.

These are device-test findings; do not claim Rev2 fixes are accepted until the user confirms them on device.

---

## 11. Release-state vocabulary

Use exactly:
1. **Prepared candidate**
2. **GitHub-validated candidate**
3. **Device-tested candidate**
4. **Confirmed live baseline**
5. **Quarantined**

Never promote automatically. Physical-device success and explicit user acceptance remain distinct from static or CI success.

---

## 12. Protected behavior

Do not rewrite working foundations without a feature reason:
- auth/token foundation
- Laravel native API authority
- Reverb realtime
- WebRTC/TURN signaling/media
- Messenger CallKeep/CallKit/Android Telecom ownership
- push delivery structure
- secure keychain/keystore storage
- stable call identity mapping
- update/package discipline
- privacy/verification enforcement

When a protected area changes, document the reason and the regression surface.

---

## 13. Start-of-chat protocol

For any future Private Gather chat, read these in this order before changing source or workflow:
1. `RELEASE-STATE.json`
2. `LOCAL-BUILD-WORKFLOW.md`
3. `AI-WORKFLOW.md`
4. `PRIVATE-GATHER-MASTER-HANDOFF.md`
5. relevant release/source files

If old GitHub-first handoff language conflicts with `LOCAL-BUILD-WORKFLOW.md`, preserve the newer **direct complete-kit local device-test workflow** unless the user explicitly changes it.

If working on Laravel/backend, retrieve the separate authoritative website source before editing; never infer backend source from the native repository.

---

## 14. End-of-work continuity rule

After material Private Gather work, update the durable GitHub continuity files with:
- current candidate/version
- artifact names and hashes when known
- packaging workflow changes
- architecture decisions
- exact device failure and repair
- test status
- what still requires physical acceptance

Do not leave a future chat dependent on conversation memory alone.
