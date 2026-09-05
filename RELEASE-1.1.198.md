# Private Gather Native 1.1.198 — Home Recovery, Portrait Call Preview & Full-Screen Incoming Activity

Prepared test candidate.

- Rebuilds the Home wall around a direct RefreshControl and lazy verification-browser loading so a Community API/browser-module problem cannot leave the tab as a blank surface.
- Profile avatar and author-name areas are independent press targets that navigate to the native member profile.
- Waiting/incoming video preview now occupies the full phone screen behind call controls. Camera acquisition prefers 9:16 portrait streams (720×1280 / 540×960) with 4:3 and default fallbacks, plus best-effort minimum zoom.
- Adds a dedicated native Android PrivateGatherIncomingCallActivity for full-screen incoming-call presentation before React Native has to boot.
- Adds a native Android full-screen-intent access check. On Android 14+, Private Gather prompts only when the OS special access is actually disabled and opens the exact setting.
- Native full-screen Answer/Decline actions deep-link back to the matching call action.
- Existing call-end tombstones, speaker switching, protected-media cache and Community interactions are preserved.
