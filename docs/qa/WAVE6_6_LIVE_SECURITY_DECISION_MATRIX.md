# Wave 6.6 live security decision matrix

No Production SQL, deployment, Auth/provider/paid-feature activation, real user/data mutation or migration was performed. Existing runtime and Wave 1–6.5 review source remain byte-identical to metadata baseline `4f6c702c3f9e996256a5f9410bfd6096b5f3f018`.

The preserved pre-export audit is historical: original `79fea0df2292ed3eb52b2f037596ff1062ba11e7`, replayed unchanged as `7bec2720848717c6707ba8d46a412a91ec28b802` on metadata `4f6c702c3f9e996256a5f9410bfd6096b5f3f018`. Its missing roster/type observations are resolved by that export; missing individual routine bodies/ACL dependencies remain explicit below. No audit was discarded or restarted.

Baseline: **4 ERROR, 270 WARN (32 anon + 236 authenticated + pg_net + leaked-password), 29 INFO**. Function union is 236, not 268. Exact signatures, ACLs, body/definition fingerprints, raw same-function source matches and tracked runtime references are in `supabase/review/wave6_6-live-security/function-dispositions.json`. `verify-wave66-evidence.py` recomputes every matched raw prosrc MD5, length and argument list, without normalizing whitespace; no decision uses name/boolean markers as proof. Definer guards are preserved; dependency caveats and nullable legacy IF NOT gates are recorded separately. A KEEP transport is not a claim an unexported private/helper body is audited live.

## Four Library view decision

| Option | Risk / decision |
| --- | --- |
| A: invoker on existing base SELECT | Reject blind conversion: restrictive base grants/RLS would deny legitimate clients; do not grant base SELECT to hide the error. |
| B: invoker/barrier compatibility view over typed current-caller definer | **Recommended review proposal for all four views.** Copy exact live predicates into two no-input typed functions; caller auth.uid/current grants remain authority. Preserve names, 25/12 ordered types, empty reader_text, NULL semantics, active/published rules and collection counts. No v396 response-envelope assumption. |
| C: direct RPC clients plus compatibility views | Possible later release, unnecessary runtime churn and old Store compatibility risk now; keep all current callers unchanged. |
| D: temporarily retain current views | Current live state remains until B's fresh ACL/owner/dependency snapshot, staging/device acceptance, exact rollback artifact and explicit approval exist. No claim the four live errors are fixed. |

| View | Before definition MD5 | Columns | Disposition |
| --- | --- | --- | --- |
| public.nh7_library_items_v224 | 4c965d6f56977723b947abde52c5bf1a | 25 | B proposed; D live pending gates |
| public.nh7_library_items_v251 | 4c965d6f56977723b947abde52c5bf1a | 25 | B proposed; D live pending gates |
| public.nh7_library_collections_public_v251 | 3a0b0f1a2c53dbbaa90d3b33b15c32d4 | 12 | B proposed; D live pending gates |
| public.nh7_library_collections_public_v322 | 3a0b0f1a2c53dbbaa90d3b33b15c32d4 | 12 | B proposed; D live pending gates |

The local PostgreSQL fixture reconstructs the exact supplied SELECTs and reproduces **all four supplied pg_get_viewdef MD5s**, compares results before/after, and checks every column's PostgreSQL type/order. It uses explicit synthetic authority helpers; this does not certify the live bodies of those helpers. Existing view ACLs are preserved, new helper grants derive only from captured explicit SELECT grantees (PUBLIC aborts). No base grant, file-flow, catalog RPC, runtime cache or reader body is changed.

| Caller | Item visibility | Collections / counts |
| --- | --- | --- |
| Anonymous | zero | zero |
| Unapproved authenticated | zero | zero |
| School approved, non-minister | active+published non-minister items | active non-minister collections; active/published same-audience library items only |
| Minister with current item grant, no School approval | granted active+published minister items | collection requires separate current collection entitlement; count only granted active/published minister items |
| Revoked minister | immediately loses revoked minister rows; keeps only separately eligible non-minister rows | revoked item lowers count, revoked collection disappears; empty granted collection retained |
| Admin | all active+published items, including Ministers; no drafts/inactive | active collections, all active/published same-audience library items |

Dynamic publication is visible on the next read. reader_text is always `{}` even for authorized/Admin; reader_available preserves SQL NULL for null mode/status. Signed-file Library flow, v321, caches and old clients are unchanged.

## Function disposition counts

Authenticated: {'BLOCKED_LIVE_BODY': 165, 'ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP': 40, 'USER_UID_ENDPOINT_KEEP': 4, 'SCHOOL_USER_ENDPOINT_KEEP': 16, 'OWNER_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP': 4, 'PUBLIC_COMPATIBILITY_ENDPOINT_KEEP': 7}.

