-- REVIEW ONLY / UNAPPLIED. Not an ordinary migration. No live request authorized.
-- BLOCKED_ACTIVATION: prove the exact live UID binding and ALL public readers,
-- multilingual projections, linked-answer stores and cached public delivery first.
-- This candidate intentionally refuses email/device-only legacy ownership.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='qa_questions' AND column_name='user_id' AND udt_name='uuid') THEN
  RAISE EXCEPTION 'BLOCKED_ACTIVATION: exact trusted qa_questions.user_id UUID binding required';
 END IF;
 IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='qa_questions' AND column_name IN('question_fa','question_en','question_hr','answer_fa','answer_en','answer_hr') AND udt_name='text')<>6 THEN
  RAISE EXCEPTION 'BLOCKED_ACTIVATION: reconcile exact v341 translation columns before activation';
 END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.nh7_qa_removals_batch3a(
 question_id uuid PRIMARY KEY, actor_uid uuid NOT NULL, removed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.nh7_qa_removals_batch3a ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.nh7_qa_removals_batch3a FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.nh7_qa_remove_own_batch3a(p_question_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ DECLARE actor uuid:=auth.uid(); question public.qa_questions%rowtype;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
 SELECT * INTO question FROM public.qa_questions WHERE id=p_question_id FOR UPDATE;
 IF NOT FOUND OR question.user_id IS DISTINCT FROM actor THEN
  RAISE EXCEPTION 'question_unavailable' USING ERRCODE='42501';
 END IF;
 INSERT INTO private.nh7_qa_removals_batch3a(question_id,actor_uid) VALUES(p_question_id,actor) ON CONFLICT(question_id) DO NOTHING;
 -- Keep identity/row referential integrity; destroy both user-visible bodies.
 -- Exact v341 FA/EN/HR projections are scrubbed in this SAME transaction.
 -- Any additional live answer store/language projection still blocks activation.
 UPDATE public.qa_questions SET question_text='',answer_text=NULL,question_fa='',question_en='',question_hr='',answer_fa='',answer_en='',answer_hr='',status='hidden',updated_at=now() WHERE id=p_question_id AND user_id=actor;
 RETURN jsonb_build_object('removed',true,'question_id',p_question_id);
END $$;
REVOKE ALL ON FUNCTION public.nh7_qa_remove_own_batch3a(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nh7_qa_remove_own_batch3a(uuid) TO authenticated;
COMMIT;
