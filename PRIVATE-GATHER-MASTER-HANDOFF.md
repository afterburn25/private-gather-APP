# Private Gather — Master Handoff

**Last refreshed:** 2026-09-06  
**Read first with:** `RELEASE-STATE.json`, `LOCAL-BUILD-WORKFLOW.md`, and `AI-WORKFLOW.md`.

## Current device-test candidates
### Native
- **Private Gather Native 1.3.0 Rev4 Rev4 — Expo SystemUI & PowerShell Native-Warning Hotfix**
- Complete direct Windows build kit: `Private-Gather-Native-App-1.3.0-Rev4-Rev4-Expo-SystemUI-PowerShell-Native-Warning-Hotfix-Complete-Direct-Windows-Build-Kit.zip`
- SHA-256: `5a379004037b2e11898110da4a61f4aa3a8fc365b1d6798e9cce297be9f9be75`
- Status: **prepared candidate / physical-device testing**; not GitHub-validated as Rev4 Rev4, not device accepted, not live.

### Website/backend
- **Private Gather 1.1.206 — Native Messenger Sign-In & Call Lifecycle Stability**
- Core: `Private-Gather-1.1.206-Native-Messenger-Sign-In-Call-Lifecycle-Stability-Core.zip`
- Core SHA-256: `d66bc3a82c47a6d9832f8bbf7f391bbe5931450e532b3d45021e2024d45a171b`
- Direct Upgrade from last user-reported 1.1.201: `Private-Gather-1.1.201-to-1.1.206-Native-Messenger-Call-Lifecycle-Stability-Direct-Upgrade.zip`
- Upgrade SHA-256: `f613e2834c321a58878777f468dda04e02f39e9d802eb4d519cf442bb87a87ef`
- 1.1.206 itself adds no migration. Website is unchanged by Rev4 Rev4.

## Permanent artifact/build workflow
Always hand off three separate ZIPs by default: Website Core, Website Upgrade, complete Native App kit. The user extracts the Native kit directly to `C:\PrivateGatherNative\`. Do not switch the user to GitHub clone/checkout/Actions or overlay patches unless explicitly requested.

Preferred build/install of both native apps:
```powershell
cd C:\PrivateGatherNative
powershell -ExecutionPolicy Bypass -File .\scripts\build-install-both.ps1
```
The script always reconciles dependencies with `npm install --no-audit --no-fund`, then runs `check:ready` and `typecheck` before Main/Messenger prebuild.

Dual Metro:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-both-metro.ps1
```

## Native architecture
Two separate native apps remain required:
- **Main Private Gather**: community, Home, Discover, Events, Clubs, profile/account, verification/privacy/safety, notification center, Messenger handoff.
- **Private Gather Messenger**: direct/group messaging, realtime receipts/presence, native voice/video calls, ringtone, incoming-call UI, CallKeep/Android Telecom/CallKit.

**Messenger is the sole native Telecom owner. Main must not register an Android Telecom PhoneAccount.**

## Rev4 feature repairs preserved
- Messenger Show/Hide Password; password does not auto-capitalize or autocorrect.
- Website 1.1.206 dedicated native-login limiter.
- Combined private Firebase Android client config contains Main and Messenger package clients.
- Messenger realtime `incoming.call`, `call.claimed`, and `call.ended` handling.
- Cross-device answer retracts stale incoming/ringing surfaces without ending the active call.
- Failed mobile takeover of an already-active web call cleans up locally rather than ending the server/web call.
- Remote cancel/end retracts ringtone, notification, and Android incoming activity.
- Native ringtone loops through the audio engine without repeatedly restarting the clip.
- Messenger does not use the extra branded startup overlay/splash; Main keeps the branded splash/progress experience.

## Rev4 build-failure corrections
### Original Rev4 — superseded
Main `expo prebuild --clean` failed with `PluginError: reactContext is not defined` because an Android Kotlin `${reactContext.packageName}` expression was unescaped inside a JavaScript config-plugin template.

### Rev4 Rev2 — superseded
Rev4 Rev2 fixed Main prebuild. Windows testing then reached Messenger and failed because `withPrivateGatherMessenger121.js` still expected the old hard-coded `manager.notify(41000 + ...)` line while the current base generator emits `manager.notify(notificationId(callId), notification)`.

### Rev4 Rev3 — superseded
Rev4 Rev3 fixed the Messenger notification anchor and added generated dangerous-mod composition tests. Windows PowerShell then surfaced Expo's harmless stderr warning as a terminating `NativeCommandError`:

`android: userInterfaceStyle: Install expo-system-ui in your project to enable this feature.`

The wrapper used `$ErrorActionPreference = 'Stop'` while merging native stderr into a PowerShell pipeline, so it could terminate before checking the real Expo exit code.

### Rev4 Rev4 — current prepared candidate
- Adds `expo-system-ui` `~57.0.3`, matching Expo SDK 57's SystemUI line.
- Adds the `expo-system-ui` config plugin for the existing `userInterfaceStyle: dark` configuration.
- The one-command build always runs `npm install --no-audit --no-fund`, so new native modules cannot be skipped by stale `node_modules`.
- Expo prebuild stderr is merged inside `cmd.exe`; PowerShell sees ordinary output instead of promoting harmless native stderr to a terminating error.
- Prebuild success/failure is based on the actual native process exit code.
- Per-flavor logs remain `dist\prebuild-main.log` and `dist\prebuild-messenger.log`.
- `npm run check:ready`: PASS, 0 failures; generated Messenger plugin-chain composition remains PASS.
- ZIP integrity and internal 149-file manifest: PASS, 0 mismatches.
- Firebase Admin/service-account credential is not in the Native kit.

## Firebase/push boundary
The private combined Android `google-services.json` contains Firebase clients for both `com.privoralabs.privategather` and `com.privoralabs.privategather.messenger`. The direct Native kit may contain this client build config and Git ignores it. **Do not commit it to public GitHub.**

Firebase Admin/service-account credentials remain only in the user's existing external server push-gateway deployment. Never include the service-account JSON/private key in Website Core, Upgrade, Native App kit, or public GitHub.

## Existing behavior to preserve
- Main Safety Center large body card directly below Verification.
- App Lock/PIN/biometrics.
- Main branded splash is first visible surface; actual Metro dev bundle progress drives its progress bar and the default gray DevLoading strip is suppressed.
- Main bottom navigation remains persistent across detail pages.
- Unified brand/page/subtitle header.
- One-command two-app build/install.
- Verification handoff reuse from Website 1.1.205+.
- default-OFF adult-content controls and Discreet Profile foundation.

## Acceptance still required
1. Build/install Rev4 Rev4 Main + Messenger using the direct kit.
2. Confirm Main prebuild passes without the SystemUI warning becoming fatal.
3. Confirm Messenger prebuild passes.
4. Gradle `assembleDebug` for both apps.
5. Repeated Main/Messenger sign-ins without inappropriate 429s.
6. Open-app and closed/background incoming-call delivery.
7. Cross-device web/mobile answer/claim behavior.
8. Remote cancel/end must stop ringtone and clear notification/activity immediately.
9. Ringtone plays the complete clip before natural loop.
10. No separate branded Messenger splash.
11. Explicit user acceptance before promotion.

## Release vocabulary
Prepared candidate → GitHub-validated candidate → Device-tested candidate → Confirmed live baseline. Quarantine failed candidates. Never promote automatically.
