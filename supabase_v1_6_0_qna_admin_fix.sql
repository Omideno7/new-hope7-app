-- OmideNo7 v1.6.0 Q&A/admin and password-ready fixes

alter table public.qa_questions
  add column if not exists author_name text,
  add column if not exists author_email text;

-- Keep public answers anonymous in the app; admin panel can see author_name/author_email.
create index if not exists qa_questions_author_email_idx on public.qa_questions(lower(author_email));

-- Duplicate questions are prevented in the app UI. Existing database rows are preserved.
