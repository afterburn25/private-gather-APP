# Private Gather Native 1.1.192 — Closed-App Call Alert, Verified Media CTA & Native Call Target Repair

Prepared native candidate. Requires matching Laravel backend 1.1.192 for the native call-start and feed-lock metadata changes.

Repairs:
- Community nude/18+ wall media now carries an explicit locked state and verification URL. The native wall overlays “Verify to view” directly on the blurred image.
- Native calls no longer depend on Laravel route-model binding with `/calls/start/{user}`. The app sends conversation/user/username identity to `/calls/start-native`; the backend resolves the real peer server-side.
- Conversation-originated calls use the conversation id as the strongest identity source, removing the conversation-id/user-id ambiguity that produced `No query results for model [App\Models\User] 1`.
- Incoming call screen fetches the real call detail and shows the caller’s Private Gather call/profile photo instead of a black empty screen before answer.
- Video calls show the local camera preview immediately after Answer while WebRTC negotiates the remote stream.
- Foreground ringtone uses the bundled Private Gather calling.mp3 with audio activation plus vibration fallback.
- Android uses a brand-new immutable notification channel `pg-calls-v192` with bundled `calling.wav`; this avoids old Android channels retaining a silent or regular-phone sound.
- Android background/terminated headless FCM pushes create a Private Gather incoming-call notification with Answer/Decline actions and the Private Gather call sound instead of opening CallKeep’s regular phone UI.
- All 1.1.191 authenticated media, transparent logo, safe-area, public wall and full-profile work is preserved.

Important deployment boundary:
- Closed/swiped-away Android call delivery requires a working FCM server delivery path. Use the included Private Gather Native Push Gateway 1.1.192 and configure Laravel `PG_NATIVE_PUSH_GATEWAY_URL` / `PG_NATIVE_PUSH_GATEWAY_SECRET`.
- Android cannot receive push after the user explicitly Force Stops the app in system settings until the app is opened again.
