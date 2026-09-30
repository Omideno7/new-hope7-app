# Community Modules v5.0.2 — Integration QA

Branch: `feature/community-modules-v502-preview-20260930`

## User app
- Community runtime syntax: PASS
- App module syntax after integration: PASS
- More tiles wired: Testimonies / Prayer Request / Profile
- Router wired: PASS
- Account-auth handoff for pending community route: PASS
- Trilingual guide JSON: FA / EN / HR
- Persian healing-testimony guide topics: 14 / 14
- Direct microphone recording path: implemented
- Existing audio upload path: implemented
- Pending testimony audio: private bucket candidate
- Approved testimony audio: public approved-only bucket candidate
- Prayer request: name + detailed request; authenticated own-row insert
- Profile: private original photo + 512×512 cropped avatar; drag/zoom crop
- Profile crop background scroll lock: implemented

## Admin
- Admin community runtime syntax: PASS
- Admin inline script syntax: PASS
- Owner-only Prayer Requests tab: wired
- Owner-only Audio Testimonies tab: wired
- No automatic polling: PASS
- Manual Refresh: implemented
- Prayer status: New / Praying / Completed
- Prayer PDF/Print export: implemented
- Pending testimony private signed playback: implemented
- Approve → Storage copy private→published + owner publish RPC: implemented
- Reject testimony: implemented

## Security candidate
- Public testimony table policy removed.
- Public testimony feed is a restricted SECURITY DEFINER RPC returning publication-safe fields only.
- All SECURITY DEFINER RPCs are explicitly REVOKE ALL then narrowly GRANT EXECUTE.
- Owner prayer/testimony management calls existing v3.5.0 owner authorization.
- New public tables have explicit Data API grants plus RLS.
- Testimony submission path must begin with the submitting user's auth UID.
- Testimony publish RPC requires an `approved/` destination and verifies the Storage object exists.
- Profile-photo bucket: private.
- Testimony-submission bucket: private.
- Testimony-published bucket: public, but only owner may write.

## Production safety
- Supabase Production migration: NOT APPLIED.
- Production Storage buckets: NOT CREATED.
- Production Edge Functions: unchanged.
- `main`: unchanged.
- Existing user Notes / Saved Verses / School Progress / Audio: no destructive migration.
- Player 2.0 checkpoint: untouched.

## Current blocker for real end-to-end QA
The Supabase project currently has only the default/main database branch. A Supabase development branch is required to test real inserts/uploads/RLS without touching Production.
