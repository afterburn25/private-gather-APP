# Private Gather Native 1.1.194 — Full-Screen Incoming Call, 90s Ring Window, Video Preview & Crest Repair

Prepared test candidate. Requires Laravel/backend 1.1.194 and native push gateway 1.1.194.

Repairs:
- Android incoming calls received while Private Gather is backgrounded or terminated are handled by a native FirebaseMessagingService rather than a JavaScript background task.
- The native service posts a CATEGORY_CALL, PRIORITY_MAX notification with a full-screen intent, and the MainActivity is allowed to show over the lock screen and turn the screen on.
- The full-screen call launch deep-links directly into the pending Private Gather call with call id, mode and caller name.
- Incoming video starts a local camera-only preview before Answer.
- Outgoing video starts the local camera preview before the server call setup/remote answer completes.
- Remote WebRTC tracks are rebuilt into a fresh MediaStream per track event; RTCView is remounted when remote media changes; native offers explicitly request audio/video receive directions; missing remote video triggers up to two renegotiation/restart attempts.
- Removes the JavaScript second splash. Private Gather now uses one native splash only.
- Restores the complete official heart-lock crest from the 1.1.187 brand assets and adds safe padding so the top of the heart is not clipped.