Anon: {'BLOCKED_LIVE_BODY': 24, 'PUBLIC_VERIFICATION_REQUIRED': 2, 'PUBLIC_FEED_REQUIRED': 2, 'REGISTRATION_REQUIRED_ANON': 1, 'PUBLIC_REQUIRED_AND_GUARDED': 3}.

72 source bodies match, 71 authenticated transport decisions are supported by body inspection, 165 individual authenticated bodies/dependency paths remain blocked (164 unmatched + matched Inbox identity helpers). Anonymous registration is retained on owner-confirmed compatibility evidence, not invented source. No function is classified obsolete merely because no tracked caller exists. **SAFE_TO_REVOKE = 0; exact proposed existing-function ACL deltas = none.** The suspicious anon campaign/template/blessing/student-activity and three trigger/helper rows remain individually BLOCKED_LIVE_BODY. Missing private body proof can be supplied as owner attestation against fingerprints without publishing sensitive code.

Expected intentional residuals: 40 Admin + 4 owner + 4 UID + 16 School + 7 public-compatibility authenticated transports; 2 anon verification + 2 public feeds + 1 legacy signup + 3 retired no-op transports. The remaining 165 authenticated/24 anon blocks are unresolved warnings, not accepted safe endpoints. Counts overlap across roles. All 270 live warnings/4 errors/29 INFO remain unchanged in this no-activation wave. Future B creates two narrow SD endpoints; do not promise dashboard zero or simply subtract four errors from warnings.

## Priority anon and destructive endpoints

| Rows | Current tracked caller evidence | Exact remaining decision |
| --- | --- | --- |
| 12 campaign history, 70 message templates | js/nh7-admin-message-center-v416.js | Live signature/ACL/hash present, matching full body absent; BLOCKED_LIVE_BODY, no anon revoke yet. |
| 98 Admin sermon blessings | js/nh7-admin-review-blessings-v476.js; js/nh7-admin-sermon-social-v440.js | Body mismatch/absence; retain authenticated caller transport, no safety claim or guessed anon revoke. |
| 110 student activity | No tracked runtime reference found | Absence in current tree does not exclude Store/SQL callers; BLOCKED_LIVE_BODY. |
| 126 autoapprove, 127 approval blocker, 130 campaign inbox device helper | No tracked source/runtime caller proved | Return/trigger/dependency and exact bodies still unproven; no revoke by trigger-like name. |
| 25/26 Admin full delete, 129 self delete | Exact live signatures/ACLs/hashes known; no matching repository body | Existing endpoint coverage/authority cannot be certified. New full-delete source disabled; no destructive test against live endpoints. |
| 138 catalog v396 | js/nh7-library-security-v125.js | Keep working current caller path; missing exact body prevents declaring its entire response schema equivalent to old generic Wave65 adapter. New view proposal copies supplied view SQL instead. |

Zero functions are placed in obsolete/duplicate/service-only/internal revoke categories without proof. Zero recovery endpoints have a proven RECOVERY_REQUIRED_ANON body classification; those exact rows stay blocked rather than guessed from names. SQL callers and dynamically assembled names may exceed tracked string references; no absence-based ACL removal.

## Exact function rows

All current ACLs and evidence are linked by row in the JSON. NONE below authorizes execution or an ACL change.

