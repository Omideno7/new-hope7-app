-- REVIEW ONLY. Not an ordinary migration. Intentionally refuses direct execution.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'Batch3B requires owner approval and reconciled preflight'; END $$;
-- BEGIN SYNTHETIC CANDIDATE
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE private.nh7_connect_items_b3b(
 id uuid PRIMARY KEY, revision integer NOT NULL CHECK(revision>0),
 category text NOT NULL CHECK(category IN ('meetings','groups','media')),
 title jsonb NOT NULL, description jsonb NOT NULL DEFAULT '{}', schedule jsonb NOT NULL DEFAULT '{}',
 platform text NOT NULL, destination text NOT NULL,
 meeting_id text NOT NULL DEFAULT '', passcode text NOT NULL DEFAULT '',
 starts_at timestamptz, ends_at timestamptz, timezone text NOT NULL DEFAULT 'UTC',
 audience text NOT NULL CHECK(audience IN ('public','authenticated','admin')),
 active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL CHECK(sort_order BETWEEN 0 AND 100000),
 CHECK(audience<>'public' OR passcode=''), CHECK(ends_at IS NULL OR starts_at IS NOT NULL AND ends_at>starts_at),
 CHECK(destination ~ '^https://[A-Za-z0-9][A-Za-z0-9.-]+(/|$)' AND destination !~ '[[:cntrl:]]')
);
ALTER TABLE private.nh7_connect_items_b3b ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.nh7_connect_items_b3b FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.nh7_connect_catalog_b3b() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(x ORDER BY x.sort_order,x.id),'[]'::jsonb) FROM (
 SELECT id,category,title,description,platform,audience,active,sort_order FROM private.nh7_connect_items_b3b
 WHERE active AND (audience='public' OR auth.uid() IS NOT NULL AND audience='authenticated'
 OR auth.uid() IS NOT NULL AND audience='admin' AND private.nh7_admin_is_owner_v350())
 ORDER BY sort_order,id LIMIT 200) x
$$;
CREATE FUNCTION public.nh7_connect_detail_b3b(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.nh7_connect_items_b3b; BEGIN
 SELECT * INTO r FROM private.nh7_connect_items_b3b WHERE id=p_id AND active;
 IF NOT FOUND OR NOT (r.audience='public' OR auth.uid() IS NOT NULL AND r.audience='authenticated'
 OR auth.uid() IS NOT NULL AND r.audience='admin' AND private.nh7_admin_is_owner_v350())
 THEN RAISE EXCEPTION 'connect_unavailable' USING ERRCODE='42501'; END IF;
 RETURN to_jsonb(r); END $$;
CREATE FUNCTION public.nh7_connect_admin_list_b3b() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT private.nh7_admin_is_owner_v350() THEN RAISE EXCEPTION 'owner_required' USING ERRCODE='42501'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(r ORDER BY r.sort_order,r.id),'[]'::jsonb) FROM (SELECT * FROM private.nh7_connect_items_b3b ORDER BY sort_order,id LIMIT 200) r);
END $$;
CREATE FUNCTION public.nh7_connect_admin_save_b3b(p_item jsonb) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.nh7_connect_items_b3b; v_revision integer; BEGIN
 IF auth.uid() IS NULL OR NOT private.nh7_admin_is_owner_v350() THEN RAISE EXCEPTION 'owner_required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_item)<>'object' OR length(p_item::text)>24000 OR NOT ((p_item->'title') ?& ARRAY['fa','en','hr'])
 OR EXISTS(SELECT 1 FROM jsonb_each_text(p_item->'title') WHERE length(btrim(value))=0 OR length(value)>300)
 OR p_item->>'destination' !~ '^https://[A-Za-z0-9][A-Za-z0-9.-]+(/|$)'
 OR p_item->>'destination' ~ '[[:cntrl:]]'
 OR p_item->>'destination' ~* '^https://(localhost|127[.]|0[.]|10[.]|192[.]168[.]|169[.]254[.]|[^/]*[.]local(/|$))'
 THEN RAISE EXCEPTION 'invalid_connect_item'; END IF;
 v_revision:=coalesce((p_item->>'revision')::integer,0);
 r:=jsonb_populate_record(null::private.nh7_connect_items_b3b,p_item);
 IF r.id IS NULL OR r.category IS NULL OR r.audience IS NULL OR r.platform IS NULL OR r.destination IS NULL OR r.active IS NULL OR r.sort_order IS NULL THEN RAISE EXCEPTION 'invalid_connect_item'; END IF;
 r.revision:=v_revision+1;r.meeting_id:=coalesce(r.meeting_id,'');r.passcode:=coalesce(r.passcode,'');r.description:=coalesce(r.description,'{}');r.schedule:=coalesce(r.schedule,'{}');r.timezone:=coalesce(nullif(r.timezone,''),'UTC');
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name=r.timezone) THEN RAISE EXCEPTION 'invalid_connect_timezone'; END IF;
 IF r.starts_at IS NULL AND r.ends_at IS NOT NULL THEN RAISE EXCEPTION 'invalid_connect_time'; END IF;
 IF v_revision=0 THEN INSERT INTO private.nh7_connect_items_b3b SELECT r.*;
 ELSE
 UPDATE private.nh7_connect_items_b3b SET (revision,category,title,description,schedule,platform,destination,meeting_id,passcode,starts_at,ends_at,timezone,audience,active,sort_order)=(r.revision,r.category,r.title,r.description,r.schedule,r.platform,r.destination,r.meeting_id,r.passcode,r.starts_at,r.ends_at,r.timezone,r.audience,r.active,r.sort_order) WHERE id=r.id AND revision=v_revision;
 IF NOT FOUND THEN RAISE EXCEPTION 'connect_revision_conflict' USING ERRCODE='40001'; END IF;
 END IF;
 RETURN jsonb_build_object('id',r.id,'revision',r.revision);
END $$;
REVOKE ALL ON FUNCTION public.nh7_connect_catalog_b3b() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.nh7_connect_detail_b3b(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.nh7_connect_admin_list_b3b() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.nh7_connect_admin_save_b3b(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nh7_connect_catalog_b3b() TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nh7_connect_detail_b3b(uuid) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.nh7_connect_admin_list_b3b() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nh7_connect_admin_save_b3b(jsonb) TO authenticated;
-- END SYNTHETIC CANDIDATE
ROLLBACK;
