# Private Gather Native 1.1.190 — PWA Splash, Media & Call Presentation Repair

Prepared test candidate.

- Launch screen visually matches the current PWA splash: burgundy/pink/gold atmosphere, new heart-lock mark, Private Gather wordmark, and PRIVATE LIFESTYLE COMMUNITY subtitle.
- Native system splash also uses the complete new heart-lock logo on the matching dark background.
- Protected-image URLs are normalized to the configured native API origin before loading with Bearer authorization.
- Foreground Android incoming calls stay inside the Private Gather call screen instead of presenting the normal Phone app UI.
- Foreground incoming calls use the bundled Private Gather calling.mp3 ringtone.
- Answering a background Android ConnectionService call explicitly returns Private Gather to the foreground so video can render.
- Outgoing Android calls remain inside the Private Gather UI; iOS retains CallKit integration.
- Fallback incoming-call polling reduced to 2.5 seconds to avoid unnecessary native API pressure.
- Notification call channel uses a real bundled calling.wav sound rather than the invalid literal `default`.
- Builds on 1.1.189 wall/safe-area/profile/call-target repairs.
