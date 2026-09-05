# Private Gather Native 1.2.0 — Two-App Native Architecture & Messenger V2 Foundation

Prepared after the 1.1.200 Rev6 physical-device failure. The Rev6/Rev7 patch line is superseded and must not be treated as an accepted baseline.

## Product split
- Private Gather remains the community/discovery/profile/events application.
- Private Gather Messenger is a second native binary: `com.privoralabs.privategather.messenger`.
- PWA Messenger parity is retired as a development requirement.
- Main-app Messages and member call/message actions hand off to the dedicated Messenger using a one-time backend token when available.

## Messenger V2
- Persistent SQLite cache with WAL mode.
- Optimistic messages and durable retry outbox.
- Reverb realtime reconciliation plus REST recovery.
- Cached inbox/conversation startup.
- Inverted stable message viewport; no forced tail timers.
- Throttled typing and read receipts.
- Speaker identity support.
- Message reactions and queued-send retry.
- Dedicated native voice/video call surface.
- Incoming preview camera is promoted into the answered call rather than torn down/reopened.
- Foreground ringtone uses full-clip timed cycles rather than early playback callbacks.
- Messenger devices advertise `app_role=messenger` for backend call-push routing.

Status: prepared candidate only until exact GitHub validation and physical-device acceptance.
