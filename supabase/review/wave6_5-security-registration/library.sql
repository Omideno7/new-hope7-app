-- REVIEW ONLY alternative: caller-UID RPC behind invoker views. NEVER broaden base SELECT/RLS.
-- Exact four live projections/types/dependencies must be captured and approved before view adapter generation.
create or replace function public.nh7_library_catalog_wave65(p_resource text) returns setof jsonb
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); bundle jsonb;
begin
 if uid is null then return;end if;
 -- Adapter intentionally delegates authority to the CURRENT UID-secure catalog, NOT a School-only read.
 -- Preflight must prove v396 covers current minister entitlement, active/published and exact columns.
 -- v396 is referenced by current client but its deployed definition is absent: activation BLOCKED until captured.
 if p_resource not in ('items','collections') then raise exception 'library_resource';end if;
 bundle:=public.nh7_library_catalog_v396()::jsonb;
 if bundle->>'allowed'='false' then return;end if;
 return query select value from jsonb_array_elements(coalesce(bundle->p_resource,'[]'::jsonb));
end;$$;
revoke all on function public.nh7_library_catalog_wave65(text) from public,anon;
grant execute on function public.nh7_library_catalog_wave65(text) to authenticated;
-- After validating exact definitions, replace each old view using its captured column projection/types over
-- this RPC, WITH (security_invoker=true,security_barrier=true). Keep same view name/column order/types.
-- No SELECT * and no grant on base tables. fixture.sql proves row/column semantics on PostgreSQL.
-- Do not run a guessed CREATE OR REPLACE VIEW against unknown live contracts.
