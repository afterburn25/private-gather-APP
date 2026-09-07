# Private Gather — Master Handoff

**Last refreshed:** 2026-09-06  
**Read first with:** `RELEASE-STATE.json`, `LOCAL-BUILD-WORKFLOW.md`, and `AI-WORKFLOW.md`.

## Current device-test candidates

### Native
- **Private Gather Native 1.3.0 Rev4 Rev5 — Incoming Call, Video & Splash Stability**
- Complete direct Windows build kit: `Private-Gather-Native-App-1.3.0-Rev4-Rev5-Incoming-Call-Video-Splash-Stability-Complete-Direct-Windows-Build-Kit.zip`
- SHA-256: `01b006ed38445b3f479b84a3617664a9004455a939ba680aba067968f13d84a0`
- Status: **prepared candidate / physical-device testing**
- Not claimed GitHub-validated as Rev5, not device accepted, not live.

### Website/backend
- **Private Gather 1.1.207 — Web Call Ringtone & Visual Stability**
- Core: `Private-Gather-1.1.207-Web-Call-Ringtone-Visual-Stability-Core.zip`
- Core SHA-256: `e39c57f48844e2b16b979d61ab0afd5106b9d2ce9741a3f761f37b46c3c6a8f3`
- Sequential Upgrade from 1.1.206: `Private-Gather-1.1.206-to-1.1.207-Web-Call-Ringtone-Visual-Stability-Upgrade.zip`
- Upgrade SHA-256: `3c307fab514ba33ceba29be89c6848a165897b482bab4970494725fd97273abc`
- Exact upgrade replay: PASS, zero missing/extra/hash mismatches.
- 1.1.207 adds no migration; migration count remains 115.
- Installation/acceptance remains unconfirmed until the user reports success.

## Permanent artifact/build workflow
Always hand off three separate ZIPs by default:
1. Website Core
2. Website Upgrade
3. complete Native App build kit

