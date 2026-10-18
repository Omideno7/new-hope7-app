-- REVIEW ONLY, not executed. Never export real question/answer text.
SELECT column_name,udt_name,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='qa_questions' ORDER BY ordinal_position;
SELECT p.oid::regprocedure,p.prosecdef,p.proacl,md5(pg_get_functiondef(p.oid)) definition_md5 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('nh7_submit_question_v340','nh7_my_questions_v220','nh7_my_questions_v341','nh7_public_answered_questions_v340','nh7_public_answered_questions_v341');
SELECT policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='qa_questions';
SELECT conname,conrelid::regclass,confrelid::regclass FROM pg_constraint WHERE contype='f' AND confrelid='public.qa_questions'::regclass;
