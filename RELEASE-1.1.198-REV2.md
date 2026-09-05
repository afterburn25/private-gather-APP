# Private Gather Native 1.1.198 Rev2 — Expo Config Plugin Interpolation Hotfix

This is a corrected native build kit for the prepared 1.1.198 candidate. Backend 1.1.198 and Push Gateway 1.1.195 do not change.

Trigger:
- `expo prebuild` stopped with `PluginError: reactContext is not defined`.

Root cause:
- The Android Kotlin source for `PrivateGatherCallAccessModule` is embedded inside a JavaScript template literal. The Kotlin expression `${reactContext.packageName}` was not escaped, so JavaScript tried to evaluate `reactContext` while loading the Expo config plugin.

Repair:
- The template now contains `\${reactContext.packageName}` at JavaScript generation time, which emits the intended Kotlin `${reactContext.packageName}` into `PrivateGatherCallAccessModule.kt` instead of evaluating it in Node.
- All 1.1.198 Home, profile navigation, portrait preview, Android incoming-call activity, full-screen-intent access, and web cross-tab call repairs are preserved.
