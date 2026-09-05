# Private Gather Native 1.1.197 — Video, Community Wall, Feed Media & Full Splash Repair

Prepared test candidate.

Highlights:
- Explicit 640×480 4:3 front-camera capture with fallback acquisition; video calls fail visibly instead of silently proceeding without a video track.
- High-z-order incoming/outgoing camera preview stage using `contain`, so the selfie view is less cropped/zoomed.
- Dedicated remote-video MediaStream, ICE-complete SDP publication, video SDP assertions, signaling retry, and remote-video recovery.
- Speaker selectors render only when there are two or more active identities.
- Community heart/reaction interaction, long-press reaction catalog, View comments / Be the first to comment, comment list and comment composer.
- Dedicated native Community photo endpoint for wall media and NSFW blurred derivatives.
- Verify to view uses an in-app Chrome Custom Tab rather than opening the installed PWA.
- Full-screen PWA-style launch artwork is restored. The system splash is reduced to a blank matching startup window so the simple logo splash no longer appears as a second branded screen.

- Pre-answer video preview requests camera permission only; microphone permission remains deferred until Answer.
