# Private Gather — Direct Local Build Workflow

**Effective:** 2026-09-06

This is the user-directed workflow override for Private Gather device testing and artifact handoff. Future chats must preserve it unless the user explicitly changes it.

## Permanent packaging rule
Always deliver these as separate artifacts by default:
1. **Website Core ZIP**
2. **Website Upgrade ZIP**
3. **Native App complete build-kit ZIP**

Do not combine them unless explicitly requested. Do not substitute a one-file overlay for the complete Native App kit.

## Native user-facing workflow
Do not require Git clone, checkout, branch switching, GitHub Actions, or CI artifact downloads for normal device testing. GitHub remains a durable source/documentation archive only.

Extract the complete Native App kit so this exists:
`C:\PrivateGatherNative\package.json`

### Preferred one-command two-app build/install
```powershell
cd C:\PrivateGatherNative
powershell -ExecutionPolicy Bypass -File .\scripts\build-install-both.ps1
```
This builds **Private Gather Main** and **Private Gather Messenger** as separate package IDs and installs both through ADB.

If Android reports VERSION_DOWNGRADE and the user accepts clearing local app data:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-install-both.ps1 -CleanInstall
```
Never choose CleanInstall silently.

### Dual Metro
```powershell
cd C:\PrivateGatherNative
powershell -ExecutionPolicy Bypass -File .\scripts\start-both-metro.ps1
```
Main uses 8081; Messenger uses 8082.

### Manual Main build remains supported
```powershell
cd C:\PrivateGatherNative
npm install --no-audit --no-fund
npm run check:ready
npm run typecheck
npx expo prebuild --clean --platform android
cd android
.\gradlew.bat assembleDebug --no-daemon --max-workers=1
```

## Current candidate
- Native: **1.3.0 Rev4 Rev2**
- Artifact: `Private-Gather-Native-App-1.3.0-Rev4-Rev2-Prebuild-Template-Interpolation-Hotfix-Complete-Direct-Windows-Build-Kit.zip`
- SHA-256: `d92f848fdfc2884629242c7fb84912d1b6d59212d6bbe3c8d07e9d3ff823fa38`
- Status: **prepared candidate / physical-device testing**

Rev4 Rev2 supersedes the original Rev4 Native App ZIP. The original Rev4 failed Main `expo prebuild --clean` with `PluginError: reactContext is not defined` because a Kotlin `${reactContext.packageName}` expression inside `withPrivateGatherNativeCalling.js` was not escaped for the JavaScript template literal. Rev4 Rev2 escapes it and adds a readiness regression scan so unescaped `${reactContext...}` plugin-template interpolation fails before prebuild.

All Rev4 behavior remains included:
- Messenger Show/Hide Password; no password auto-capitalization/autocorrect.
- Combined private Firebase Android client configuration for both Main and Messenger; never publish that JSON to GitHub.
- Messenger realtime `incoming.call`, `call.claimed`, and `call.ended` handling.
- Cross-device answer retracts stale ringing/incoming UI on the other device without ending the active call.
- Failed mobile takeover of an already-active web call performs local cleanup only.
- Remote cancel/end retracts Messenger ringtone, notification, and Android incoming-call activity.
- Ringtone uses native audio looping without repeatedly restarting the clip.
- Messenger does not use a second branded Private Gather startup overlay/splash.

## Paired website candidate
Website **1.1.206 is unchanged by Rev4 Rev2**. Do not reinstall the website solely for this Native prebuild hotfix.

- Website Core: **1.1.206** — `Private-Gather-1.1.206-Native-Messenger-Sign-In-Call-Lifecycle-Stability-Core.zip`
- Core SHA-256: `d66bc3a82c47a6d9832f8bbf7f391bbe5931450e532b3d45021e2024d45a171b`
- Direct Upgrade: **1.1.201 → 1.1.206** — `Private-Gather-1.1.201-to-1.1.206-Native-Messenger-Call-Lifecycle-Stability-Direct-Upgrade.zip`
- Upgrade SHA-256: `f613e2834c321a58878777f468dda04e02f39e9d802eb4d519cf442bb87a87ef`

## Calling ownership
Messenger owns Android Telecom/CallKeep/native incoming calls. Main must not register an Android Telecom PhoneAccount unless the architecture is deliberately changed.

## Credential boundary
Firebase Admin/service-account credentials stay in the external server push-gateway deployment. They are never packaged in the Native App kit and never committed to public GitHub. The direct native kit may contain the Android `google-services.json` client config needed to build the two APKs, and Git ignores it.
