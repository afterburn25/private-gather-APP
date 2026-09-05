# Private Gather Native 1.1.196 — Call-End Stability, Media Cache, Speaker Switching & Performance

Prepared test candidate.

- End Call closes the call UI/media immediately; server end/decline is retried in the background.
- Recently ended/declined call IDs are tombstoned so delayed FCM, notification responses, Reverb or HTTP polling cannot reopen the same call.
- Incoming push payloads are checked against current server status before the call UI is shown.
- Protected avatar/cover/wall media downloads with the bearer token through expo-file-system, validates returned image MIME type, assigns a real image extension, and shares a memory/disk cache.
- Session tokens are cached in memory instead of reading Android Keychain for every API/image request.
- Android Community feed rendering uses a smaller render window/batch.
- The Me screen now renders the real cover image.
- Messenger adds a native “Speaking as” selector; typing and messages use the selected profile identity.
- Community adds a native “Posting as” selector.
- Existing 1.1.195 full-screen call, fast-ring, direct-call wake, video and verification work is preserved.
