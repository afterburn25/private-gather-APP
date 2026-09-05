# Private Gather Native 1.2.1 — Full-Screen Call, Stable Video & Home-Return Repair

Status: prepared development candidate. Do not promote to live until physical-device testing is explicitly accepted.

Device feedback addressed from 1.2.0:
- Remote video appeared full-screen but transparent system-bar/letterbox regions remained.
- Outgoing video flickered rapidly immediately after the callee answered.
- Incoming calls could remain as a heads-up strip instead of presenting the call full-screen.
- Returning from Messenger left the main Private Gather app on the Messages bridge instead of Community Home.
- Dedicated Messenger receives the temporary purple heart-shaped chat-bubble + lock launcher identity.

1.2.1 changes:
- Messenger call mode hides Android status/navigation bars with sticky immersive native control.
- Video-mode UI no longer binds RTCView to an audio-only remote MediaStream before the remote video track exists.
- Local and remote full-screen RTC surfaces are separate; the remote surface is mounted only when a remote video stream exists.
- Android incoming calls can be promoted directly to the native full-screen incoming-call Activity while full-screen intent remains the background/lock-screen fallback.
- The native incoming-call Activity owns its full-screen camera preview and looping ringtone until Answer/Decline.
- Messenger now correctly consumes native incoming-call deep links for Answer/Decline by call ID.
- Main app Messages handoff records the actual external-app transition and returns the main app to Home when it becomes active again.
- Native Validate now automatically packages exact validated main source plus both Android APK artifacts after every successful main run.

No Laravel/database change is required for these native repairs. The previously prepared 1.2.0 backend foundation remains the backend dependency for secure handoff/device-role routing if not already installed.
