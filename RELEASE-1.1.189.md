# Private Gather Native 1.1.189 — Native Wall, Safe-Area, Profile & Calling Repair

Prepared native candidate. Not confirmed/live until installed and tested.

Repairs:
- Home tab now opens directly to the native Community public wall.
- Wall uses native feed cards and a native text composer rather than dashboard/web-style cards.
- Android/iOS top safe area is enforced for status bars and display cutouts.
- Bottom tab bar height/padding is derived from the real device bottom inset so it clears Samsung navigation buttons and gesture areas.
- Launcher artwork is padded into the Android adaptive-icon safe zone so the complete heart-lock logo remains visible.
- Conversation calling now prefers `member_id` over conversation `id`, fixing calls that sent a conversation id into the `/calls/start/{user}` route.
- Member profiles render substantially more of the existing profile data: relationship/social fields, about/looking for/boundaries, per-person physical/profile fields, lifestyle preferences, and seeking preferences.
- Core React Native SafeAreaView use is removed from Login; safe-area-context is used consistently.
- Notification channels continue to use OS default channel sound without `sound:'default'`.

This native kit requires the matching 1.1.189 backend API repair for `/feed` and expanded profile payloads.
