# Private Gather Native 1.1.194 Rev3 — App Startup Style Reference Hotfix

This is a corrected native build kit for the prepared 1.1.194 candidate. It preserves the Rev2 Firebase Messaging compile-classpath repair.

Trigger:
- The app launched but React Native threw `Property 'styles' doesn't exist` at App.tsx line 215.

Root cause:
- The startup loading view referenced `styles.loading`, but this file defines its stylesheet as `s`.

Repair:
- `styles.loading` is corrected to `s.loading`.
- Static scan confirms there are no remaining `styles.*` references in the native TypeScript/TSX source.
- Full-screen calls, 90-second ring window, incoming/outgoing video preview work, remote-video negotiation, single splash, complete crest/logo repair, and Rev2 Firebase Messaging dependency repair are preserved.
