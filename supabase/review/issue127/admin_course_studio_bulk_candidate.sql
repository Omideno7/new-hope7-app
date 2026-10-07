-- New Hope 7 — Issue #127 / Admin Course Studio bulk helpers
-- REVIEW CANDIDATE ONLY. DO NOT APPLY DIRECTLY TO PRODUCTION.
-- Depends on multi_course_candidate.sql + admin_course_studio_candidate.sql.

-- Generate N ordered stage shells in one Admin RPC. This is intentionally a
-- stage-shell operation only: lesson content is entered/attached separately.
create or replace function public.nh7_admin_generate_course_stages_v127(
  p_course_code text,
  p_count integer,
  p_prefix text default 'class'
)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_course text:=private.nh7_course_code_normalize_v127(p_course_code);
  v_prefix text:=private.nh7_course_code_normalize_v127(p_prefix);
  v_count integer:=greatest(1,least(coalesce(p_count,1),100));
  i integer;
  v_stage text;
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if not exists(select 1 from public.school_courses c where c.course_code=v_course) then raise exception 'course_not_found'; end if;
  if v_prefix='' then v_prefix:='class'; end if;

  for i in 1..v_count loop
    v_stage:=v_prefix||'_'||lpad(i::text,2,'0');
    insert into public.school_course_stages(
      course_code,stage_code,stage_order,title_fa,title_en,title_hr,is_active,settings,updated_at
    ) values(
      v_course,v_stage,i,
      'کلاس '||i::text,
      'Class '||i::text,
      'Razred '||i::text,
      true,'{}'::jsonb,now()
    )
    on conflict(course_code,stage_code) do update set
      stage_order=excluded.stage_order,
      updated_at=now();
  end loop;

  return jsonb_build_object('ok',true,'course_code',v_course,'generated_stage_count',v_count);
end;
$$;
revoke all on function public.nh7_admin_generate_course_stages_v127(text,integer,text) from public,anon,authenticated;
grant execute on function public.nh7_admin_generate_course_stages_v127(text,integer,text) to authenticated;

-- Replace prerequisite configuration in one transaction-like RPC call. This
-- only changes config relationships; it never removes student history.
create or replace function public.nh7_admin_replace_course_prerequisites_v127(
  p_course_code text,
  p_prerequisite_codes text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_course text:=private.nh7_course_code_normalize_v127(p_course_code);
  raw text;
  v_pre text;
  v_saved text[]:='{}'::text[];
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  if not exists(select 1 from public.school_courses c where c.course_code=v_course) then raise exception 'course_not_found'; end if;

  -- Configuration-only cleanup is safe; academic/user data is untouched.
  delete from public.school_course_prerequisites where course_code=v_course;

  foreach raw in array coalesce(p_prerequisite_codes,'{}'::text[]) loop
    v_pre:=private.nh7_course_code_normalize_v127(raw);
    if v_pre='' then continue; end if;
    if v_pre=v_course then raise exception 'course_cannot_require_itself'; end if;
    if not exists(select 1 from public.school_courses c where c.course_code=v_pre) then raise exception 'prerequisite_course_not_found:%',v_pre; end if;
    insert into public.school_course_prerequisites(course_code,prerequisite_course_code)
    values(v_course,v_pre) on conflict do nothing;
    v_saved:=array_append(v_saved,v_pre);
  end loop;

  return jsonb_build_object('ok',true,'course_code',v_course,'prerequisites',to_jsonb(v_saved));
end;
$$;
revoke all on function public.nh7_admin_replace_course_prerequisites_v127(text,text[]) from public,anon,authenticated;
grant execute on function public.nh7_admin_replace_course_prerequisites_v127(text,text[]) to authenticated;
