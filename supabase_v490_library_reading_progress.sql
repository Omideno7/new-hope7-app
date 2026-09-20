-- New Hope 7 v4.9.0 — additive library reading telemetry for per-student reports.
-- Applied to production Supabase on 2026-09-20. No existing table/data is deleted.

create table if not exists public.nh7_library_reading_progress_v490 (
  user_id uuid not null,
  user_email text not null default '',
  item_id uuid not null references public.nh7_library_items(id) on delete cascade,
  language text not null default 'en' check (language in ('fa','en','hr')),
  total_sections integer not null default 1 check (total_sections > 0),
  max_section integer not null default 0 check (max_section >= 0),
  read_percent numeric(5,2) not null default 0 check (read_percent >= 0 and read_percent <= 100),
  active_seconds bigint not null default 0 check (active_seconds >= 0),
  open_count integer not null default 0 check (open_count >= 0),
  first_opened_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id,item_id,language)
);

alter table public.nh7_library_reading_progress_v490 enable row level security;

create policy nh7_library_reading_select_own_v490
on public.nh7_library_reading_progress_v490
for select to authenticated
using ((select auth.uid()) = user_id);

create policy nh7_library_reading_insert_own_v490
on public.nh7_library_reading_progress_v490
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy nh7_library_reading_update_own_v490
on public.nh7_library_reading_progress_v490
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.nh7_library_reading_progress_v490 from anon;
grant select,insert,update on public.nh7_library_reading_progress_v490 to authenticated;

create or replace function public.nh7_library_reading_record_v490(
  p_item_id uuid,
  p_language text,
  p_total_sections integer,
  p_section integer,
  p_delta_seconds integer default 0,
  p_open boolean default false
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_language text := case when lower(trim(coalesce(p_language,''))) in ('fa','en','hr') then lower(trim(p_language)) else 'en' end;
  v_total integer := greatest(1,coalesce(p_total_sections,1));
  v_section integer := greatest(0,least(coalesce(p_section,0),greatest(1,coalesce(p_total_sections,1))-1));
  v_delta integer := greatest(0,least(coalesce(p_delta_seconds,0),300));
  v_percent numeric(5,2);
  v_row public.nh7_library_reading_progress_v490%rowtype;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_item_id is null then raise exception 'Book item is required'; end if;
  v_percent := least(100,round((100.0*(v_section+1)/v_total)::numeric,2));

  insert into public.nh7_library_reading_progress_v490(
    user_id,user_email,item_id,language,total_sections,max_section,read_percent,
    active_seconds,open_count,first_opened_at,last_read_at,completed_at
  ) values (
    v_uid,v_email,p_item_id,v_language,v_total,v_section,v_percent,
    v_delta,case when p_open then 1 else 0 end,now(),now(),
    case when v_percent>=99.5 then now() else null end
  )
  on conflict (user_id,item_id,language) do update set
    user_email=excluded.user_email,
    total_sections=greatest(public.nh7_library_reading_progress_v490.total_sections,excluded.total_sections),
    max_section=greatest(public.nh7_library_reading_progress_v490.max_section,excluded.max_section),
    read_percent=greatest(public.nh7_library_reading_progress_v490.read_percent,excluded.read_percent),
    active_seconds=public.nh7_library_reading_progress_v490.active_seconds+excluded.active_seconds,
    open_count=public.nh7_library_reading_progress_v490.open_count+excluded.open_count,
    last_read_at=now(),
    completed_at=coalesce(public.nh7_library_reading_progress_v490.completed_at,excluded.completed_at)
  returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.nh7_library_reading_record_v490(uuid,text,integer,integer,integer,boolean) from public;
grant execute on function public.nh7_library_reading_record_v490(uuid,text,integer,integer,integer,boolean) to authenticated;

create or replace function public.nh7_admin_library_reading_v490(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_result jsonb := '[]'::jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if v_email='' then return v_result; end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.last_read_at desc),'[]'::jsonb)
  into v_result
  from (
    select
      p.item_id::text item_id,p.language,p.total_sections,p.max_section,p.read_percent,
      p.active_seconds,p.open_count,p.first_opened_at,p.last_read_at,p.completed_at,
      i.title_fa,i.title_en,i.title_hr,i.file_name
    from public.nh7_library_reading_progress_v490 p
    left join public.nh7_library_items i on i.id=p.item_id
    where lower(trim(coalesce(p.user_email,'')))=v_email
  ) x;

  return v_result;
end;
$$;

revoke all on function public.nh7_admin_library_reading_v490(text) from public;
grant execute on function public.nh7_admin_library_reading_v490(text) to authenticated;
