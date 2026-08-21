-- Follow-up to v3.4.8: retain the hardened RPC-only insert path without
-- blocking legitimate updates already protected by registration RLS/RPC rules.

drop trigger if exists trg_nh7_guard_approved_registration_update_v348 on public.registrations;
drop function if exists public.nh7_guard_approved_registration_update_v348();
