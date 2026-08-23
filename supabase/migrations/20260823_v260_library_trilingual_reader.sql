-- New Hope 7 v2.6.0 - trilingual structured library reader.
-- Additive only: existing reader RPCs remain untouched.

create or replace function public.nh7_library_reader_access_v260(
  p_item_id uuid,
  p_language text default 'en',
  p_device_id text default '',
  p_user_email text default ''
) returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
declare
  v_auth jsonb;
  v_item public.nh7_library_items;
  v_lang text;
  v_payload jsonb;
  v_available jsonb := '[]'::jsonb;
begin
  -- Existing server authorization remains authoritative. This new RPC only
  -- adds language selection and structured-reader payload support.
  v_auth := public.nh7_library_authorize_v230(
    p_item_id,
    '',
    p_device_id,
    auth.uid(),
    p_user_email
  );
  if not coalesce((v_auth->>'allowed')::boolean,false) then return v_auth; end if;

  select * into v_item
  from public.nh7_library_items
  where id=p_item_id and is_active and is_published;
  if not found then return jsonb_build_object('allowed',false,'code','not_found'); end if;
  if v_item.reader_status <> 'ready' or v_item.reader_mode not in ('text','both') then
    return jsonb_build_object('allowed',false,'code','reader_not_ready');
  end if;

  select coalesce(jsonb_agg(x.lang order by x.ord),'[]'::jsonb)
  into v_available
  from (
    select lang,ord
    from (values ('fa',1),('en',2),('hr',3)) v(lang,ord)
    where coalesce(v_item.reader_text->v.lang,'null'::jsonb) <> 'null'::jsonb
      and case jsonb_typeof(v_item.reader_text->v.lang)
            when 'string' then length(trim(v_item.reader_text->>v.lang)) > 0
            when 'object' then length(trim(coalesce(v_item.reader_text->v.lang->>'text',''))) > 0
                              or jsonb_array_length(coalesce(v_item.reader_text->v.lang->'blocks','[]'::jsonb)) > 0
                              or jsonb_array_length(coalesce(v_item.reader_text->v.lang->'chapters','[]'::jsonb)) > 0
            else false
          end
  ) x;

  v_lang := case when lower(trim(coalesce(p_language,''))) in ('fa','en','hr')
                 then lower(trim(p_language)) else 'en' end;
  v_payload := v_item.reader_text->v_lang;
  if v_payload is null then v_payload := v_item.reader_text->'en'; v_lang := 'en'; end if;
  if v_payload is null then v_payload := v_item.reader_text->'fa'; v_lang := 'fa'; end if;
  if v_payload is null then v_payload := v_item.reader_text->'hr'; v_lang := 'hr'; end if;
  if v_payload is null then return jsonb_build_object('allowed',false,'code','reader_not_ready'); end if;
  if jsonb_typeof(v_payload)='string' then
    v_payload:=jsonb_build_object('text',v_payload#>>'{}','pages','[]'::jsonb);
  end if;

  return v_auth || jsonb_build_object(
    'reader_mode',v_item.reader_mode,
    'reader_language',v_lang,
    'reader_status',v_item.reader_status,
    'reader_page_count',v_item.reader_page_count,
    'available_languages',v_available,
    'reader',v_payload,
    'title_fa',v_item.title_fa,'title_en',v_item.title_en,'title_hr',v_item.title_hr,
    'description_fa',v_item.description_fa,'description_en',v_item.description_en,'description_hr',v_item.description_hr
  );
end;
$$;

revoke all on function public.nh7_library_reader_access_v260(uuid,text,text,text) from public,anon;
grant execute on function public.nh7_library_reader_access_v260(uuid,text,text,text) to authenticated,service_role;
