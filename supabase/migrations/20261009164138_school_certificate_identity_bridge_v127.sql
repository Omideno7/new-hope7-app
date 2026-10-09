-- New Hope 7 — School Certificate Identity Bridge v127
-- Wave 1J-A only: add durable recipient identity metadata to certificates.
-- Public QR/document lookup behavior is intentionally untouched in this wave.

DO $preflight$
DECLARE
  v_rows bigint;
  v_matches bigint;
  v_dup bigint;
  v_existing integer;
BEGIN
  SELECT count(*) INTO v_existing
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='school_certificates'
    AND column_name IN ('recipient_user_id','student_code');
  IF v_existing<>0 THEN
    RAISE EXCEPTION 'Wave 1J-A certificate identity columns already exist or are partially applied';
  END IF;

  SELECT count(*) INTO v_rows FROM public.school_certificates;
  SELECT count(*) INTO v_matches
  FROM public.school_certificates c
  JOIN auth.users u ON lower(trim(u.email))=lower(trim(c.user_email))
  JOIN public.school_student_identities i ON i.user_id=u.id AND i.status='active';
  SELECT count(*) INTO v_dup
  FROM (
    SELECT user_id FROM public.school_student_identities
    WHERE status='active'
    GROUP BY user_id HAVING count(*)>1
  ) d;

  IF v_rows<>3 OR v_matches<>3 OR v_dup<>0 THEN
    RAISE EXCEPTION 'Wave 1J-A live baseline drifted: rows=%, identity_matches=%, duplicate_identity_users=%',v_rows,v_matches,v_dup;
  END IF;
END
$preflight$;

ALTER TABLE public.school_certificates
  ADD COLUMN recipient_user_id uuid,
  ADD COLUMN student_code text;

CREATE INDEX school_certificates_recipient_user_id_idx_v127
  ON public.school_certificates(recipient_user_id);
CREATE INDEX school_certificates_student_code_idx_v127
  ON public.school_certificates(student_code);

UPDATE public.school_certificates c
SET recipient_user_id=i.user_id,
    student_code=i.student_code,
    updated_at=now()
FROM auth.users u
JOIN public.school_student_identities i ON i.user_id=u.id AND i.status='active'
WHERE lower(trim(c.user_email))=lower(trim(u.email))
  AND c.recipient_user_id IS NULL;

CREATE OR REPLACE FUNCTION private.nh7_school_certificate_identity_guard_v127()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $function$
DECLARE
  v_uid uuid;
  v_code text;
BEGIN
  IF tg_op='UPDATE' AND old.recipient_user_id IS NOT NULL THEN
    new.recipient_user_id:=old.recipient_user_id;
    new.student_code:=old.student_code;
    RETURN new;
  END IF;

  new.recipient_user_id:=NULL;
  new.student_code:=NULL;

  IF coalesce(trim(new.user_email),'')<>'' THEN
    SELECT i.user_id,i.student_code
      INTO v_uid,v_code
    FROM auth.users u
    JOIN public.school_student_identities i ON i.user_id=u.id AND i.status='active'
    WHERE lower(trim(u.email))=lower(trim(new.user_email))
    LIMIT 1;
  END IF;

  new.recipient_user_id:=v_uid;
  new.student_code:=v_code;
  RETURN new;
END;
$function$;

REVOKE ALL ON FUNCTION private.nh7_school_certificate_identity_guard_v127() FROM PUBLIC;

CREATE TRIGGER nh7_school_certificate_identity_guard_v127
BEFORE INSERT OR UPDATE OF user_email,recipient_user_id,student_code
ON public.school_certificates
FOR EACH ROW
EXECUTE FUNCTION private.nh7_school_certificate_identity_guard_v127();

DO $postflight$
DECLARE
  v_rows bigint;
  v_bound bigint;
  v_bad bigint;
  v_trigger boolean;
  v_cfg text[];
BEGIN
  SELECT count(*),count(*) FILTER (WHERE recipient_user_id IS NOT NULL AND coalesce(student_code,'')<>'')
    INTO v_rows,v_bound
  FROM public.school_certificates;

  SELECT count(*) INTO v_bad
  FROM public.school_certificates c
  LEFT JOIN public.school_student_identities i ON i.user_id=c.recipient_user_id
  WHERE c.recipient_user_id IS NOT NULL
    AND (i.user_id IS NULL OR i.status<>'active' OR i.student_code IS DISTINCT FROM c.student_code);

  SELECT EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='public.school_certificates'::regclass
      AND tgname='nh7_school_certificate_identity_guard_v127'
      AND NOT tgisinternal
  ) INTO v_trigger;

  SELECT coalesce(p.proconfig,'{}'::text[]) INTO v_cfg
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='private' AND p.proname='nh7_school_certificate_identity_guard_v127'
  LIMIT 1;

  IF v_rows<>3 OR v_bound<>3 OR v_bad<>0 OR NOT v_trigger OR NOT ('search_path=""'=any(v_cfg)) THEN
    RAISE EXCEPTION 'Wave 1J-A postflight failed: rows=%, bound=%, bad=%, trigger=%, config=%',v_rows,v_bound,v_bad,v_trigger,v_cfg;
  END IF;
END
$postflight$;

NOTIFY pgrst,'reload schema';