# Language Preference Source of Truth

WebHealth uses the Google account locale only to seed a missing application language, while a user-selected application language remains authoritative afterward. Explicit public locale URLs such as `/de/pricing` and `/en/pricing` stay canonical and are not rewritten by preference, and client-facing snapshots store the creator's language at capture time so shared artifacts remain stable for viewers.
