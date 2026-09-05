# Private Gather Native 1.1.200 Rev7 — Video Surface & Incoming Ringer Stability Hotfix

Prepared after physical-device Rev6 testing. Semantic app version remains 1.1.200.

- Preserve incoming preview state across duplicate incoming-call events.
- Promote the pre-answer video stream into the answered call; acquire microphone only.
- Explicit full-window React RTC call surface.
- Deduplicate repeated Android incoming-call notifications for the same call.
- setOnlyAlertOnce and new call notification channel.
- 16:9 native preview selection plus center-crop transform.

Prepared candidate only until physical-device acceptance.
