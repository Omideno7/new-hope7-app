-- New Hope 7 v2.1.4 — Admin Student Dashboard
-- Safe additive migration. No rows are deleted.

-- Keep the reliable assignment admin feed from v2.1.3.
create or replace function public.nh7_admin_school_assignments_feed(
  p_limit integer default 2000
)
returns setof public.school_assignments
language plpgsql
security definer
set search_path=public
as $$
begin
  if not coalesce(public.nh7_admin_is_admin_v170(), false) then
    raise exception 'Admin access required';
  end if;
  return query
  select a.*
  from public.school_assignments a
  order by
    case a.status when 'submitted' then 0 when 'needs_revision' then 1 when 'approved' then 2 else 3 end,
    a.updated_at desc
  limit greatest(1, least(coalesce(p_limit,2000),5000));
end;
$$;
revoke all on function public.nh7_admin_school_assignments_feed(integer) from public, anon;
grant execute on function public.nh7_admin_school_assignments_feed(integer) to authenticated;

create or replace function public.nh7_admin_review_school_assignment(
  p_id uuid,
  p_status text,
  p_score integer,
  p_feedback text default ''
)
returns public.school_assignments
language plpgsql
security definer
set search_path=public
as $$
declare
  v_row public.school_assignments;
  v_status text := lower(coalesce(p_status,''));
  v_score integer := greatest(0,least(100,coalesce(p_score,0)));
begin
  if not coalesce(public.nh7_admin_is_admin_v170(), false) then
    raise exception 'Admin access required';
  end if;
  if v_status not in ('approved','needs_revision','submitted') then
    raise exception 'Invalid assignment status';
  end if;
  update public.school_assignments
  set status=v_status,
      score_percent=case when v_status='needs_revision' then 0 else v_score end,
      admin_feedback=coalesce(p_feedback,''),
      reviewed_at=case when v_status in ('approved','needs_revision') then now() else null end,
      updated_at=now()
  where id=p_id
  returning * into v_row;
  if v_row.id is null then raise exception 'Assignment not found'; end if;
  return v_row;
end;
$$;
revoke all on function public.nh7_admin_review_school_assignment(uuid,text,integer,text) from public, anon;
grant execute on function public.nh7_admin_review_school_assignment(uuid,text,integer,text) to authenticated;

-- Future-compatible certificate registry. It does not issue certificates yet;
-- the dashboard can already show Issued / Pending / Revoked when records exist.
create table if not exists public.school_certificates (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  user_name text default '',
  course_code text not null default 'foundation_school',
  certificate_number text unique,
  status text not null default 'draft' check (status in ('draft','approved','revoked')),
  final_score_percent integer,
  pdf_url text default '',
  preview_url text default '',
  approved_by text default '',
  approved_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_email,course_code)
);
create index if not exists school_certificates_user_idx on public.school_certificates(lower(user_email),course_code,updated_at desc);
alter table public.school_certificates enable row level security;
drop policy if exists "school certificates own or admin read" on public.school_certificates;
create policy "school certificates own or admin read" on public.school_certificates for select to authenticated
using (
  lower(user_email)=lower(coalesce(auth.jwt()->>'email',''))
  or coalesce((select public.nh7_admin_is_admin_v170()),false)
);
drop policy if exists "school certificates admin manage" on public.school_certificates;
create policy "school certificates admin manage" on public.school_certificates for all to authenticated
using (coalesce((select public.nh7_admin_is_admin_v170()),false))
with check (coalesce((select public.nh7_admin_is_admin_v170()),false));
grant select on public.school_certificates to authenticated;
grant insert,update,delete on public.school_certificates to authenticated;

notify pgrst, 'reload schema';