The user extracts the Native kit directly to `C:\PrivateGatherNative\`. Do not switch the user to GitHub clone/checkout/Actions or overlay patches unless explicitly requested.

Build/install both native apps:
```powershell
cd C:\PrivateGatherNative
powershell -ExecutionPolicy Bypass -File .\scripts\build-install-both.ps1
```

Then start both Metro servers:
```powershell
cd C:\PrivateGatherNative
powershell -ExecutionPolicy Bypass -File .\scripts\start-both-metro.ps1
```

Main uses 8081; Messenger uses 8082.

## Native architecture
Two separate native apps remain:
- **Main Private Gather:** Home, Discover, Events, Clubs, profile/account, verification/privacy/safety, general notifications, Messenger handoff.
- **Private Gather Messenger:** conversations, realtime messaging state, incoming calls, ringtone, native voice/video, CallKeep/Android Telecom/CallKit.

**Messenger is the sole native Telecom owner. Main must not register an Android Telecom PhoneAccount.**

## Rev4 Rev5 device findings and repairs

### 1. Incoming call rang but had no persistent full-screen controls
Device report:
- mobile ringtone could be heard
- no usable full-screen incoming-call visual
- opening Messenger showed video/Answer/Decline briefly, then controls disappeared

Root cause:
- foreground Messenger rendered the React incoming-call screen
- the same path then canceled the system notification with a retract broadcast and launched the native incoming-call Activity
- the retract could close the newly launched Activity, creating the brief flash/disappearance

Rev5 ownership:
- **Foreground Messenger:** React Messenger call screen is authoritative and keeps Answer/Decline visible
- **Background/locked/killed Messenger:** native Android incoming-call Activity/full-screen notification is authoritative
- notification-only dismissal no longer broadcasts a terminal retract

### 2. Native full-screen incoming-call path
- fresh Android channel: `pg-messenger-calls-v130r5`
- `NotificationCompat.CallStyle.forIncomingCall`
- full-screen intent
- public/ongoing/high-priority call notification behavior
- `FLAG_SHOW_WHEN_LOCKED`, `FLAG_TURN_SCREEN_ON`, `FLAG_DISMISS_KEYGUARD`, `FLAG_KEEP_SCREEN_ON`, fullscreen activity flags
- physical-device/OS permission behavior still requires testing; do not claim every Android state is guaranteed

### 3. Mobile call video looked too zoomed
Rev5:
- Messenger full remote/local call video uses fit/contain
- legacy native call screen uses contain
- Android incoming preview uses `Matrix.ScaleToFit.CENTER`
- camera zoom is set to zero when supported
- PIP may remain crop/cover

### 4. Messenger appeared to load a second splash
Rev5 Messenger config removes:
- custom Private Gather startup overlay
- `expo-splash-screen` config plugin

Messenger JS bootstrap uses a blank surface instead of another spinner/splash. Main keeps the branded Private Gather startup/progress splash.

### 5. Web incoming ringtone restarted too early
The calling audio is approximately **8.306938 seconds**.

Website 1.1.207:
- HTMLAudio ringtone sets `loop=false`
- restarts only on the actual `ended` event
- WebAudio source sets `loop=false` and creates the next source only from `onended`
- explicit stop invalidates pending replay generation
- incoming-call pre-navigation handoff no longer starts a sound that page navigation cuts off 90ms later
- dedicated call-page fallback also restarts only on actual media end

This is intended to let the complete ringtone play before the next loop instead of repeatedly restarting early.

### 6. Web Answer/Decline labels were gray
Website 1.1.207 forces incoming Answer/Decline/End call text to white with full opacity and a small shadow for contrast.

## Existing Rev4 behavior preserved
- Messenger Show/Hide Password
- no password auto-capitalization/autocorrect
- Website dedicated native-login limiter
- combined private Firebase Android client config for Main and Messenger
- realtime `incoming.call`, `call.claimed`, and `call.ended`
- cross-device answer retracts stale ringing without ending active call
- failed mobile takeover of an already-active web call performs local-only cleanup
- remote cancel/end clears native call state
- Rev4 Rev2 `reactContext` config-plugin fix
- Rev4 Rev3 Messenger notification-anchor fix
- Rev4 Rev4 `expo-system-ui` and PowerShell native stderr/exit-code handling
- one-command two-app build/install

## Rev5 validation boundary
Completed from packaged bytes:
- Native `npm run check:ready`: PASS, 0 failures
- generated Messenger native-call dangerous-mod composition: PASS
- TypeScript/TSX syntax/transpile: 65 files, 0 diagnostics
- Native ZIP integrity: PASS
- Native internal manifest: 150 files, 0 mismatches
- Native Firebase Main+Messenger package verification: PASS
- Firebase Admin/service-account secret scan: 0 hits
- Website PHP lint: 583 files, 0 failures
- Website JS syntax: PASS
- Website Core manifest: 1036 entries verified
- 1.1.206→1.1.207 exact replay: PASS
- Website migration count: 115; 1.1.207 adds 0

Not completed in the packaging container:
- fresh full `npm install`
- Expo clean prebuild for both flavors
- Gradle compile for both APKs
- physical-device behavior

The user's normal Windows workflow performs those gates. Do not overstate Rev5 as device-tested/live.

## Firebase/push boundary
The private combined Android `google-services.json` contains clients for:
- `com.privoralabs.privategather`
- `com.privoralabs.privategather.messenger`

It may be included in the private direct Native kit and is Git-ignored.

Firebase Admin/service-account credentials remain only in the user's external push deployment:
`/home/privoralabsweb/private-gather-push`

Never include the Admin/service-account JSON/private key in Website Core, Upgrade, Native kit, or public GitHub.

## Acceptance still required
1. Install website 1.1.207 over 1.1.206.
2. Build/install Rev4 Rev5 Main + Messenger using the normal direct-kit command.
3. Start dual Metro with the existing script.
4. Closed/locked/background incoming call: full visible native call surface with Answer/Decline.
5. Foreground incoming call: React Answer/Decline controls remain visible and usable.
6. Remote/local video is not excessively cropped/zoomed.
7. No second Messenger splash flash.
8. Web ringtone completes the full clip before looping.
9. Web Answer/Decline labels are clearly white/readable.
10. Cross-device claim/cancel/end behavior remains stable.
11. Explicit user acceptance before promotion.

## Release vocabulary
Prepared candidate → GitHub-validated candidate → Device-tested candidate → Confirmed live baseline. Quarantine/supersede failed candidates. Never promote automatically.
