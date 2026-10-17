-- Exact function list; no blanket GRANT or privileged client credentials.
revoke all on function private.nh7_assignment_score_for_identity_v128(uuid,text,text),private.nh7_recalculate_exam_scores_identity_v128(uuid,text,text) from public,anon,authenticated;
revoke all on function public.nh7_school_exam_session_v340(text,text),public.nh7_school_class_exam_session_v351(text),public.nh7_school_final_exam_session_v351(text),public.nh7_school_path_state_v351(),public.nh7_get_my_school_snapshot_v2110() from public,anon,authenticated;
grant execute on function public.nh7_school_exam_session_v340(text,text),public.nh7_school_class_exam_session_v351(text),public.nh7_school_final_exam_session_v351(text),public.nh7_school_path_state_v351(),public.nh7_get_my_school_snapshot_v2110() to authenticated;
