# Private Gather — Master Handoff

**Role:** Cross-chat continuity record for Private Gather.  
**Read with:** `RELEASE-STATE.json`, `LOCAL-BUILD-WORKFLOW.md`, and `AI-WORKFLOW.md` before development.  
**Last refreshed:** 2026-09-06.

> This handoff records the current durable project state and the user's required build/test workflow. When older documentation conflicts with this file or `LOCAL-BUILD-WORKFLOW.md`, use the newer 2026-09-06 workflow/state.

---

## 1. Current native release state

### Stable repository baseline
- Repository: `afterburn25/private-gather-APP`
- Default branch: `main`
- Main branch native baseline: **1.2.1**
- Main baseline commit: `531cf7098ec3266bc1042248e999ad6d718713a8`
- Do not infer physical-device acceptance unless the user explicitly confirms it.

### Historical Native 1.3 GitHub-validated foundation
- Development branch: `feature/native-1.3.0-platform-expansion`
- Last exact GitHub-validated foundation commit: `779b28127ddc4c2b4cae1c4073a43ad3e1e9b56b`
- Native Validate run: **#69**, run ID `34010605805`, success on that exact SHA.
- Later direct local Rev2/Rev3 repairs are **not** automatically GitHub-validated.

### Current direct local candidate
- Version: **Native 1.3.0 Rev3**
- Artifact: `Private-Gather-Native-App-1.3.0-Rev3-Loading-Push-Navigation-Call-Repair-Complete-Direct-Windows-Build-Kit.zip`
- SHA-256: `a856b8deaeeef7fc12dc9d00b36d2e5741e9310dcfadb34786ae9e2e578dbf10`
- Status: **prepared candidate / physical-device testing**
- Do not call Rev3 live, confirmed, device-tested, or GitHub-validated unless later evidence specifically supports that status.

Rev3 contains the Native 1.3 Wave A foundation plus:
- default-OFF adult-content viewing control
- Discreet Profile / Privacy Shield foundation
- Safety Center / App Lock
- Safety Center large Main-body card directly below Verification
- Main app excluded from Android Telecom/CallKeep PhoneAccount ownership
- Messenger remains native calling / Android Telecom owner
- branded startup splash remains first visible app surface
- actual Metro bundling percentage drives the branded splash progress bar in development
- the default gray React Native `Bundling …%` PopupWindow is suppressed by a postinstall React Native 0.86.3 compatibility patch
- Main Firebase Android config is privately embedded in the direct kit and auto-wired through `expo prebuild --clean`
- persistent Main bottom navigation remains visible on authenticated content/detail pages
- unified branded header shows Private Gather plus page title/subtitle
- Messenger full-screen incoming-call permission opens the correct Android settings surface
- remote/server/web call cancellation immediately clears incoming UI and stops Messenger ringtone
- one PowerShell command can build/install both separate native apps

---

## 2. Permanent user-facing build/test workflow

The user explicitly requires the **direct complete-kit local Windows workflow**. Preserve it exactly unless the user asks to change it.

### Packaging rule
Always provide these as separate artifacts by default:
1. **Website Core ZIP**
2. **Website Upgrade ZIP**
3. **Native App complete build-kit ZIP**

Do not combine them into one acceptance kit unless explicitly requested. Do not replace the Native App kit with a one-file overlay/hotfix when the user asks for the app.

### Native local workflow
The user should not be required to clone GitHub, checkout commits, switch branches, use GitHub Actions, or fetch CI artifacts for normal device testing.

Expected directory:
`C:\PrivateGatherNative\package.json`

Main-only PowerShell flow:

```powershell
cd C:\PrivateGatherNative
npm install --no-audit --no-fund
npm run check:ready
npm run typecheck
npx expo prebuild --clean --platform android
cd android
.\gradlew.bat assembleDebug --no-daemon --max-workers=1
```

Install Main:

```powershell
cd C:\PrivateGatherNative
adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk
```

Main Metro:

```powershell
cd C:\PrivateGatherNative
npx expo start --dev-client --clear
```

### One-command build/install for both native apps
Main and Messenger remain separate package IDs. The direct kit includes:

```powershell
cd C:\PrivateGatherNative
powershell -ExecutionPolicy Bypass -File .\scripts\build-install-both.ps1
```

This locally clean-prebuilds/builds and installs both APKs in one workflow while preserving the two-app architecture.

