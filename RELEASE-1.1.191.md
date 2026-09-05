# Private Gather Native 1.1.191 — Authenticated Media, Calling Boot & Transparent PWA Splash Repair

Prepared native candidate. Backend remains 1.1.190; no server upgrade is required for this package.

Repairs:
- Protected profile, cover, speaker and Community-wall images are now downloaded with the native bearer token into the app-private cache before rendering. This avoids Android image-loader loss of Authorization headers.
- Push-token registration, notification-channel setup and Reverb availability can no longer prevent the native calling subsystem from starting.
- Foreground incoming-call polling starts even when push registration or realtime setup is unavailable.
- Outgoing and answered calls can negotiate through the durable HTTP call poller when Reverb is unavailable.
- Android explicitly requests microphone/camera permission at call start/answer and reports a useful error if permission is denied.
- Foreground incoming polling no longer opens Android's normal telecom UI before the Private Gather call screen.
- Failed outgoing media setup closes the server call instead of leaving a stale ringing session.
- Splash timing is now 3 seconds to match the PWA launch screen.
- Splash uses the new heart-lock artwork with a genuinely transparent background. The black/dark rounded-square tile is removed from the splash mark.
- Native system splash uses the transparent mark on the PWA burgundy background before the full PWA-style animated splash appears.

- All visible Private Gather logo marks in the native UI now use the transparent heart-lock artwork; the old black rounded-square logo tile is removed.
- Android adaptive foreground and notification branding are transparent.
- The iOS/legacy launcher icon keeps an opaque App Store-safe canvas, but uses the transparent heart-lock artwork over the PWA burgundy brand field rather than the old black logo tile.
