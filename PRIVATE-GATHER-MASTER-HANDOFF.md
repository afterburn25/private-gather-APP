# Private Gather — Master Handoff

**Last refreshed:** 2026-09-06  
**Read first with:** `RELEASE-STATE.json`, `LOCAL-BUILD-WORKFLOW.md`, and `AI-WORKFLOW.md`.

## Current device-test candidates
### Native
- **Private Gather Native 1.3.0 Rev4 Rev3 — Messenger Prebuild Anchor Hotfix**
- Complete direct Windows build kit: `Private-Gather-Native-App-1.3.0-Rev4-Rev3-Messenger-Prebuild-Anchor-Hotfix-Complete-Direct-Windows-Build-Kit.zip`
- SHA-256: `ae0719f8e2050d23989bd3533abe873d9f32732108d700faddce3d2229c47610`
- Status: **prepared candidate / physical-device testing**; not GitHub-validated as Rev4 Rev3, not device accepted, not live.

### Website/backend
- **Private Gather 1.1.206 — Native Messenger Sign-In & Call Lifecycle Stability**
- Core: `Private-Gather-1.1.206-Native-Messenger-Sign-In-Call-Lifecycle-Stability-Core.zip`
- Core SHA-256: `d66bc3a82c47a6d9832f8bbf7f391bbe5931450e532b3d45021e2024d45a171b`
- Direct Upgrade from last user-reported 1.1.201: `Private-Gather-1.1.201-to-1.1.206-Native-Messenger-Call-Lifecycle-Stability-Direct-Upgrade.zip`
- Upgrade SHA-256: `f613e2834c321a58878777f468dda04e02f39e9d802eb4d519cf442bb87a87ef`
- 1.1.206 itself adds no migration. Website is unchanged by Rev4 Rev3.

## Permanent artifact/build workflow
Always hand off three separate ZIPs by default: Website Core, Website Upgrade, complete Native App kit. The user extracts the Native kit directly to `C:\PrivateGatherNative\`. Do not switch the user to GitHub clone/checkout/Actions or overlay patches unless explicitly requested.

Preferred build/install of both native apps:
```powershell
cd C:\PrivateGatherNative
powershell -ExecutionPolicy Bypass -File .\scripts\build-install-both.ps1
```
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
Rev4 Rev2 fixed Main prebuild. Physical Windows build then reached Messenger and failed because `withPrivateGatherMessenger121.js` still expected the old generated line:
`manager.notify(41000 + (requestCode and 0x0fff), notification)`
while the current base generator emits:
`manager.notify(notificationId(callId), notification)`.

### Rev4 Rev3 — current prepared candidate
- Messenger enhancement now supports the current `notificationId(callId)` generated line and retains the older line as compatibility fallback.
- Added `scripts/check-messenger-prebuild-chain.cjs`, which generates the three Messenger native calling Kotlin files and applies the Messenger enhancement in Expo dangerous-mod composition order.
- `npm run check:ready` runs that generated composition gate before prebuild.
- Same one-command workflow is preserved.
- Future prebuild failures automatically write `dist\prebuild-main.log` / `dist\prebuild-messenger.log` and print the final 60 lines.

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
1. Build/install Rev4 Rev3 Main + Messenger using the direct kit.
2. Confirm Main prebuild still passes.
3. Confirm Messenger prebuild now passes.
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