Start both Metro servers:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-both-metro.ps1
```

Do not replace this user-facing flow with GitHub CI unless the user explicitly asks.

---

## 3. Current website/backend state

Last user-reported installed website version:
- **1.1.201**

Current prepared website candidate:
- **Private Gather 1.1.205 — Native Verification Handoff Stability**
- Website Core: `Private-Gather-1.1.205-Native-Verification-Handoff-Stability-Core.zip`
- Core SHA-256: `5000763f27745b78221a730e8365c8bb5a39a42bd57609f8ccc68f8f926b3273`
- Direct Upgrade: `Private-Gather-1.1.201-to-1.1.205-Native-Verification-Handoff-Stability-Direct-Upgrade.zip`
- Upgrade SHA-256: `636c6eff538d66bfba56e44d2580d46558475616ff1f0361d43e9044f22f02ce`
- Installation/acceptance is not confirmed unless the user explicitly reports success.

1.1.205 includes the cumulative 1.1.202–1.1.204 Native Wave A/backend work plus verification handoff repair.

### 1.1.205 verification repair
The native verification launch previously could hit `Too Many Attempts` because a new verification bridge token/link was minted repeatedly as the native screen mounted/retried.

1.1.205:
- reuses the authenticated user's active verification bridge token/URL for up to **10 minutes**
- remains user-bound/hashed server-side
- native launch endpoint throttle: `60/minute`
- bridge throttle: `60/minute`
- native verification UI adds cooldown-safe retry behavior

1.1.205 adds **no new migration**. Total migration count remains 115, consisting of 113 historical migrations plus the two cumulative Wave A migrations already introduced before 1.1.205.

Direct 1.1.201→1.1.205 package replay exactly reproduced the prepared 1.1.205 tree.

---

## 4. Firebase / push state

User supplied a private Firebase Android config that matches the Main app package:
`com.privoralabs.privategather`

Rev3 private Native App kit:
- includes that Main Firebase config privately
- `app.config.js` auto-detects it for Main
- readiness checks verify the config includes the correct Main package
- clean Expo prebuild should place/wire the generated Android Google Services configuration

**Do not publish the user-supplied Firebase config or its values in public GitHub documentation/source.**

Messenger currently does **not** have a Firebase client config for:
`com.privoralabs.privategather.messenger`

To enable reliable Messenger FCM push, register Messenger as a separate Android app in the same Firebase project and provide its Messenger-specific `google-services` config. Until then, Messenger Firebase readiness should warn rather than claim it is configured.

---

## 5. Startup / splash rule

The user does not want the development startup sequence to visibly show:
- white screen
- gray screen
- gray `Bundling xx%` strip

Required Rev3 behavior:
- Private Gather branded splash is the first visible app surface.
- Splash/overlay remains on top while native/React/Metro startup occurs underneath.
- In development, the splash progress bar is tied to React Native's actual Metro bundle progress percentage.
- React Native 0.86.3's default `DefaultDevLoadingViewImplementation` gray PopupWindow is suppressed by the kit's postinstall compatibility patch while its progress callback is routed to the Private Gather overlay.
- In non-Metro/release startup, staged loading progress is used until Login/App Lock/authenticated app becomes ready.
- `expo prebuild --clean` must preserve this behavior; do not rely on manual generated-Android edits.

---

## 6. Main navigation / header rule

The authenticated Main app uses a persistent product shell.

### Bottom navigation
Keep the bottom navigation visible on normal authenticated pages, including detail pages such as:
- member profile
- event detail
- club detail
- notifications
- verification
- settings / account
- Discreet Profile

Full-screen exception surfaces such as native call UI and login may hide the bottom navigation.

Main tabs:
- Home
- Discover
- Messages
- Events
- Me

### Top header
The top product header should carry:
- Private Gather brand/logo
- current page title
- page subtitle where applicable
- back/notification controls when appropriate

Example:
`Private Gather | Events`
with `Your social calendar` as the page subtitle in the same compact header system.

---

## 7. Calling / full-screen permission ownership

Private Gather is a **native-first two-app product**.

### Main Private Gather
Owns community/profile/discover/events/settings and entry points into Messenger.

### Private Gather Messenger
Owns conversations, messaging, incoming calls, ringtone, CallKeep/CallKit, and Android Telecom integration.

**Critical rule:** Messenger is the Telecom/native-calling owner. Main must not register its own Android Telecom PhoneAccount unless the architecture is deliberately changed.

### Full-screen incoming-call permission
Full-screen alert/call permission belongs to Messenger, not Main.

Rev3 Messenger Safety Center:
- shows full-screen incoming-call access state on applicable Android versions
- opens `ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT` first
- falls back to notification settings, then app details settings
- reports failure instead of silently doing nothing
- refreshes status when returning to the app

---

## 8. Remote call cancellation / ringtone rule

Device testing found:
- web initiated/canceled a video call
- native Messenger ringtone continued until the app was closed

Rev3 repair:
- incoming-call polling tracks the displayed incoming call
- if the call disappears from `/calls/incoming` or is no longer `ringing`, Messenger treats it as cleared
- stops Messenger ringtone immediately
- clears incoming-call UI
- cancels the native incoming-call notification
- temporarily ignores the cleared call ID to prevent a stale response from re-ringing it

This remains a prepared repair until the user confirms physical-device behavior.

---

## 9. Safety Center / App Lock rule

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

## 10. Adult-content and Discreet Profile rules

### Adult content
- Viewing defaults **OFF**.
- Server preference is authoritative.
- Native app obeys it and may turn adult content OFF immediately.
- Conservative native flow does not expose direct enable; enable is handled on website after required verification/confirmation.
- When OFF, adult photos are blurred and adult video is blocked at media delivery, not merely hidden in UI.
- Do not claim this guarantees App Store/Play approval.

### Discreet Profile / Privacy Shield
Foundation includes:
- Discreet Mode
- face/eye/tattoo masking preferences
- manual mask regions
- non-destructive original image preservation
- geo-block states/cities/regions
- per-photo audiences
- selected-member grants
- reveal after accepted connection
- Emergency Hide My Profile

Do not claim automatic face/eye/tattoo detection unless actually implemented/tested.

---

## 11. Device-test history relevant to current work

### Version-code downgrade
Device reported:
`Downgrade detected: Update version code 1 is older than current 1185`

User resolved it by uninstalling the prior app and reinstalling; install returned `Success`.

Rule: do not silently change versionCode solely because of this unless user asks.

### Android Telecom crash
Main attempted CallKeep PhoneAccount registration and Android threw a `SecurityException`.
Repair: Main does not own/register the Telecom PhoneAccount; Messenger remains owner.

### Startup visuals
White/gray/bundle counter were visible before the app.
Rev3 routes actual Metro bundle progress to Private Gather splash and suppresses the default gray popup.

### Full-screen permission
Permission button did nothing.
Rev3 moves this to Messenger ownership and uses Android settings fallbacks with explicit failure reporting.

### Verification rate limiting
Native verification link hit `Too Many Attempts`.
Website 1.1.205 reuses an active launch token/link and native UI uses cooldown-safe retries.

### Remote canceled call kept ringing
Rev3 clears the native call/ringer when incoming state disappears or stops ringing.

### Main Firebase push initialization
Main reported `Default FirebaseApp is not initialized`.
Rev3 privately embeds/wires the supplied Main Firebase config through clean prebuild and readiness validation.

---

## 12. Rev3 local validation boundary

Rev3 packaging checks completed:
- `npm run check:ready`: PASS with 0 failures
- TypeScript/TSX syntax/transpile scan: 65 files, 0 syntax diagnostics
- JS/MJS syntax: 8 files, 0 failures
- Native ZIP integrity: PASS
- internal build-kit manifest: 0 mismatches

Packaging environment limitation:
- a fresh npm dependency install could not complete because the registry returned `EAI_AGAIN`
- therefore a fresh full `npm run typecheck`, clean Expo prebuild, and Gradle compile were not completed in that packaging environment

The direct kit deliberately runs `npm install`, `check:ready`, and `typecheck` locally before build so the user's normal workflow will stop on any real dependency/type failure.

Do **not** call Rev3 GitHub validated, device-tested, or live based on the packaging checks.

---

## 13. Release-state vocabulary

Use exactly:
1. **Prepared candidate**
2. **GitHub-validated candidate**
3. **Device-tested candidate**
4. **Confirmed live baseline**
5. **Quarantined**

Never promote automatically. Physical-device success and explicit user acceptance remain distinct from static or CI success.

---

## 14. Start-of-chat protocol

For any future Private Gather chat, read these in this order before changing source or workflow:
1. `RELEASE-STATE.json`
2. `LOCAL-BUILD-WORKFLOW.md`
3. `AI-WORKFLOW.md`
4. `PRIVATE-GATHER-MASTER-HANDOFF.md`
5. relevant release/source files

If old GitHub-first handoff language conflicts with `LOCAL-BUILD-WORKFLOW.md`, preserve the newer **direct complete-kit local device-test workflow** unless the user explicitly changes it.

If working on Laravel/backend, retrieve the separate authoritative website source before editing; never infer backend source from the native repository.

---

## 15. End-of-work continuity rule

After material Private Gather work, update durable continuity with:
- current candidate/version
- separate artifact names and hashes
- architecture/workflow decisions
- exact device failures and repairs
- validation status and limitations
- remaining physical-device acceptance work

Never leave future chats dependent on conversation memory alone.
