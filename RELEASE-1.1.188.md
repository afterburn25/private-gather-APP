# Private Gather Native 1.1.188 — Native Mobile Navigation, Call Controls & Notification Repair

## Purpose
1.1.188 turns the 1.1.187 neon native client from a dashboard-style mobile layout into a focused mobile social application while preserving the Private Gather neon heart-lock identity, privacy boundaries, Firebase/native push, realtime messaging, WebRTC calling, CallKeep and managed updates.

## Mobile UX
- React Navigation native stack + five bottom tabs: Home, Discover, Messages, Events, Me.
- Detail screens push above the tab shell and use normal Android/iOS back behavior.
- Home removes the marketing hero, four shortcut tiles and dashboard statistics. It now prioritizes Online Now, For You and Coming Up.
- Discover uses one search field and one verified filter control rather than multiple scattered chips.
- Events uses a compact segmented control instead of a marketing banner.
- Conversation composer is safe-area and keyboard aware.
- App screens use one content hierarchy and fewer simultaneous cards.

## Brand / launcher icon
- Private Gather heart-lock logo is explicitly configured as the global app icon.
- iOS icon uses `assets/icon.png`.
- Android legacy icon uses `assets/icon.png`.
- Android adaptive launcher foreground uses `assets/adaptive-icon.png` on `#050914`.

## Native symbols
- Bottom tabs use platform-native Home, Explore, Message, Event and Person symbols.
- Conversation calling uses native Phone and Video Camera symbols.
- Call screen uses native Video, Microphone, Camera Switch, More and Call End symbols.
- Notification buttons use native Bell symbols.

## Notification repair
- Removed `sound: 'default'` from Android notification-channel creation.
- This prevents Expo Notifications from treating `default` as a missing bundled custom audio asset.
- Channel importance, vibration and OS/device notification sound policy remain active.

## Call reliability carried forward
- Reverb remains the realtime fast path.
- `/calls/{id}/poll` backs up SDP/ICE/status delivery.
- `/calls/incoming` provides a foreground incoming-call fallback.
- In-app Answer/Decline is available when system call presentation is unavailable.
- ICE restart recovery remains available on failed/disconnected caller state.

## Build compatibility
- Expo SDK 57 aligned to React 19.2.3.
- Node engine aligned to Node 22.13+ <23.
- TypeScript aligned to ~6.0.3.
- `react-native-safe-area-context` ~5.7.0 and `react-native-screens` ~4.26.0 included.
- React Navigation 7 and `expo-symbols` included.
- Postinstall script applies the React Native 0.86 / react-native-callkeep overloaded-method compatibility repair idempotently.
