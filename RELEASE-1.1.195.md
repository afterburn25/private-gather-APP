# Private Gather Native 1.1.195 — Fast Ring, Direct Call Wake, Media & Video Recovery

Prepared test candidate.

Repairs:
- Outgoing calls start the server request and full local A/V acquisition in parallel, so the other member can begin ringing immediately while the caller's own preview appears as soon as the camera is ready.
- Incoming Answer is posted to the server before camera/microphone/Reverb setup, preventing the call from expiring while the app is opening.
- Incoming video starts a local camera-only preview before Answer; that preview is stopped before the full A/V stream opens to avoid Samsung camera contention.
- Outgoing video uses the actual full call camera stream as the waiting preview instead of opening the camera twice.
- Remote WebRTC video keeps the canonical event stream when supplied, has a track-only fallback, post-answer offer recovery, and repeated remote-video recovery.
- Android notification tap/full-screen intents are explicit ACTION_VIEW deep links to MainActivity so they land directly on the matching call.
- Android 14+ users are offered the OS full-screen incoming-call permission page.
- New immutable call channel: pg-calls-v195.
- Protected native images use React Native Image Authorization headers directly instead of cached `.media` files.
- Verification CTA falls back to https://privategather.com/verification.
- One native splash remains; no JavaScript splash is added.
