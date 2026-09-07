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

This builds **Private Gather Main** and **Private Gather Messenger** as separate package IDs and installs both through ADB. It runs `npm install --no-audit --no-fund`, `npm run check:ready`, and `npm run typecheck` before native prebuild/build.

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

Prebuild logs remain:
- `dist\prebuild-main.log`
- `dist\prebuild-messenger.log`

## Current native candidate
- Native: **1.3.0 Rev4 Rev5**
- Artifact: `Private-Gather-Native-App-1.3.0-Rev4-Rev5-Incoming-Call-Video-Splash-Stability-Complete-Direct-Windows-Build-Kit.zip`
- SHA-256: `01b006ed38445b3f479b84a3617664a9004455a939ba680aba067968f13d84a0`
- Status: **prepared candidate / physical-device testing**
- Do not call it device-tested, GitHub-validated as Rev5, live, or confirmed until the required evidence exists and the user explicitly accepts it.

Rev4 Rev5 preserves all Rev4 Rev4 build/Firebase/login/call-lifecycle work and adds:
- Foreground Messenger owns the React incoming-call screen; it does not launch and then retract the native incoming activity.
- Background/locked/killed Messenger uses the native Android full-screen incoming-call activity.
- Android incoming calls use a fresh `pg-messenger-calls-v130r5` call channel plus `NotificationCompat.CallStyle.forIncomingCall` and full-screen intent.
- Foreground cleanup can dismiss only the notification without broadcasting a terminal call retract.
- Full-screen call video uses fit/contain; native incoming camera preview uses fit-center instead of crop/zoom.
- Messenger omits both the custom startup overlay and the Expo splash plugin, and its JS bootstrap is blank, eliminating the extra Messenger splash layer.
- Main retains the branded startup/progress splash.

Packaged validation:
- `npm run check:ready`: PASS, 0 failures
- generated Messenger dangerous-mod composition: PASS
- TypeScript/TSX syntax/transpile: 65 files, 0 diagnostics
- ZIP integrity: PASS
- internal build-kit manifest: 150 files, 0 mismatches
- Firebase Admin/service-account secret hits: 0

Full clean Expo prebuild, Gradle compile, and physical-device acceptance are still performed in the user's normal Windows workflow; do not overstate packaging validation.

## Paired website candidate
- Website Core: **1.1.207** — `Private-Gather-1.1.207-Web-Call-Ringtone-Visual-Stability-Core.zip`
- Core SHA-256: `e39c57f48844e2b16b979d61ab0afd5106b9d2ce9741a3f761f37b46c3c6a8f3`
- Sequential Upgrade: **1.1.206 → 1.1.207** — `Private-Gather-1.1.206-to-1.1.207-Web-Call-Ringtone-Visual-Stability-Upgrade.zip`
- Upgrade SHA-256: `3c307fab514ba33ceba29be89c6848a165897b482bab4970494725fd97273abc`
- Upgrade replay: exact PASS, zero missing files, extra runtime files, or hash mismatches
- 1.1.207 adds no migration; migration count remains 115

Website 1.1.207:
- waits for the actual end of `calling.mp3` before replaying the web incoming ringtone
- prevents pre-navigation ringtone start/cutoff/restart
- uses the same natural-end behavior on the call-page fallback
- forces Answer/Decline/End call labels to white for readable contrast

## Calling ownership
Messenger remains the only native Telecom/CallKeep owner. Main must not register Android Telecom PhoneAccount.

For incoming calls:
- **Messenger foreground:** React Messenger call UI owns the visible Answer/Decline surface.
- **Messenger background/locked/killed:** native Android incoming-call Activity/full-screen notification owns the visible surface.

## Credential boundary
Firebase Admin/service-account credentials stay in the user's external server push-gateway deployment at `/home/privoralabsweb/private-gather-push`. They are never packaged in the Website or Native artifacts and never committed to public GitHub.

The private Native build kit may contain the combined Android `google-services.json` client configuration for:
- `com.privoralabs.privategather`
- `com.privoralabs.privategather.messenger`

Git ignores that private client file.

## Promotion rule
Prepared candidate → GitHub-validated candidate → Device-tested candidate → Confirmed live baseline.

Never promote automatically. Physical-device success and explicit user acceptance are required.
