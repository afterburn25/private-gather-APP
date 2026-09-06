# Private Gather — Direct Local Build Workflow

**Effective:** 2026-09-06

This file is the user-directed workflow override for Private Gather native device testing and build-kit handoff. Future chats must read this file together with `RELEASE-STATE.json`, `AI-WORKFLOW.md`, and `PRIVATE-GATHER-MASTER-HANDOFF.md`.

## Permanent packaging rule
Always deliver these as **separate artifacts** unless the user explicitly asks for a combined bundle:

1. **Website Core ZIP**
2. **Website Upgrade ZIP**
3. **Native App complete build-kit ZIP**

Do not combine website and native artifacts into one acceptance bundle by default. Do not hand off a one-file overlay/patch when the user asks for the app kit; provide a complete replacement Native App build kit.

## Native user-facing build/test workflow
The normal device-test workflow is **direct local kit only**. Do not require the user to clone GitHub, checkout a commit, switch branches, run GitHub Actions, download CI artifacts, or change workflows unless the user explicitly requests that process.

Expected root:
`C:\PrivateGatherNative\package.json`

Standard Main-only PowerShell flow:

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
adb devices
adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk
```

Start Main Metro:

```powershell
cd C:\PrivateGatherNative
npx expo start --dev-client --clear
```

Launch Main when needed:

```powershell
adb shell monkey -p com.privoralabs.privategather -c android.intent.category.LAUNCHER 1
```

## One-command Main + Messenger local build/install
Private Gather and Private Gather Messenger remain two separate Android packages. A normal single APK does not silently install two package IDs. The supported direct-kit convenience workflow builds and installs both apps with one PowerShell command:

```powershell
cd C:\PrivateGatherNative
powershell -ExecutionPolicy Bypass -File .\scripts\build-install-both.ps1
```

That script runs the normal dependency/readiness/typecheck gates, clean-prebuilds and builds Main, clean-prebuilds and builds Messenger, copies both APKs to `dist\`, then installs both with ADB.

Optional `-CleanInstall` intentionally uninstalls both apps first and therefore clears their local app data. Do not use it unless a clean install is desired.

Start both Metro servers for the two dev clients:

```powershell
cd C:\PrivateGatherNative
powershell -ExecutionPolicy Bypass -File .\scripts\start-both-metro.ps1
```

This starts Main on port 8081 and Messenger on port 8082 and configures ADB reverse mappings.

## Version-code behavior during device testing
Android may reject an install with `INSTALL_FAILED_VERSION_DOWNGRADE` when a newly generated dev build has a lower `versionCode` than an installed build. The user previously chose to uninstall the old build and reinstall cleanly rather than changing versionCode solely for this condition. Do not silently change versionCode unless the user asks.

## Current native candidate
Current direct local candidate:

- **Native version:** `1.3.0 Rev3`
- **Artifact:** `Private-Gather-Native-App-1.3.0-Rev3-Loading-Push-Navigation-Call-Repair-Complete-Direct-Windows-Build-Kit.zip`
- **SHA-256:** `a856b8deaeeef7fc12dc9d00b36d2e5741e9310dcfadb34786ae9e2e578dbf10`
- **Status:** prepared / physical-device test candidate; not confirmed live and not claimed GitHub-validated as Rev3

Rev3 includes the existing Native 1.3 foundation plus:
- Safety Center large Main-body card directly below Verification
- Main does not own Android Telecom/CallKeep PhoneAccount registration; Messenger remains Telecom owner
- branded startup splash remains first visible surface
- actual React Native/Metro bundling percentage is routed into the splash progress bar in development
- default gray React Native `Bundling …%` popup is suppressed by the postinstall React Native 0.86.3 compatibility patch
- staged startup progress is used when an actual Metro bundle percentage is unavailable
- Main Firebase Android configuration is included privately in the direct kit and validated for package `com.privoralabs.privategather`
- Messenger Firebase remains pending a Messenger-specific Firebase Android client/config for `com.privoralabs.privategather.messenger`
- persistent Main bottom navigation remains visible on authenticated content/detail pages
- unified branded top header shows Private Gather plus current page title/subtitle
- Messenger full-screen incoming-call permission opens the Messenger Android settings surface and reports a failure instead of silently doing nothing
- a web/server-side canceled incoming call clears the native incoming UI and immediately stops Messenger ringtone
- one-command Main + Messenger build/install scripts are included

## Current website artifacts paired with Rev3
Keep these separate from the Native App ZIP:

- **Website prepared Core: 1.1.205** — `Private-Gather-1.1.205-Native-Verification-Handoff-Stability-Core.zip`
- Core SHA-256: `5000763f27745b78221a730e8365c8bb5a39a42bd57609f8ccc68f8f926b3273`
- **Direct Website Upgrade: 1.1.201 → 1.1.205** — `Private-Gather-1.1.201-to-1.1.205-Native-Verification-Handoff-Stability-Direct-Upgrade.zip`
- Upgrade SHA-256: `636c6eff538d66bfba56e44d2580d46558475616ff1f0361d43e9044f22f02ce`

Website 1.1.205 adds no new migration. It repairs native verification handoff so the same active verification bridge token/URL is reused for a short window instead of minting a new token on every tap, and keeps reasonable rate protection.

## Firebase credential rule
The direct private Native App kit may contain required build credentials/configuration supplied by the user. Do **not** copy Firebase credential files or values into public GitHub documentation/source unless the user explicitly asks and it is safe to do so.

Main currently has a valid private Firebase Android config. Messenger push requires a separate Firebase client registered for `com.privoralabs.privategather.messenger`; until that exists, Messenger Firebase/push readiness should warn rather than pretend it is configured.

## Architecture rule relevant to calling
Private Gather uses two native apps:
- **Main Private Gather:** community/profile/discover/events/settings and handoff to communication.
- **Private Gather Messenger:** conversations, messaging, native incoming calls, ringtone, CallKeep/CallKit/Android Telecom ownership.

Main must not register its own Android Telecom PhoneAccount unless the architecture is explicitly changed later.

## Continuity rule
Future chats must preserve this direct complete-kit workflow unless the user explicitly changes it. GitHub remains a durable documentation/source archive, but it must not replace the user's local build/install workflow without approval.
