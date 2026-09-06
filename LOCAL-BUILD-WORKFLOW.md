# Private Gather — Direct Local Build Workflow

**Effective:** 2026-09-06

This file is the user-directed workflow override for Private Gather native device testing and build-kit handoff. Future chats must read this file together with `AI-WORKFLOW.md`, `RELEASE-STATE.json`, and `PRIVATE-GATHER-MASTER-HANDOFF.md`.

## Permanent packaging rule
Always deliver these as separate artifacts unless the user explicitly asks for a combined bundle:

1. **Website Core ZIP**
2. **Website Upgrade ZIP**
3. **Native App complete build-kit ZIP**

Do not combine website and native artifacts into one acceptance bundle by default. Do not hand off a one-file overlay/patch when the user asks for the app kit; provide a complete replacement Native App build kit.

## Native user-facing build/test workflow
The normal device-test workflow is **direct local kit only**. Do not require the user to clone GitHub, checkout a commit, switch branches, run GitHub Actions, download CI artifacts, or change workflows unless the user explicitly requests that process.

The expected workflow is:

1. Assistant prepares a **complete Native App build-kit ZIP**.
2. User replaces/extracts it to `C:\PrivateGatherNative\` so `C:\PrivateGatherNative\package.json` exists.
3. User builds locally in PowerShell.
4. User installs with ADB and tests on the physical device.
5. Device findings are reported back and folded into the next complete Native App kit.

GitHub remains useful as a durable source/documentation/archive and for cross-chat continuity, but it is not a required step in the user's local device-test handoff.

## Standard Windows / Android commands

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

Start Metro for the dev-client build:

```powershell
cd C:\PrivateGatherNative
npx expo start --dev-client --clear
```

Launch Main when needed:

```powershell
adb shell monkey -p com.privoralabs.privategather -c android.intent.category.LAUNCHER 1
```

## Version-code behavior during device testing
Android may reject an install with `INSTALL_FAILED_VERSION_DOWNGRADE` when a newly generated dev build has a lower `versionCode` than the installed app. The user has previously chosen to uninstall the old build and reinstall cleanly rather than changing the current 1.3.0 kit solely for that condition. Do not silently change versionCode because of this unless the user asks.

## Current native candidate
Current direct local candidate being device-tested:

- **Native version:** `1.3.0 Rev2`
- **Artifact:** `Private-Gather-Native-App-1.3.0-Rev2-Telecom-Startup-Splash-Repair-Complete-Direct-Windows-Build-Kit.zip`
- **SHA-256:** `fd92264e5af2ce79e92fb9da4e6fa61a52878865333314261eabc752fa9114bc`
- **Status:** prepared/device-test candidate; not confirmed live

Rev2 includes:
- Native 1.3 account/profile/privacy foundation
- default-off adult-content control
- Discreet Profile / Privacy Shield foundation
- Safety Center / App Lock
- Safety Center displayed as a large card in the Main app's Me body directly below Verification, not as a tiny footer/bottom row
- Main app does **not** own Android Telecom/CallKeep PhoneAccount registration
- Private Gather Messenger remains the native calling/Telecom owner
- startup splash repair: branded native startup overlay/splash appears before React/Metro startup UI and covers white/gray/dev bundle-counter loading until the app is ready

## Current website artifacts paired with Native 1.3 work
Keep separate from the Native App ZIP:

- Website prepared Core: **1.1.204** — `Private-Gather-1.1.204-Default-Off-Adult-Content-Marketplace-Safety-Core.zip`
- Direct Website Upgrade: **1.1.201 → 1.1.204** — `Private-Gather-1.1.201-to-1.1.204-Native-Wave-A-Adult-Content-Direct-Upgrade.zip`
- Website Core and Upgrade are independent from the Native App build kit.

## Architecture rule relevant to CallKeep
Private Gather uses two native apps:
- **Main Private Gather:** community/profile/discover/events/settings and handoff to communication.
- **Private Gather Messenger:** conversations, messaging, native incoming calls, CallKeep/CallKit/Android Telecom ownership.

Main must not register its own Android Telecom PhoneAccount unless the architecture is explicitly changed later. This avoids the Android `SecurityException` caused by an unguarded ConnectionService/PhoneAccount registration in Main.

## Continuity rule
Future chats must preserve this workflow unless the user explicitly changes it. If older documentation says the user must use a GitHub-first device-test handoff, this file is the newer user-directed workflow and takes precedence for **user-facing build/install/testing**. GitHub CI may still be used internally or when explicitly requested, but it must not replace the direct complete-kit workflow without user approval.
