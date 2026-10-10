-- New Hope 7 — Privacy-Minimal Public Certificate Verifier v127
-- Wave 1J-B1 only: add a new allow-listed public authenticity endpoint.
-- Existing document/certificate display lookups and QR URLs remain untouched.

DO $preflight$
DECLARE
  v_rows bigint;
  v_tokens bigint;
BEGIN
  IF to_regprocedure('public.nh7_public_certificate_verify_v127(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'Wave 1J-B1 safe verifier already exists or is partially applied';
  END IF;
  IF to_regprocedure('public.nh7_public_document_lookup_v222(uuid)') IS NULL
     OR to_regprocedure('public.nh7_public_certificate_lookup(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Legacy certificate lookup baseline is missing';
  END IF;

  SELECT count(*),count(*) FILTER (WHERE public_token IS NOT NULL)
    INTO v_rows,v_tokens
  FROM public.school_certificates;
  IF v_rows<>3 OR v_tokens<>3 THEN
    RAISE EXCEPTION 'Wave 1J-B1 certificate baseline drifted: rows=%, tokens=%',v_rows,v_tokens;
  END IF;
END
$preflight$;

CREATE OR REPLACE FUNCTION public.nh7_public_certificate_verify_v127(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=''
AS $function$
DECLARE
  v_number text;
  v_type text;
  v_issue date;
  v_status text;
  v_revoked_at timestamptz;
  v_version integer;
BEGIN
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('found',false,'verified',false,'verification_status','not_found','issuer','New Hope 7');
  END IF;
  SELECT c.certificate_number,c.certificate_type,coalesce(c.issue_date,c.approved_at::date,c.created_at::date),c.status,c.revoked_at,coalesce(c.document_version,1)
    INTO v_number,v_type,v_issue,v_status,v_revoked_at,v_version
  FROM public.school_certificates c WHERE c.public_token=p_token LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found',false,'verified',false,'verification_status','not_found','issuer','New Hope 7');
  END IF;
  IF lower(coalesce(v_status,''))<>'approved' OR v_revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('found',true,'verified',false,'verification_status','revoked','certificate_number',v_number,'certificate_type',coalesce(v_type,'certificate'),'issue_date',v_issue,'document_version',v_version,'issuer','New Hope 7');
  END IF;
  RETURN jsonb_build_object('found',true,'verified',true,'verification_status','valid','certificate_number',v_number,'certificate_type',coalesce(v_type,'certificate'),'issue_date',v_issue,'document_version',v_version,'issuer','New Hope 7');
END;
$function$;

REVOKE ALL ON FUNCTION public.nh7_public_certificate_verify_v127(uuid) FROM public,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.nh7_public_certificate_verify_v127(uuid) TO anon,authenticated,service_role;

DO $postflight$
DECLARE v_def text; v_cfg text[];
BEGIN
  SELECT pg_get_functiondef(p.oid),coalesce(p.proconfig,'{}'::text[]) INTO v_def,v_cfg
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='nh7_public_certificate_verify_v127' LIMIT 1;
  IF v_def IS NULL OR v_def NOT ILIKE '%verification_status%' OR v_def NOT ILIKE '%certificate_number%' OR v_def NOT ILIKE '%certificate_type%' OR v_def NOT ILIKE '%issue_date%' OR v_def NOT ILIKE '%document_version%' OR v_def NOT ILIKE '%issuer%' OR NOT ('search_path=""'=any(v_cfg)) THEN
    RAISE EXCEPTION 'Wave 1J-B1 verifier definition postflight failed';
  END IF;
  IF v_def ILIKE '%user_name%' OR v_def ILIKE '%user_email%' OR v_def ILIKE '%student_code%' OR v_def ILIKE '%recipient_user_id%' OR v_def ILIKE '%photo_url%' OR v_def ILIKE '%signature_url%' OR v_def ILIKE '%final_score%' OR v_def ILIKE '%body_fa%' OR v_def ILIKE '%body_en%' OR v_def ILIKE '%body_hr%' OR v_def ILIKE '%designation_%' OR v_def ILIKE '%custom_fields%' OR v_def ILIKE '%church_info%' THEN
    RAISE EXCEPTION 'Wave 1J-B1 verifier contains forbidden public fields';
  END IF;
  IF NOT has_function_privilege('anon','public.nh7_public_certificate_verify_v127(uuid)','EXECUTE') OR NOT has_function_privilege('authenticated','public.nh7_public_certificate_verify_v127(uuid)','EXECUTE') OR NOT has_function_privilege('service_role','public.nh7_public_certificate_verify_v127(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Wave 1J-B1 verifier ACL postflight failed';
  END IF;
END
$postflight$;

NOTIFY pgrst,'reload schema';