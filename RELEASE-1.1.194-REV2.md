# Private Gather Native 1.1.194 Rev2 — Firebase Messaging Compile-Classpath Hotfix

This is a corrected native build kit for the prepared 1.1.194 candidate. It does not change the Laravel/backend or push-gateway version.

Trigger:
- Android Gradle reached `:app:compileDebugKotlin` but failed because the new `PrivateGatherFirebaseMessagingService.kt` directly imports `com.google.firebase.messaging.RemoteMessage` while `firebase-messaging` was only an implementation dependency inside `expo-notifications` and therefore not exposed on the app module compile classpath.

Repair:
- The Private Gather Android config plugin now adds `implementation 'com.google.firebase:firebase-messaging:25.0.1'` directly to `android/app/build.gradle` during prebuild.
- Version 25.0.1 exactly matches the Firebase Messaging dependency used by Expo Notifications in Expo SDK 57.
- The full-screen incoming-call, 90-second ring window, incoming/outgoing camera previews, remote-video negotiation, single splash and complete crest/logo repairs from 1.1.194 are preserved unchanged.

Build requirement:
- Run `expo prebuild --clean --platform android` again so the corrected Gradle dependency is generated into the Android project before rebuilding.
