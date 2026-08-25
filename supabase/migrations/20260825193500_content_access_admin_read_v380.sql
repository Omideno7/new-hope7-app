create or replace function public.nh7_owner_content_access_for_user_v380(p_user_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path='public','pg_catalog'
as $$
declare v_email text:=lower(trim(coalesce(p_user_email,'')));v_items jsonb;
begin
 if not public.nh7_v380_is_owner() then raise exception 'owner_required';end if;
 select coalesce(jsonb_agg(jsonb_build_object('scope',content_scope,'content_id',content_id,'title',content_title,'active',active,'granted_at',granted_at,'notes',notes) order by content_scope,content_title,content_id),'[]'::jsonb)
 into v_items from public.nh7_content_entitlements_v380 where lower(user_email)=v_email;
 return jsonb_build_object('ok',true,'email',v_email,'items',v_items);
end;$$;
revoke all on function public.nh7_owner_content_access_for_user_v380(text) from public,anon;
grant execute on function public.nh7_owner_content_access_for_user_v380(text) to authenticated;
