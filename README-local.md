# Private Gather Native — 1.1.199 iOS + Android platform source

This package is the first Private Gather native source tree prepared for **both iOS and Android native calling**, not a WebView wrapper. It shares Laravel bearer-token APIs and Reverb channels with the web/PWA product.

## 1.1.199 native mobile UX redesign

This build replaces the dashboard-like phone experience with a true mobile-first shell: native bottom tabs, native stack transitions/back behavior, compact Home discovery flow, simplified Discover and Events surfaces, safe-area aware conversations, native platform symbols, and focused one-screen-at-a-time navigation. The Private Gather heart-lock logo is explicitly configured as the application icon for iOS, Android legacy launcher icons, and the Android adaptive launcher foreground. Voice/video call controls now use platform-native phone, video, microphone, camera-switch and hang-up symbols.

The Android notification-channel registration no longer passes `sound: 'default'` as a custom bundled sound, eliminating the Expo LogBox error about a missing custom sound named `default`. Calls/messages still use their channel importance and the device/OS notification sound policy.

The prior Android call reliability work is also folded in: server polling backs up Reverb signaling, foreground incoming-call polling is available, and in-app Answer/Decline remains available when the system calling surface is not shown.

## 1.1.199 approved visual system

1.1.199 implements the approved Private Gather heart-lock identity and neon midnight product UI in source. The app now uses the pink/violet/cyan brand system across sign-in, Home, navigation, cards, conversations and calling. Native app icon, adaptive icon, splash mark and notification icon are included under `assets/`. The WebRTC call surface also exposes real Mute, Camera and Flip controls through `CallManager`; this is not a visual-only mockup.


## 1.1.199 full native experience shell

The native client is no longer messaging-only. It now includes a persistent five-tab shell (Home, Discover, Messages, Events, Profile), notification center, verified clubs, protected member profiles and cover photos, event/club detail screens, direct member-to-conversation creation, realtime inbox/thread refresh, and the existing native voice/video call surface. The matching Laravel 1.1.199 API uses explicit privacy-safe member/event/club payloads instead of raw Eloquent User serialization.


## What 1.1.199 adds

- iOS PushKit registration and CallKit reporting path through the Expo prebuild config plugin.
- iOS VoIP push-token registration with Private Gather.
- Android ConnectionService/CallKeep manifest configuration and foreground call service.
- Android high-priority background notification task that can surface CallKeep for an incoming call.
- Deterministic valid CallKeep UUID mapping for numeric Private Gather call IDs.
- Camera/mic/background/VoIP/full-screen-intent permissions and universal/deep links.
- Expo development-client, background TaskManager and build-properties integration.
- EAS build profiles for development/admin/preview/production.
- Native APNs/FCM or Expo push-token registration selectable with `EXPO_PUBLIC_PG_PUSH_MODE`.

## Generate the native projects

1. Install Node.js 22.13+ and dependencies: `npm install`.
2. Copy `.env.example` to `.env` and set API/update/EAS values.
3. Run `npm run typecheck`.
4. Run `npm run prebuild:clean`. This generates `ios/` and `android/` and applies `plugins/withPrivateGatherNativeCalling.js`.
5. iOS: open the generated workspace in Xcode, select your Apple team, enable Push Notifications, verify Background Modes includes Voice over IP + Audio + Remote notifications, then install pods/build.
6. Android: open the generated `android/` project in Android Studio or run `npm run android`.
7. Use physical devices for CallKeep/WebRTC/push acceptance.

## Push behavior

- Standard message/update pushes can use Expo, APNs or FCM.
- iOS incoming calls use PushKit VoIP tokens when the Private Gather native push gateway is configured. The AppDelegate reports the incoming call to CallKit before JavaScript is required.
- Android incoming calls use high-priority data notifications plus CallKeep/ConnectionService. Android 14+ full-screen intent remains subject to OS/user/Play policy for calling apps.

## Realtime channels

- `private-user.{id}` — viewer-specific messages/notifications/incoming calls.
- `presence-conversation.{id}` — typing/presence.
- `private-call.{id}` — offer/answer/ICE/restart/hangup/state.

HTTP endpoints remain recovery paths.

## 1.1.199 build kit
For the first real device build, see `BUILD-CREDENTIALS.md`, `FIRST-DEVICE-TEST.md`, and the scripts under `scripts/`. Windows users can run `scripts/windows-eas-first-build.ps1` for the simplest cloud-build path or `scripts/windows-android-first-build.ps1` after Android Studio/SDK is installed. GitHub Actions workflows are included for native validation and EAS build dispatch.