| Row | Exact live signature | Anon disposition | Authenticated disposition |
| --- | --- | --- | --- |
| 1 | `public.nh7_admin_account_directory_v372(p_search text, p_test_only boolean)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 2 | `public.nh7_admin_account_directory_v395(p_search text, p_test_only boolean)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 3 | `public.nh7_admin_apocrypha_catalog_v274()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 4 | `public.nh7_admin_apocrypha_dashboard_v270()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 5 | `public.nh7_admin_apocrypha_disable_v270(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 6 | `public.nh7_admin_apocrypha_save_v270(p_item jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 7 | `public.nh7_admin_archive_inbox_messages_v225(p_ids uuid[])` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 8 | `public.nh7_admin_audio_analytics_v221(p_from date, p_to date, p_media_type text, p_language text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 9 | `public.nh7_admin_audio_analytics_v222(p_from date, p_to date, p_media_type text, p_language text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 10 | `public.nh7_admin_auth_user_count()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 11 | `public.nh7_admin_books_review_v362(p_book_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 12 | `public.nh7_admin_campaign_history_v416(p_limit integer)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 13 | `public.nh7_admin_cleanup_inbox_duplicates_v220()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 14 | `public.nh7_admin_cleanup_question_duplicates_v220()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 15 | `public.nh7_admin_cleanup_registration_duplicates(p_email text, p_type text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 16 | `public.nh7_admin_cleanup_registration_duplicates_v331(p_type text, p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 17 | `public.nh7_admin_cleanup_scheduled_inbox_duplicates()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 18 | `public.nh7_admin_completed_users_v380(p_search text, p_test_only boolean, p_limit integer)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 19 | `public.nh7_admin_content_access_dashboard_v251()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 20 | `public.nh7_admin_content_access_dashboard_v372()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 21 | `public.nh7_admin_content_access_dashboard_v395()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 22 | `public.nh7_admin_content_access_grant_v251(p_user_id uuid, p_scope text, p_resource_id uuid, p_expires_at timestamp with time zone, p_note text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 23 | `public.nh7_admin_content_access_revoke_v251(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 24 | `public.nh7_admin_content_users_v235(p_category text, p_content_id text, p_from date, p_to date, p_language text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 25 | `public.nh7_admin_delete_account_full_v372(p_user_id uuid, p_confirmation_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 26 | `public.nh7_admin_delete_account_full_v381(p_user_id uuid, p_confirmation_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 27 | `public.nh7_admin_delete_audio_bible_chapter_v221(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 28 | `public.nh7_admin_delete_church_member_v540(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 29 | `public.nh7_admin_delete_document_template_v221(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 30 | `public.nh7_admin_delete_document_v505(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 31 | `public.nh7_admin_delete_document_v507(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 32 | `public.nh7_admin_delete_inbox_messages_v218(p_ids text[])` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 33 | `public.nh7_admin_delete_inbox_messages_v220(p_ids text[])` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 34 | `public.nh7_admin_delete_question_v220(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 35 | `public.nh7_admin_delete_registration(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 36 | `public.nh7_admin_delete_registration_only_v372(p_registration_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 37 | `public.nh7_admin_delete_school_assignment(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 38 | `public.nh7_admin_engagement_analytics_v223(p_from date, p_to date, p_category text, p_language text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 39 | `public.nh7_admin_has_permission_v350(p_permission text)` | NOT_ANON_EXECUTABLE | USER_UID_ENDPOINT_KEEP |
| 40 | `public.nh7_admin_has_permission_v395(p_permission text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 41 | `public.nh7_admin_issue_certificate_v217(p_user_email text, p_user_name text, p_certificate_type text, p_language text, p_title_fa text, p_title_en text, p_title_hr text, p_designation_fa text, p_designation_en text, p_designation_hr text, p_body_fa text, p_body_en text, p_body_hr text, p_approved_by text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 42 | `public.nh7_admin_issue_document_v221(p_document jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 43 | `public.nh7_admin_issue_document_v222(p_document jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 44 | `public.nh7_admin_issue_school_certificate(p_user_email text, p_user_name text, p_course_code text, p_language text, p_final_score integer, p_approved_by text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 45 | `public.nh7_admin_issue_school_certificate_v218(p_user_email text, p_user_name text, p_course_code text, p_language text, p_final_score numeric, p_title_fa text, p_title_en text, p_title_hr text, p_body_fa text, p_body_en text, p_body_hr text, p_approved_by text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 46 | `public.nh7_admin_library_claim_code_create_v433(p_user_id uuid, p_scope text, p_resource_id uuid, p_expires_at timestamp with time zone, p_note text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 47 | `public.nh7_admin_library_claim_code_revoke_v433(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 48 | `public.nh7_admin_library_claim_codes_list_v433()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 49 | `public.nh7_admin_library_collection_delete_v322(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 50 | `public.nh7_admin_library_collection_save_v322(p_collection jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 51 | `public.nh7_admin_library_collections_dashboard_v322()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 52 | `public.nh7_admin_library_collections_light_v442()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 53 | `public.nh7_admin_library_dashboard_light_v440()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 54 | `public.nh7_admin_library_dashboard_v222()` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 55 | `public.nh7_admin_library_dashboard_v224()` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 56 | `public.nh7_admin_library_delete_item_v222(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 57 | `public.nh7_admin_library_hard_delete_v224(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 58 | `public.nh7_admin_library_import_ready_v434(p_item jsonb, p_expected_updated_at timestamp with time zone)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 59 | `public.nh7_admin_library_import_ready_v440(p_item jsonb, p_expected_updated_at timestamp with time zone)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 60 | `public.nh7_admin_library_master_cleanup_v428(p_batch_id text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 61 | `public.nh7_admin_library_master_import_v428(p_batch_id text, p_title_fa text, p_title_en text, p_title_hr text, p_audience text, p_reader_text jsonb, p_page_count integer, p_sort_order integer)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 62 | `public.nh7_admin_library_master_publish_v428(p_batch_id text, p_expected_count integer)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 63 | `public.nh7_admin_library_orphans_v274()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 64 | `public.nh7_admin_library_reading_v490(p_email text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 65 | `public.nh7_admin_library_save_item_v222(p_item jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 66 | `public.nh7_admin_library_save_item_v224(p_item jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 67 | `public.nh7_admin_library_set_visibility_v224(p_id uuid, p_visible boolean)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 68 | `public.nh7_admin_list_document_templates_v239()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 69 | `public.nh7_admin_list_user_notes_v414(p_search text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 70 | `public.nh7_admin_message_templates_v416()` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 71 | `public.nh7_admin_move_audio_bible_chapter_v221(p_id uuid, p_book_id uuid, p_chapter_number integer, p_language text, p_publish boolean)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 72 | `public.nh7_admin_my_access_v350()` | NOT_ANON_EXECUTABLE | USER_UID_ENDPOINT_KEEP |
| 73 | `public.nh7_admin_pending_summary_v253()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 74 | `public.nh7_admin_registration_cleanup_v350(p_email text, p_type text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 75 | `public.nh7_admin_registration_delete_v350(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 76 | `public.nh7_admin_registration_feed_v3(p_limit integer, p_offset integer)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 77 | `public.nh7_admin_registration_feed_v350(p_limit integer, p_offset integer, p_status text, p_type text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 78 | `public.nh7_admin_registration_review_v350(p_id uuid, p_status text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 79 | `public.nh7_admin_review_assignment_v237(p_id uuid, p_status text, p_score integer, p_feedback text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 80 | `public.nh7_admin_review_school_assignment(p_id uuid, p_status text, p_score integer, p_feedback text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 81 | `public.nh7_admin_revoke_document_v221(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 82 | `public.nh7_admin_save_certificate_design_v239(p_certificate_id uuid, p_design jsonb, p_layout text, p_logo_url text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 83 | `public.nh7_admin_save_document_template_v239(p_template_code text, p_name_fa text, p_name_en text, p_name_hr text, p_layout text, p_design jsonb, p_logo_url text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 84 | `public.nh7_admin_school_assignments_feed(p_limit integer)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 85 | `public.nh7_admin_school_assignments_feed_v237(p_limit integer)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 86 | `public.nh7_admin_school_assignments_feed_v238(p_limit integer)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 87 | `public.nh7_admin_school_legacy_summary_v542()` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 88 | `public.nh7_admin_school_media_dashboard_v260()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 89 | `public.nh7_admin_school_video_create_person_code_v317(p_label text, p_plain_code text, p_target_email text, p_target_name text, p_expires_at timestamp with time zone, p_video_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 90 | `public.nh7_admin_school_video_create_person_code_v392(p_label text, p_plain_code text, p_target_email text, p_target_name text, p_expires_at timestamp with time zone, p_video_ids uuid[])` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 91 | `public.nh7_admin_school_video_delete_v260(p_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 92 | `public.nh7_admin_school_video_disable_code_v260(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 93 | `public.nh7_admin_school_video_orphans_v316()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 94 | `public.nh7_admin_school_video_save_v260(p_item jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 95 | `public.nh7_admin_send_inbox_v360(p_user_email text, p_title text, p_body text, p_language text, p_category text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 96 | `public.nh7_admin_sermon_blessing_hard_delete_v504(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 97 | `public.nh7_admin_sermon_blessings_purge_hidden_v504()` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 98 | `public.nh7_admin_sermon_blessings_v440(p_limit integer)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 99 | `public.nh7_admin_spiritual_plan_activity_v241(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 100 | `public.nh7_admin_student_academic_center_v540(p_inactive_days integer)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 101 | `public.nh7_admin_student_academic_center_v541(p_inactive_days integer)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 102 | `public.nh7_admin_student_academic_center_v542(p_inactive_days integer)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 103 | `public.nh7_admin_student_academic_center_v543(p_inactive_days integer)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 104 | `public.nh7_admin_student_activity_v221(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 105 | `public.nh7_admin_student_activity_v222(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 106 | `public.nh7_admin_student_activity_v223(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 107 | `public.nh7_admin_student_activity_v235(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 108 | `public.nh7_admin_student_activity_v360(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 109 | `public.nh7_admin_student_activity_v427(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 110 | `public.nh7_admin_student_activity_v428(p_email text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 111 | `public.nh7_admin_student_activity_v451(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 112 | `public.nh7_admin_student_exam_status_v543()` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 113 | `public.nh7_admin_student_identity_directory_v128()` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 114 | `public.nh7_admin_student_identity_search_v127(p_query text, p_limit integer)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 115 | `public.nh7_admin_student_profile_v238(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 116 | `public.nh7_admin_student_profile_v451(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 117 | `public.nh7_admin_student_school_profile_v237(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 118 | `public.nh7_admin_sync_duplicate_registration_statuses()` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 119 | `public.nh7_admin_upsert_audio_bible_chapter_v221(p_chapter jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 120 | `public.nh7_admin_upsert_church_members_v540(p_members jsonb)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 121 | `public.nh7_admin_user_directory_v360()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 122 | `public.nh7_admin_video_student_options_v317()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 123 | `public.nh7_apocrypha_catalog_v270()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 124 | `public.nh7_apocrypha_items_v274(p_book_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 125 | `public.nh7_assignment_score_for_user(p_user_email text, p_course_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 126 | `public.nh7_autoapprove_legacy_school_v398()` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 127 | `public.nh7_block_incomplete_registration_approval_v352()` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 128 | `public.nh7_content_access_active_v251(p_user_id uuid, p_scope text, p_resource_id uuid)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 129 | `public.nh7_delete_my_account_v393(p_confirmation_email text, p_confirmation_phrase text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 130 | `public.nh7_fill_campaign_inbox_device_v361()` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 131 | `public.nh7_get_meeting_settings(p_email text, p_device_id text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 132 | `public.nh7_get_my_school_snapshot_v2110()` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 133 | `public.nh7_inbox_snapshot_v419(p_language text, p_message_limit integer, p_receipt_limit integer)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 134 | `public.nh7_library_authorize_v230(p_item_id uuid, p_code text, p_device_id text, p_user_id uuid, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 135 | `public.nh7_library_authorize_v251(p_item_id uuid, p_device_id text, p_user_id uuid, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 136 | `public.nh7_library_catalog_v341()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 137 | `public.nh7_library_catalog_v372()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 138 | `public.nh7_library_catalog_v396()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 139 | `public.nh7_library_claim_code_redeem_v433(p_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 140 | `public.nh7_library_collections_catalog_v341()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 141 | `public.nh7_library_reader_access_v250(p_item_id uuid, p_code text, p_device_id text, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 142 | `public.nh7_library_reader_access_v260(p_item_id uuid, p_language text, p_device_id text, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 143 | `public.nh7_library_reader_access_v321(p_item_id uuid, p_code text, p_device_id text, p_user_email text, p_language text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 144 | `public.nh7_library_reader_access_v372(p_item_id uuid, p_language text, p_device_id text, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 145 | `public.nh7_my_content_access_v251()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 146 | `public.nh7_my_content_access_v380()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 147 | `public.nh7_my_questions_v220(p_email text, p_device_id text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 148 | `public.nh7_my_student_identity_v127()` | NOT_ANON_EXECUTABLE | USER_UID_ENDPOINT_KEEP |
| 149 | `public.nh7_owner_account_action_v380(p_target_email text, p_action text, p_reason text, p_confirmation text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 150 | `public.nh7_owner_community_storage_orphans_v507()` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 151 | `public.nh7_owner_community_storage_stats_v504()` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 152 | `public.nh7_owner_content_access_for_user_v380(p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 153 | `public.nh7_owner_deactivate_admin_v350(p_user_id uuid)` | NOT_ANON_EXECUTABLE | OWNER_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 154 | `public.nh7_owner_list_admins_v350()` | NOT_ANON_EXECUTABLE | OWNER_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 155 | `public.nh7_owner_permission_catalog_v350()` | NOT_ANON_EXECUTABLE | OWNER_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 156 | `public.nh7_owner_prayer_delete_v504(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 157 | `public.nh7_owner_prayer_feed_v502(p_status text, p_limit integer)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 158 | `public.nh7_owner_prayer_reply_v505(p_id uuid, p_status text, p_admin_note text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 159 | `public.nh7_owner_prayer_set_status_v502(p_id uuid, p_status text, p_admin_note text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 160 | `public.nh7_owner_set_admin_permissions_v350(p_email text, p_display_name text, p_permissions text[], p_active boolean)` | NOT_ANON_EXECUTABLE | OWNER_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 161 | `public.nh7_owner_set_content_access_v380(p_user_email text, p_content_scope text, p_content_id text, p_content_title text, p_active boolean, p_notes text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 162 | `public.nh7_owner_set_library_item_access_v381(p_user_email text, p_item_id uuid, p_active boolean, p_notes text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 163 | `public.nh7_owner_testimony_delete_any_v504(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 164 | `public.nh7_owner_testimony_delete_rejected_v503(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 165 | `public.nh7_owner_testimony_feed_v502(p_status text, p_limit integer)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 166 | `public.nh7_owner_testimony_mark_private_released_v504(p_id uuid)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 167 | `public.nh7_owner_testimony_publish_v502(p_id uuid, p_public_audio_path text, p_admin_note text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 168 | `public.nh7_owner_testimony_reject_v502(p_id uuid, p_admin_note text)` | NOT_ANON_EXECUTABLE | ADMIN_ENDPOINT_AUTHENTICATED_TRANSPORT_KEEP |
| 169 | `public.nh7_password_recovery_allowed_v372(p_email text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 170 | `public.nh7_public_answered_questions_i18n_v341(p_limit integer, p_lang text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 171 | `public.nh7_public_answered_questions_v340(p_limit integer)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 172 | `public.nh7_public_certificate_lookup(p_token uuid)` | PUBLIC_VERIFICATION_REQUIRED | PUBLIC_COMPATIBILITY_ENDPOINT_KEEP |
| 173 | `public.nh7_public_certificate_verify_v127(p_token uuid)` | PUBLIC_VERIFICATION_REQUIRED | PUBLIC_COMPATIBILITY_ENDPOINT_KEEP |
| 174 | `public.nh7_public_document_lookup_v221(p_token uuid)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 175 | `public.nh7_public_document_lookup_v222(p_token uuid)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 176 | `public.nh7_public_testimony_feed_v502(p_language text, p_limit integer)` | PUBLIC_FEED_REQUIRED | PUBLIC_COMPATIBILITY_ENDPOINT_KEEP |
| 177 | `public.nh7_qa_library_catalog_v363()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 178 | `public.nh7_qa_library_reader_access_v363(p_item_id uuid, p_language text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 179 | `public.nh7_recovery_eligibility_v380(p_email text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 180 | `public.nh7_registration_access_v2(p_type text, p_email text, p_device_id text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 181 | `public.nh7_registration_complete_approved_v372(p_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 182 | `public.nh7_registration_status(p_type text, p_email text, p_device_id text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 183 | `public.nh7_school_access_approved_v223(p_email text, p_device_id text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 184 | `public.nh7_school_access_approved_v230(p_user_id uuid, p_email text, p_device_id text)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 185 | `public.nh7_school_audio_status_v372(p_lesson_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 186 | `public.nh7_school_class_exam_session_v350(p_class_key text)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 187 | `public.nh7_school_class_exam_session_v351(p_class_key text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 188 | `public.nh7_school_exam_session_v340(p_course_code text, p_lesson_code text)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 189 | `public.nh7_school_exam_session_v372(p_course_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 190 | `public.nh7_school_exam_session_v373(p_course_code text, p_lesson_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 191 | `public.nh7_school_exam_session_v380(p_course_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 192 | `public.nh7_school_exam_session_v381(p_course_code text, p_lesson_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 193 | `public.nh7_school_final_exam_session_v350(p_course_code text)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 194 | `public.nh7_school_final_exam_session_v351(p_course_code text)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 195 | `public.nh7_school_gate_status_v373(p_course_code text, p_lesson_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 196 | `public.nh7_school_gate_status_v381(p_course_code text, p_lesson_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 197 | `public.nh7_school_media_authorize_v260(p_kind text, p_lesson_code text, p_video_id uuid, p_code text, p_device_id text, p_user_id uuid, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 198 | `public.nh7_school_path_state_v350()` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 199 | `public.nh7_school_path_state_v351()` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 200 | `public.nh7_school_preapproved_v398(p_email text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 201 | `public.nh7_school_progress_save_v340(p_lesson_code text, p_progress_percent integer, p_completed_at timestamp with time zone)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 202 | `public.nh7_school_record_audio_v380(p_lesson_code text, p_position_seconds integer, p_duration_seconds integer, p_delta_seconds integer, p_ended boolean)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 203 | `public.nh7_school_requirements_v372(p_course_code text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 204 | `public.nh7_school_requirements_v380(p_course_code text)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 205 | `public.nh7_school_video_catalog_v260()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 206 | `public.nh7_sermon_add_blessing_v440(p_sermon_id uuid, p_text text)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 207 | `public.nh7_sermon_catalog_v392()` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 208 | `public.nh7_sermon_delete_blessing_v440(p_id uuid)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 209 | `public.nh7_sermon_social_batch_v444(p_sermon_ids uuid[], p_limit integer)` | PUBLIC_FEED_REQUIRED | PUBLIC_COMPATIBILITY_ENDPOINT_KEEP |
| 210 | `public.nh7_sermon_social_state_v440(p_sermon_id uuid, p_limit integer)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 211 | `public.nh7_sermon_toggle_like_v440(p_sermon_id uuid)` | BLOCKED_LIVE_BODY | BLOCKED_LIVE_BODY |
| 212 | `public.nh7_set_my_student_photo_v127(p_photo_path text)` | NOT_ANON_EXECUTABLE | USER_UID_ENDPOINT_KEEP |
| 213 | `public.nh7_submit_registration_v3(p_type text, p_email text, p_device_id text, p_language text, p_payload jsonb)` | REGISTRATION_REQUIRED_ANON | BLOCKED_LIVE_BODY |
| 214 | `public.nh7_submit_school_assignment(p_course_code text, p_lesson_code text, p_answer_text text, p_language text, p_user_name text)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 215 | `public.nh7_submit_school_assignment_v372(p_course_code text, p_lesson_code text, p_answer_text text, p_language text, p_user_name text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 216 | `public.nh7_submit_school_assignment_v373(p_course_code text, p_lesson_code text, p_answer_text text, p_language text, p_user_name text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 217 | `public.nh7_submit_school_assignment_v381(p_course_code text, p_lesson_code text, p_answer_text text, p_language text, p_user_name text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 218 | `public.nh7_submit_school_class_exam_v350(p_class_key text, p_exam_id uuid, p_answers jsonb)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 219 | `public.nh7_submit_school_class_exam_v351(p_class_key text, p_exam_id uuid, p_answers jsonb)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 220 | `public.nh7_submit_school_exam_v340(p_exam_id uuid, p_answers jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 221 | `public.nh7_submit_school_exam_v372(p_exam_id uuid, p_answers jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 222 | `public.nh7_submit_school_exam_v373(p_exam_id uuid, p_answers jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 223 | `public.nh7_submit_school_exam_v380(p_exam_id uuid, p_answers jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 224 | `public.nh7_submit_school_exam_v381(p_exam_id uuid, p_answers jsonb)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 225 | `public.nh7_submit_school_final_exam_v350(p_exam_id uuid, p_answers jsonb, p_course_code text)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 226 | `public.nh7_submit_school_final_exam_v351(p_exam_id uuid, p_answers jsonb, p_course_code text)` | NOT_ANON_EXECUTABLE | SCHOOL_USER_ENDPOINT_KEEP |
| 227 | `public.nh7_track_app_presence_v360(p_seconds integer)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 228 | `public.nh7_track_app_section_v222(p_section text, p_device_id text, p_user_email text)` | PUBLIC_REQUIRED_AND_GUARDED | PUBLIC_COMPATIBILITY_ENDPOINT_KEEP |
| 229 | `public.nh7_track_audio_session_v222(p_session_id text, p_device_id text, p_user_email text, p_media_type text, p_media_id text, p_title text, p_topic text, p_source_group text, p_language text, p_duration_seconds integer, p_position_seconds integer, p_delta_seconds integer, p_event text, p_playback_rate numeric, p_seek_count integer, p_started_position_seconds integer)` | PUBLIC_REQUIRED_AND_GUARDED | PUBLIC_COMPATIBILITY_ENDPOINT_KEEP |
| 230 | `public.nh7_track_content_v223(p_content_type text, p_content_id text, p_title text, p_language text, p_device_id text, p_user_email text, p_event text, p_engaged_seconds integer)` | PUBLIC_REQUIRED_AND_GUARDED | PUBLIC_COMPATIBILITY_ENDPOINT_KEEP |
| 231 | `public.nh7_video_authorize_v251(p_video_id uuid, p_device_id text, p_user_id uuid, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 232 | `public.nh7_video_authorize_v270(p_video_id uuid, p_code text, p_device_id text, p_user_id uuid, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 233 | `public.nh7_video_authorize_v392(p_video_id uuid, p_code text, p_device_id text, p_user_id uuid, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 234 | `public.nh7_video_portal_authorize_v251(p_device_id text, p_user_id uuid, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 235 | `public.nh7_video_portal_authorize_v270(p_code text, p_device_id text, p_user_id uuid, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |
| 236 | `public.nh7_video_portal_authorize_v392(p_code text, p_device_id text, p_user_id uuid, p_user_email text)` | NOT_ANON_EXECUTABLE | BLOCKED_LIVE_BODY |

## Exact RLS/no-policy dispositions

{'LEGACY_RECOVERY_KEEP_LOCKED': 4, 'ADMIN_RPC_ONLY': 4, 'BLOCKED_LIVE_FACT': 10, 'INTENTIONAL_DENY_ALL': 9, 'SERVICE_ONLY': 2}. Zero MISSING_POLICY_REAL_GAP proven; unresolved facts are not evidence to add policies. Existing source role revokes support intended deny-all, but live relacl/effective schema grants were not exported: every row records that remaining preflight fact. RLS deny-all itself prevents direct client rows absent privileged bypass; an EXECUTE-definer path requires its own body authority.

| Table | Disposition | Intended path |
| --- | --- | --- |
| `nh7_library_recovery_20260906.before_state` | LEGACY_RECOVERY_KEEP_LOCKED | Recovery provenance only; no current runtime caller |
| `nh7_library_recovery_20260906.chunks` | LEGACY_RECOVERY_KEEP_LOCKED | Recovery provenance only; no current runtime caller |
| `nh7_library_recovery_20260906.sources` | LEGACY_RECOVERY_KEEP_LOCKED | Recovery provenance only; no current runtime caller |
| `nh7_library_recovery_20260906.targets` | LEGACY_RECOVERY_KEEP_LOCKED | Recovery provenance only; no current runtime caller |
| `private.nh7_admin_audit_log_v350` | ADMIN_RPC_ONLY | private RBAC tables through v350 owner/permission RPCs |
| `private.nh7_admin_members_v350` | ADMIN_RPC_ONLY | private RBAC tables through v350 owner/permission RPCs |
| `private.nh7_admin_permission_catalog_v350` | ADMIN_RPC_ONLY | private RBAC tables through v350 owner/permission RPCs |
| `private.nh7_admin_permission_grants_v350` | ADMIN_RPC_ONLY | private RBAC tables through v350 owner/permission RPCs |
| `public._nh7_book_master_stage_14_21` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.nh7_account_content_grants_v251` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.nh7_admin_account_actions_v380` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.nh7_apocrypha_books_v270` | INTENTIONAL_DENY_ALL | Apocrypha catalog/admin RPC |
| `public.nh7_content_entitlements_v380` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.nh7_legacy_auth_claim_audit` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.nh7_library_claim_codes_v433` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.nh7_library_import_history_v434` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.nh7_notification_runtime_secret` | SERVICE_ONLY | nh7-send-notifications serviceFetch |
| `public.nh7_school_audio_progress_v380` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.nh7_school_video_code_items_v392` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.nh7_school_video_codes_v260` | INTENTIONAL_DENY_ALL | Video code authorization/admin RPC |
| `public.nh7_school_video_grants_v260` | INTENTIONAL_DENY_ALL | Video grants authorization/admin RPC |
| `public.nh7_school_videos_v260` | INTENTIONAL_DENY_ALL | School video catalog/admin RPC |
| `public.nh7_sermon_blessings_v440` | INTENTIONAL_DENY_ALL | Published social batch and guarded moderation RPC |
| `public.nh7_sermon_likes_v440` | INTENTIONAL_DENY_ALL | Published social batch RPC |
| `public.notification_dispatch_log` | SERVICE_ONLY | nh7-send-notifications serviceFetch |
| `public.notification_schedule` | BLOCKED_LIVE_FACT | Missing live definition/grants/caller ownership proof. Singular notification_schedule is NOT current notification_schedules. |
| `public.school_course_stage_lessons` | INTENTIONAL_DENY_ALL | Internal stage model, no direct grants |
| `public.school_course_stages` | INTENTIONAL_DENY_ALL | Internal stage model, no direct grants |
| `public.school_student_identities` | INTENTIONAL_DENY_ALL | Current-UID identity/photo and Admin directory RPC |

The four recovery tables stay locked; private RBAC tables remain Admin-RPC-only. Runtime secret and dispatch log stay service-only. Singular notification_schedule is not current notification_schedules; exact legacy ownership/dependencies are unresolved. No system-schema census substitution (53) or cosmetic policy.

## Wave 6.5 reconciliation and delete readiness

See `wave65-reconciliation.json` for every old review file and created object. Generic JSON Library adapters/generator require regeneration and must not be activated; old matrices are source inventories, not the live roster. Known trigger revokes are not proven warning deltas. Existing delivery source is preserved.

Strict registration is not live: release compatible validation first; WAIT_FOR_CLIENT_ADOPTION for strict database enforcement. Current validator v351 is non-SD/service-only; leave it unchanged. Full Delete remains disabled: 61 old candidates plus newly confirmed live names are reconciled in `full-delete-readiness.json`. No real table is SAFE_TO_PURGE until exact ownership/FKs/PII/retention/write fencing/API proof exists. Synthetic purge success does not prove live coverage.

pg_net 0.20.3/public/non-relocatable: keep platform configuration, no move or exact ACL revoke without dependency/grant proof. Leaked-password protection: accepted plan-dependent residual, no paid upgrade; free/current-plan controls only, no setting changed.
