# Native platform setup

The source intentionally uses Expo Continuous Native Generation. `npm run prebuild:clean` creates the checked native projects from `app.config.js`, `app.json` and the Private Gather calling config plugin.

## iOS call wake
The config plugin patches the generated Swift AppDelegate to register PushKit early and report a VoIP push to RNCallKeep/CallKit before waiting for the React Native bridge. The server/gateway payload must include `uuid`, `call_id`, `callerName`, `caller_id`, `handle`, `mode`, and `hasVideo`.

## Android call wake
The generated manifest receives ConnectionService, phone-call foreground-service permissions, and full-screen-intent permission. A module-scope Expo notification background task handles incoming-call data messages and asks CallKeep to display the system call UI.

## Store rules
Binary changes still require signed App Store / Play Store distribution. Compatible JavaScript/assets can follow Private Gather's controlled OTA lane. Do not use OTA to bypass store review for native capability changes.
