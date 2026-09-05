# Native update protocol

## Server decision is authoritative

Clients identify themselves with a persistent random `installation_id`, platform, app version, runtime version, build number and push capabilities. Private Gather hashes the installation id into a stable rollout bucket from 0–9999.

For ordinary members, no Held/Admin release is returned. Once **Release to Members** is pressed, bucket position maps to a deterministic eligibility time across `rollout_minutes`. A 6-hour rollout therefore spreads download starts through the six-hour window without needing a queue worker for every device.

The server searches newest-first, so a member on 1.0 can jump to the newest compatible 1.4 release even if 1.1–1.3 were admin-only builds.

## OTA vs binary

OTA releases must stay within the same native runtime compatibility boundary. The client only invokes `expo-updates` after server eligibility.

Binary releases require an App Store / Play Store build and use `store_url`. Private Gather controls eligibility/reminders/required-version policy, but cannot bypass store signing/review rules.

## Admin behavior

Administrator accounts ignore member rollout buckets after `admin_released_at`: they are eligible immediately. This is intended for internal/test devices.
