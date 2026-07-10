-- OmideNo7 Admin v1.6.4-admin3
-- Allows the authenticated admin to permanently delete duplicate/unwanted Q&A rows.

alter table public.qa_questions enable row level security;

drop policy if exists "qa delete admin" on public.qa_questions;

create policy "qa delete admin" on public.qa_questions
for delete to authenticated
using (public.nh7_is_admin());

-- Optional: ensure author fields exist for future questions.
alter table public.qa_questions
  add column if not exists author_name text,
  add column if not exists author_email text;
