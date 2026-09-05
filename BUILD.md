# Private Gather Native Build Gate — 1.1.199

## Shared
- `npm install`
- `npm run typecheck`
- `npm run prebuild:clean`
- Verify generated application id/bundle id is `com.privoralabs.privategather`.
- Enable Native API, Native Realtime and Native Updates only for admin/test accounts first.

## iOS
- Xcode 26.4+ / iOS deployment target 16.4+ for Expo SDK 57.
- Assign Apple development/distribution team.
- Enable Push Notifications capability.
- Background Modes: Voice over IP, Audio/AirPlay/Picture in Picture, Remote notifications.
- Configure APNs PushKit signing material in the Private Gather native push gateway.
- Test CallKit from foreground, background and terminated state on a physical iPhone.
- Verify answer/end actions reconnect to the exact Private Gather call ID through deterministic UUID mapping.

## Android
- Compile/target SDK 36.
- Configure FCM credentials or Expo push credentials.
- Confirm Private Gather phone account / ConnectionService is enabled.
- Android 13+: grant notification permission.
- Android 14+: verify full-screen-intent permission is available for the calling app and foreground phone-call service starts successfully.
- Test foreground, background, screen-off and process-killed incoming calls on physical Android devices.

## Realtime / updates
- Two accounts: message, typing, read receipt, reaction and call signaling without primary polling.
- Wi-Fi, cellular and TURN-required call tests.
- Held -> Admin -> Members -> Pause -> Resume release workflow.
- Member device skips accumulated admin-only releases and receives newest eligible build only.
