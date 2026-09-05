# Private Gather Native App 1.1.200 Rev6 — Full-Screen Video & Single-Ringer Repair

Prepared from the exact merged Rev5 baseline. Semantic app version remains 1.1.200 until device acceptance.

## Physical-device fixes
- Remote video uses full-screen cover instead of contain.
- RTC video surfaces are memoized by stream identity and no longer remount on receiver revision updates.
- Caller/incoming preview requests portrait 9:16 camera capture first, with 4:3/16:9 fallbacks.
- Android foreground incoming calls cancel the matching system call notification before starting the in-app ringtone, eliminating double-ringer overlap.
- In-app ringtone uses the native audio engine loop for the complete 8.307-second ringtone asset; event-driven early restarts are removed.

## Web companion requirement
A separate website Update Center hotfix accompanies Rev6 to elect exactly one browser tab as ringtone owner while all tabs may still display the incoming-call UI.

Status: prepared candidate only. GitHub native validation and physical-device acceptance are required before promotion.
