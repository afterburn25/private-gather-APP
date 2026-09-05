# Private Gather Native 1.1.199 — Wall Media, Native Verification, Incoming Camera & Web-Matched Reactions

Prepared test candidate.

- Feed-photo URLs under `/api/v1/native/feed/photos/*` are now recognized as protected native media, so wall photos and server-generated NSFW blurred derivatives are downloaded with the native bearer token and cached with a real image extension.
- Verify to view opens a dedicated native Verification screen backed by an authenticated one-time server bridge and `react-native-webview`; it no longer dispatches the Private Gather URL to the installed PWA.
- Android full-screen incoming video calls now start a live front-camera preview directly inside the native incoming-call Activity when camera permission is already granted.
- Native incoming Decline / Answer buttons use explicit colored rounded backgrounds, 64dp touch targets and extra bottom clearance above Samsung navigation controls.
- Foreground incoming preview reuses the call detail already fetched by the app instead of making a second blocking API request before starting camera preview.
- Community reactions now mirror the web control model: separate Like and Dislike launchers, tap for default 👍/👎, hold for that group’s reaction palette, and when a reaction is selected only its group control remains and tapping it opens the palette to change/remove it.
- Existing comments, speaker switching, full-screen call permission, web cross-tab ringing and call-end tombstones are preserved.
