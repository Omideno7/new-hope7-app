-- Fail closed for obsolete unidentifiable exam submissions after explicit activation.
-- Current clients use nh7_school_submit_v580 with a durable request ID.
create or replace function public.nh7_submit_school_exam_v340(p_exam_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin raise exception 'update_school_client_required';end $$;
revoke all on function public.nh7_submit_school_exam_v340(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.nh7_submit_school_exam_v340(uuid,jsonb) to authenticated;

create or replace function public.nh7_school_progress_save_v340(p_lesson_code text,p_progress_percent integer default null,p_completed_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path='' as $$
begin return private.nh7_school_progress_v580(p_lesson_code,p_progress_percent,p_completed_at,0);end $$;
create or replace function public.nh7_submit_school_assignment(p_course_code text,p_lesson_code text,p_answer_text text,p_language text default 'en',p_user_name text default '')
returns public.school_assignments language plpgsql security definer set search_path='' as $$
begin return private.nh7_school_assignment_v580(p_course_code,p_lesson_code,p_answer_text,p_language,p_user_name,0);end $$;

-- Keep standard assignment review contract/approved gating, but never alter a closed cycle.
create or replace function public.nh7_admin_review_school_assignment(p_id uuid,p_status text,p_score integer,p_feedback text default '')
returns public.school_assignments language plpgsql security definer set search_path='' as $$
declare r public.school_assignments; v_status text:=lower(coalesce(p_status,''));
begin
 if auth.uid() is null or not coalesce(public.nh7_admin_is_admin_v170(),false) then raise exception 'Admin access required' using errcode='42501';end if;
 if v_status not in('approved','needs_revision','submitted') then raise exception 'invalid_assignment_status';end if;
 select * into r from public.school_assignments where id=p_id;
 if not found then raise exception 'assignment_not_found';end if;
 perform private.nh7_school_ensure_cycle_v580(r.user_id,r.course_code);
 if r.school_cycle<>private.nh7_school_cycle_v580(r.user_id,r.course_code) then raise exception 'closed_cycle_immutable';end if;
 update public.school_assignments set status=v_status,score_percent=greatest(0,least(100,coalesce(p_score,0))),admin_feedback=coalesce(p_feedback,''),reviewed_at=case when v_status in('approved','needs_revision') then now() else null end,updated_at=now() where id=p_id returning * into r;
 perform private.nh7_recalculate_exam_scores_identity_v128(r.user_id,r.user_email,r.course_code);
 return r;
end $$;
revoke all on function public.nh7_admin_review_school_assignment(uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.nh7_admin_review_school_assignment(uuid,text,integer,text) to authenticated;

revoke all on function private.nh7_school_grade_v580(uuid,jsonb,integer),private.nh7_school_progress_v580(text,integer,timestamptz,integer),private.nh7_school_assignment_v580(text,text,text,text,text,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_school_progress_save_v340(text,integer,timestamptz),public.nh7_submit_school_assignment(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.nh7_school_progress_save_v340(text,integer,timestamptz),public.nh7_submit_school_assignment(text,text,text,text,text) to authenticated;

-- Legacy score lookup remains read-only, but never accepts another student's email
-- as authority. Preserve the existing TABLE result contract for actual own/Admin callers.
create or replace function public.nh7_assignment_score_for_user(p_user_email text,p_course_code text)
returns table(score_percent integer,completed_count integer,total_count integer)
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); target uuid;
begin
 if uid is null then raise exception 'login_required' using errcode='42501';end if;
 target:=private.nh7_school_activity_owner_v580(null,p_user_email);
 if target is null then raise exception 'student_identity_required' using errcode='42501';end if;
 if target<>uid and not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'permission_denied' using errcode='42501';end if;
 if target=uid and not public.nh7_school_access_approved_v230(uid,'','') then raise exception 'school_approval_required' using errcode='42501';end if;
 return query select * from private.nh7_assignment_score_for_identity_v128(target,p_user_email,p_course_code);
end $$;
revoke all on function public.nh7_assignment_score_for_user(text,text) from public,anon,authenticated;
grant execute on function public.nh7_assignment_score_for_user(text,text) to authenticated;
