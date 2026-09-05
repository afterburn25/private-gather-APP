# Private Gather Native 1.1.200 Rev5 — Call Preview, Ringer & Composer Tail Hotfix

Prepared from authoritative GitHub `main` commit `33e4f80c5caf7c382fe4459cc361f60f3fa6ed0b` after physical-device feedback on Native 1.1.200.

## Device feedback addressed
- outgoing/incoming video self-preview did not visually fill the call screen;
- camera preview blinked/flashed while call state updated;
- ringtone restarted before the audible file completed;
- Decline could close the call screen while ringing continued;
- conversation composer could sit behind the Android keyboard/navigation typing area;
- after sending, the conversation sometimes stopped short of the true newest message.

## Fixes
- large waiting/self preview is edge-to-edge and uses `cover`;
- local RTCView keys are tied to the actual stream URL instead of repeatedly changing revision counters, preventing unnecessary remounts/flashing;
- in-app ringtone uses non-looping playback plus a completion event and guarded restart, with a cancellation generation so a stopped ringtone cannot resume after Decline/Answer;
- Android native incoming-call notifications use the v200 call channel, alert only once for duplicate notifications, and cancel the exact call notification before Answer/Decline hands control back to React Native;
- Android software keyboard layout is explicitly `resize`;
- conversation composer owns the bottom safe-area padding and Android relies on native resize instead of a competing `KeyboardAvoidingView` height calculation;
- conversation tail-follow now tracks whether the member is near the bottom, preserves manual history scrolling, and forces several post-layout scroll-to-end passes after the member sends a message.

## Version/status
This is a Rev5 candidate under semantic Native version `1.1.200`. It is not confirmed/device-accepted until the reported call and messaging behaviors are retested on the phone. GitHub Native Validate must pass before handoff.
