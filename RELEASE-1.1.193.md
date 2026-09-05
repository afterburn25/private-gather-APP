# Private Gather Native 1.1.193 — Closed-App FCM, Pre-Answer Camera & Remote Video Repair

Prepared test candidate. Requires Laravel backend 1.1.193 and push gateway 1.1.193.

- Android now always registers a native FCM token; a missing Metro environment variable can no longer silently fall back to Expo push mode.
- Android incoming calls use a real FCM notification+data message so the OS can display and sound the call while the app is backgrounded or terminated.
- New immutable call channel `pg-calls-v193` uses the bundled Private Gather ringtone.
- Incoming video calls start a camera-only local preview before Answer. The preview is local-only and is replaced by full A/V after Answer.
- Remote WebRTC track handling creates a MediaStream when react-native-webrtc supplies a track without `event.streams[0]`.
- Foreground calls suppress duplicate system notifications; the in-app call UI/ringtone owns that state.
