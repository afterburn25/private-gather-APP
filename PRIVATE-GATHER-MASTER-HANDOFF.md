# Private Gather — Master Handoff

**Last refreshed:** 2026-09-06  
**Read first with:** `RELEASE-STATE.json`, `LOCAL-BUILD-WORKFLOW.md`, and `AI-WORKFLOW.md`.

## Current device-test candidates
### Native
- **Private Gather Native 1.3.0 Rev4 — Messenger Login & Cross-Device Call Lifecycle Repair**
- Complete direct Windows build kit: `Private-Gather-Native-App-1.3.0-Rev4-Messenger-Login-Cross-Device-Call-Lifecycle-Complete-Direct-Windows-Build-Kit.zip`
- SHA-256: `a614d1402b79bd46480a722c400ae0ca8152454643bb82261ec27c764eaf8a93`
- Status: **prepared candidate / physical-device testing**; not GitHub-validated as Rev4, not device accepted, not live.

### Website/backend
- **Private Gather 1.1.206 — Native Messenger Sign-In & Call Lifecycle Stability**
- Core: `Private-Gather-1.1.206-Native-Messenger-Sign-In-Call-Lifecycle-Stability-Core.zip`
- Core SHA-256: `d66bc3a82c47a6d9832f8bbf7f391bbe5931450e532b3d45021e2024d45a171b`
- Direct Upgrade from last user-reported 1.1.201: `Private-Gather-1.1.201-to-1.1.206-Native-Messenger-Call-Lifecycle-Stability-Direct-Upgrade.zip`
- Upgrade SHA-256: `f613e2834c321a58878777f468dda04e02f39e9d802eb4d519cf442bb87a87ef`
- Direct-upgrade replay to the 1.1.206 candidate: PASS, zero runtime file/hash mismatches.
- 1.1.206 itself adds no migration; cumulative 1.1.201→1.1.206 adds only the two 1.1.203/1.1.204 migrations.

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

## Rev4 device findings and repairs
Reported after Rev3:
- Messenger sign-in could show `Too many attempts` before succeeding.
- Messenger password needed Show/Hide and should not auto-capitalize.
- Web incoming call could fail to appear in open Messenger; closed/killed Messenger calls were unreliable.
- Cross-device web/mobile answer/takeover could leave stale incoming UI; one failed mobile takeover caused the web call to disappear and Messenger to crash.
- Remote web cancel could leave Messenger ringing.
- Ringtone could restart repeatedly instead of letting the clip complete before looping.
- User does not want a separate branded Messenger splash screen.

Rev4 repairs:
- Messenger login Show/Hide Password; `autoCapitalize=none`, autocorrect off.
- Website 1.1.206 dedicated native-login limiter: 24/min account+IP, 72/min IP, 180/hour IP; friendly JSON retry response.
- Messenger realtime engine now handles `incoming.call`, `call.claimed`, and `call.ended` user events.
- Answering a call emits `call.claimed` to the callee's devices. Non-answering devices retract stale incoming UI/ringtone without ending the call.
- If mobile tries to join a call already active on web and local mobile setup fails, only the mobile attempt is torn down; the server/web call is not ended.
- Server terminal state emits `call.ended` realtime and native push retracts.
- Android incoming-call notification/activity receives retract signals for claimed/ended calls.
- Native ringer uses audio-engine loop and starts only once; website shared ringer start is idempotent so observers do not restart the clip.
- Messenger skips the extra branded startup overlay/splash; Main keeps the branded startup/progress experience.

## Firebase/push boundary
A private combined Android `google-services.json` supplied by the user contains Firebase clients for both package IDs. Rev4's direct Native kit uses it for Main and Messenger and Git ignores it. **Do not commit it to public GitHub.**

Firebase Admin/service-account credentials remain only in the user's existing external server push-gateway deployment. Never include the service-account JSON/private key in Website Core, Upgrade, Native App kit, or public GitHub.

Website 1.1.206 restricts native call push targeting to Messenger-role device registrations (`capabilities.app_role=messenger` or Messenger device naming), so Main registrations do not own incoming calls.

## Existing Rev3 behavior to preserve
- Main Safety Center is a large body card directly below Verification.
- App Lock/PIN/biometrics.
- Main branded splash is first visible surface; actual Metro dev bundle progress is reflected in its progress bar and the default gray DevLoading strip is suppressed.
- Main bottom navigation remains persistent across detail pages.
- Unified brand/page/subtitle header.
- Main Firebase client initialization.
- One-command two-app build/install.
- 1.1.205 verification launch reuses the active bridge handoff for 10 minutes.
- default-OFF adult-content controls and Discreet Profile foundation.

## Acceptance still required
1. Install website 1.1.206 over the actual current website version using the appropriate Update Center package.
2. Build/install Rev4 Main + Messenger using the direct kit.
3. Repeated Main/Messenger sign-ins without inappropriate 429s.
4. Open-app web→Messenger and Messenger→web call arrival.
5. Closed/background Messenger incoming-call FCM delivery.
6. Answer on web while mobile rings: mobile must retract without ending web call.
7. Answer on mobile while web rings: stale web/mobile surfaces clear correctly and call remains active.
8. Cancel/end from either side: ringtone, notification, native incoming activity clear immediately.
9. Ringtone plays the full audio clip before natural loop.
10. No separate branded Messenger splash.
11. Explicit user acceptance before promotion.

## Release vocabulary
Prepared candidate → GitHub-validated candidate → Device-tested candidate → Confirmed live baseline. Quarantine failed candidates. Never promote automatically.
