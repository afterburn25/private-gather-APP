# Private Gather Native Platform Expansion Roadmap

Status: active development plan beginning after the GitHub-validated 1.2.1 call/handoff repair. This document preserves the requested native scope and groups it by shared architecture so the work can be delivered and tested in coherent releases.

## Delivery rules
- The native Main app and dedicated native Messenger remain separate apps with one Laravel backend.
- Each feature batch gets its own GitHub validation before merge.
- Exact-main CI produces both Android APKs and a complete build kit.
- GitHub green is not physical-device acceptance.
- Do not promote a candidate to live/confirmed until explicit device acceptance.
- Privacy, consent, verification and 18+ visibility rules are cross-cutting requirements, not optional UI polish.

## Wave A — Identity, Profile, Privacy and Safety
### Complete native profile editing
- Edit bio, interests, preferences and location visibility.
- Upload/change profile and cover photos.
- Speaker identities for couples/multi-person profiles.
- Public/private albums and album-access requests.
- Verification status/progress.
- Preview profile exactly as another member sees it.
- Profile-completion meter.

### Privacy Shield / Discreet Profile
Treat this as a signature Private Gather native feature.
- Blur face.
- Blur eyes.
- Hide tattoos.
- Manual blur/mask brush.
- Preview before publishing.
- Geo-block states/cities/regions.
- Reveal selected media only after connection approval.
- Visibility audiences: public, verified, connections and selected members.
- One-tap Discreet Mode.

### Native Safety Center
- Face ID / Touch ID / Android biometric app lock.
- PIN fallback.
- Hide notification message text.
- Alternate notification presentation where platform rules allow it.
- Blocked users and hidden profiles.
- Active devices and session revocation.
- Pause account.
- Emergency Hide My Profile.
- Report/block from any member screen.

### First-run onboarding
Account → profile type → location → interests → privacy → photos → verification → notifications → call permissions → suggested people/events.

## Wave B — Native Media and Messenger Durability
### Camera/media
- Camera and gallery picker.
- Front/rear camera.
- Preview before upload.
- Image compression and upload progress.
- Video clips and voice messages.
- Album creation.
- Private media permissions.
- View-once media.
- Expiring media.
- Revoke sent media.

### Offline-first Messenger
- Keep SQLite as the authoritative local conversation cache.
- Open Messenger instantly from local state.
- Durable outgoing queue during brief offline periods.
- Retry failed sends/uploads.
- Automatic Reverb reconnection.
- Restore unread/read state after resume.
- Draft preservation.
- Sending / Sent / Delivered / Read state.

### Push actions
- Reply directly to message.
- Answer / Decline call.
- Accept connection.
- View profile.
- RSVP to event.
- Approve album access.
- Mark read.
- Mute conversation.
- Notification grouping/categories.

## Wave C — Community, Discovery and Travel
### Native Events
- Browse events.
- RSVP / Interested / Going.
- Invite friends.
- Event chat.
- Guest list / waitlist.
- Add to Apple/Google Calendar.
- Directions.
- Host announcements.
- Check-in and QR check-in.
- Temporary event-location reveal.

### Clubs
- Club discovery.
- Follow/join.
- Member feeds.
- Upcoming events and announcements.
- Club chat.
- Guest-list requests.
- Verified club badge.
- Saved/favorite clubs.

### Better Discover
- Near you.
- Online now.
- New members.
- Verified.
- Tonight.
- Favorites.
- Mutual interests.
- Travel Mode.
- Events/clubs in common.
- Distance privacy controls.
- Saved filters.

### Connections
- Requests.
- Accepted.
- Favorites.
- Mutual connections.
- Recently connected.
- Optional Who viewed me.
- Private connection notes/labels.
- Quick message/call actions.

### Travel Mode
- Destination and future travel dates.
- Appear in destination Discover before arrival.
- Local events/clubs.
- Exact location remains private.

### Native notification center
One realtime center for messages, reactions, comments, connections, calls, album requests, events, club announcements, verification and system notices with Reverb-driven unread badges.

## Wave D — Native Calling, OS Integration and Performance
### Calling
- Bluetooth route selection.
- Speaker / earpiece toggle.
- Camera flip.
- Network-quality indicator.
- Wi-Fi ↔ cellular recovery.
- Missed-call history and call-back.
- Voice/video call history screen.
- Call duration.
- Native lock-screen controls.
- Proper Android full-screen incoming call.
- iOS CallKit history/integration where appropriate.
- Group calls only after one-to-one call reliability is accepted.

### OS-level polish
- Deep links throughout both apps.
- Native Share Profile / Share Event sheets.
- Add-to-calendar.
- Haptic feedback.
- App badge count.
- Android notification channels.
- iOS notification categories.
- App-icon quick actions.
- Better splash/loading experience.

### Performance before public launch
- Image caching.
- Infinite-list virtualization.
- Pagination.
- Background refresh.
- Battery-friendly Reverb presence.
- Local cache coverage.
- Startup profiling.
- Memory testing during long video calls.

## Immediate implementation order
1. Finish and device-test 1.2.1 call/handoff repair.
2. Build Wave A shared account/privacy API contract and native navigation foundation.
3. Add native profile editor + profile preview + completion meter.
4. Add Safety Center and app-lock foundation.
5. Add Discreet Profile editor/preview architecture before destructive media processing.
6. Expand media pipeline and Messenger delivery states.
7. Move community surfaces to richer native flows.
8. Finish OS/calling/performance hardening before public launch.
