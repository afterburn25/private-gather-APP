# First physical-device acceptance sequence

Do not test everything at once. Use two accounts/devices and advance in this order.

1. Install the Android development APK on an admin device.
2. Sign in and confirm `/api/v1/native/me` state loads.
3. Send/receive a text message against desktop/PWA.
4. Verify typing, read receipt, reaction and presence arrive through Reverb.
5. Start Android -> desktop voice call, then video call.
6. Start desktop -> Android call with app foregrounded.
7. Repeat with app backgrounded and screen off.
8. Repeat after Android process is removed; verify FCM/ConnectionService incoming-call UI.
9. End from each side and verify both terminate immediately.
10. Create an admin-only native release; verify only the admin device is offered it.
11. Accumulate another release; verify the device targets the newest eligible release.
12. Build/install iOS development build and repeat the sequence.
13. On iOS specifically test PushKit -> CallKit while app is backgrounded and terminated.
14. Only after both platforms pass should `Release to Members` be used.
