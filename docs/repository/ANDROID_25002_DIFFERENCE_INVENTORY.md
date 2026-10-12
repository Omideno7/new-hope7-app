# Android-only commit and file inventory

Authoritative published SHA `a177cdc7d995894868cf84bbe00c2dfa05ad6e25`, current main `67d829de0d8d4846e309a99bcd98c4c005b3b030`. Android build copies `android-release-25002/www`, not the root index. A=Android native; B=missing shared behavior; C=represented/newer; D=do not port; E=build/provenance; F=manual behavioral review. Classification is behavior-oriented; different bytes alone do not prove that canonical code is older.

## Every Android-only commit

- `a177cdc7d995894868cf84bbe00c2dfa05ad6e25` — Make Android scroll compatibility setup idempotent — A; Native Android compatibility/diagnostics or packaged payload provenance. Preserve exact tag; do not merge the historical root/payload.
- `61b5b53fe0f81f08157811dd6de012d44588dce7` — Harden Android root scrolling and Amen gate cleanup — A; Native Android compatibility/diagnostics or packaged payload provenance. Preserve exact tag; do not merge the historical root/payload.
- `7974d342e661753ffaa578a6e01c103721c0307a` — Add real Android phone and fold touch-scroll diagnostics — A; Native Android compatibility/diagnostics or packaged payload provenance. Preserve exact tag; do not merge the historical root/payload.
- `e20d1804357f9db539bf59c409fd7d0cf60d5cfa` — Fix Android 2.5.0 touch scrolling by scoping iOS overscroll guard — A; Native Android compatibility/diagnostics or packaged payload provenance. Preserve exact tag; do not merge the historical root/payload.
- `3bb4600f80a857eff3550c1c6355f28070a877f1` — Support legacy Android WebView UI APIs and verify persisted notes through cold restart and upgrade — A; Native Android compatibility/diagnostics or packaged payload provenance. Preserve exact tag; do not merge the historical root/payload.
- `68d64e3e29e17bde63a374cbfb81f9e9c3192e46` — Fix native push injection on older Android WebViews and verify real plugin bridge — A; Native Android compatibility/diagnostics or packaged payload provenance. Preserve exact tag; do not merge the historical root/payload.
- `f6e118db290e5404cb69303d36730885c951b65d` — Refresh Android WebView resource caches on native upgrades — A; Native Android compatibility/diagnostics or packaged payload provenance. Preserve exact tag; do not merge the historical root/payload.
- `8925112af211a2438e833aec57c3fc2b16ddf858` — Build Android 2.5.0 (25002) from the complete approved Test 5.8 payload — E; Native Android compatibility/diagnostics or packaged payload provenance. Preserve exact tag; do not merge the historical root/payload.

## Every changed Git file (main → Android baseline)

| Path | Diff status | Classification |
|---|---|---|
| `.github/workflows/android-25002-corrected.yml` | A | E: workflow/build/provenance |
| `.github/workflows/deploy-pages.yml` | M | E: workflow/build/provenance |
| `admin-master-v462.html` | M | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `admin-v239-stable.html` | M | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `admin.html` | M | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/capacitor.config.json` | A | A: Android native wrapper/project |
| `android-release-25002/configure_android.py` | A | A: Android native wrapper/project |
| `android-release-25002/package.json` | A | A: Android native wrapper/project |
| `android-release-25002/patch_native_push_compat.py` | A | A: Android native wrapper/project |
| `android-release-25002/upgrade_smoke.py` | A | A: Android native wrapper/project |
| `android-release-25002/validate_payload.py` | A | A: Android native wrapper/project |
| `android-release-25002/www/app-v239.html` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/assets/about/beliefs_fa_source.jpeg` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/about/vision_fa_source.jpeg` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/admin-apple-touch-icon.png` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/admin-icon-192.png` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/admin-icon-512.png` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/admin-icon.png` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/estedad-OFL.txt` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/estedad.woff2` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/inter-OFL.txt` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/inter.woff2` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/lora-OFL.txt` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/lora.woff2` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/manifest.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/notonaskharabic-OFL.txt` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/notonaskharabic.woff2` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/nunitosans-OFL.txt` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/nunitosans.woff2` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/vazirmatn-OFL.txt` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v453/vazirmatn.woff2` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v454/amiri-OFL.txt` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v454/amiri.woff2` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v454/manifest.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v454/markazitext-OFL.txt` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/fonts/v454/markazitext.woff2` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/logo.png` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/new-hope7-logo-1024.png` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/new-hope7-logo-180.png` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/new-hope7-logo-192.png` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/new-hope7-logo-512.png` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/new-hope7-logo-transparent.svg` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/new-hope7-logo.svg` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/assets/sermon-covers/batch1/001-tithing.webp` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/certificate.html` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/css/admin-v2.3.0-student-profile.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.5-analytics.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.8-student-fix.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-apocrypha-v270.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-clean-features-v311.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-clean-features-v312.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-clean-scroll-v300.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-document-clean-v270.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-document-inline-v280.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-document-runtime-fix3.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-document-runtime-fix4.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-document-select-fix5.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-document-studio-fix1.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-document-studio.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-final-stable-v316.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-form-stability-v280.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-library-mobile-v320.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-library-reader-v280.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-library-text-v250.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/admin-v2.3.9-school-media-v260.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-admin-ui-v439.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-amen-theme-v531.css` | A | F: older palette overlays; do not copy without reproduction |
| `android-release-25002/www/css/nh7-apocrypha-v270.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-appearance-personalization-v514.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-appearance-v427.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-bible-keywords-v450.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-book-reader-v280.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-celebrations-v464.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-finalqa-v551.css` | A | F: mixed palette rules; current appearance guards retained |
| `android-release-25002/www/css/nh7-finalqa-v553.css` | A | B: viewer/palette presentation; PR #241 scoped replacement |
| `android-release-25002/www/css/nh7-finalqa-v554.css` | A | B: measured chrome/safe-area presentation; PR #241 |
| `android-release-25002/www/css/nh7-finalqa-v555.css` | A | A: platform scroll/safe-area rules mixed with layout; no wholesale port |
| `android-release-25002/www/css/nh7-finalqa-v556.css` | A | F: palette candidates need reproduced presentation evidence |
| `android-release-25002/www/css/nh7-finalqa-v557.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-finalqa-v558.css` | A | C: reviewed develop v570 responsive styles already retained |
| `android-release-25002/www/css/nh7-fonts-quick-bible-v454.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-global-search-exam-v540.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-growth-v463.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-header-date-v455.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-icons-v517.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-inbox-v542.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-library-collections-v322.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-library-text-reader-v250.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-navigation-v456.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-notes-categories-v452.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-plans-theme-v533.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-player-volume-v521.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-reader-toolbar-v452.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-school-media-v260.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-secure-media-v270.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-secure-media-watermark-v272.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-soul-winning-v472.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-spiritual-plans-v240.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-store-review-v469.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-study-reader-v453.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-tablet-v530.css` | A | B: tablet/sidebar behavior; current develop v570 only Bible/Audio; Home parity in PR #241 |
| `android-release-25002/www/css/nh7-theme-gallery-v457.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/nh7-theme-studio-v453.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/styles.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/v2.2.0-platform.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/v2.2.0.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/v2.2.1.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/v2.2.2.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/v2.2.3.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/v2.2.4.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/v2.2.5.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/v2.3.0-access-bible.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/css/v2.3.4-my-notes.css` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/data/apocrypha/runtime/additions-to-esther-ch1-v402.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/apocrypha/runtime/apocrypha-browser-19.preview.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/app/opening_messages_365.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/audio/messages.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/bible_quality_report.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/groups/bible_group_01_18.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/groups/bible_group_19_39.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/groups/bible_group_40_66.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/keywords/bible_keywords_v450.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/plans/reading_plans_1yr_2yr.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/schemas/bible_data_schema.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/schemas/bible_feature_spec.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/schemas/gamification_system.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/schemas/metadata.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/sql/supabase_bible_schema.sql` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/bible/sql/user_activity_tables.sql` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/church/about.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/church/church_config.json` | A | C: existing bundled data/media preserved; bytes compared |
| `data/community/testimony_guide_v502.json	android-release-25002/www/data/community/testimony_guide_v502.json` | R100 | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/daily/daily_juice_365.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/daily/daily_word_365.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/daily/faith_proclamations_365.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/gratitude/gratitude_plan_30_days.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/lexicon/ATTRIBUTION-v453.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/lexicon/original-language-core-v454.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/salvation/need_salvation.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/school/foundation_exam_50_trilingual.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/school/school_content.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/catalog.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/fasting-7.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/fasting-types.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/grace-14.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/mind-renewal-days-01-07.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/mind-renewal-days-08-14.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/mind-renewal-days-15-18.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/mind-renewal-days-19-22.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/mind-renewal-days-23-26.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/mind-renewal-days-27-30.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/obedience-10.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/prayer-30.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/data/spiritual-plans/salvation-10.json` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/index.html` | A | E: entry graph/version/native bridge and shared CSS differences; individual features assessed in matrix |
| `android-release-25002/www/js/admin-qna-i18n-v341.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-qna-i18n-v342.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-qna-i18n-v343.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-stage1-close-v238.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-stage1-native-close-v239.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-stage1-student-scroll.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.2.0.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.2.1.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.2.2.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.2.3.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.2.4.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.2.5-stage1-clean-v240.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.2.5-v230.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.2.5.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.5-analytics-core-v237.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.5-analytics.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.8-student-fix.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-apocrypha-catalog-v274.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-apocrypha-text-only-v320.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-apocrypha-v270.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-approval-email-ui-v345.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-audio-clean-v312.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-clean-scroll-v300.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-document-clean-v270.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-document-inline-v280.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-document-runtime-fix3.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-document-runtime-fix4.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-document-select-fix5.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-document-studio-fix1.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-document-studio-focus-fix2.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-document-studio.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-fix12-bootstrap.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-fix6-labels.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-form-stability-v280.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-library-batch-v281.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-library-clean-v311.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-library-collections-v322.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-library-reader-v280.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-library-text-v250.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-notifications-zagreb-v333.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-registration-approval-email-v342.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-registration-approval-email-v344.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-registration-email-actions-v346.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-registration-requests-v331.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-request-search-focus-v336.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-school-media-v260.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-student-clean-v311.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-student-clean-v312.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-student-state-fix-v316.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-ui-documents-final-v316.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-video-clean-v311.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-video-final-v314.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-video-final-v316.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-video-person-access-v317.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-video-save-sync-v316.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/admin-v2.3.9-video-visible-v313.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/app.js` | A | F: mixed shared features and account/progression semantics; reviewed develop additions retained, no wholesale copy |
| `android-release-25002/www/js/nh7-access-bootstrap-v230.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-ai-v490.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-ai-v491.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-assignment-feedback-presets-v499.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-community-v502.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-full-stability-v447.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-global-stability-v414.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-library-access-v396.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-listening-analytics-v427.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-listening-analytics-v451.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-message-center-v416.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-push-owner-v400.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-qna-ai-v492.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-qna-ai-v493.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-rbac-v350.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-ready-v439.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-registration-dedupe-v332.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-request-search-v439.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-review-blessings-v476.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-review-refresh-v474.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-review-refresh-v475.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-save-feedback-v497.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-school-workflow-v246.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-school-workflow-v247.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-school-workflow-v248.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-school-workflow-v249.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-scroll-v439.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-sermon-integrity-v421.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-sermon-metadata-v452.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-sermon-social-v440.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-session-keepalive-v451.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-student-academic-v540.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-student-report-v490.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-student-report-v491.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-student-report-v492.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-student-report-v493.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-student-report-v494.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-student-report-v495.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-student-report-v496.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-ui-stability-v439.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-admin-user-notes-v414.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-apocrypha-actions-v393.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-apocrypha-inline-v392.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-apocrypha-preview-v240.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-apocrypha-reader-flow-v244.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-apocrypha-runtime-patch-v402.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-apocrypha-saved-nav-v394.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-apocrypha-v270.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-app-enhancements-v230.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-appearance-personalization-v514.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-audio-classic-v400.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-audio-classic-v484.js` | A | C: canonical audio safety newer |
| `android-release-25002/www/js/nh7-audio-library-v500.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-audio-miniplayer-v487.js` | A | C: canonical mini-player/docking retained |
| `android-release-25002/www/js/nh7-audio-quick-bible-v454.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-audio-route-stability-v330.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-audio-route-stability-v423.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-audio-signed-v396.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-audio-signed-v397.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-auth-recovery-v342.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-auth-signup-guard-v343.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-auto-update-v325.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-auto-update-v332.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-auto-update-v333.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-auto-update-v335.js` | A | A: native updater guard differs; Web worker path stays canonical |
| `android-release-25002/www/js/nh7-bible-keywords-v451.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-book-reader-v280.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-book-reader-v281.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-book-reader-v283.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-book-reading-telemetry-v490.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-celebrations-v464.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-community-v502.js	android-release-25002/www/js/nh7-community-v502.js` | R078 | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-delete-account-v253.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-exam-review-v540.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-fasting-practical-note-removal-v413.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-finalqa-v553.js` | A | B: shared full-screen viewer missing; PR #241 uses current v563/v564 presentation instead |
| `android-release-25002/www/js/nh7-finalqa-v554.js` | A | B: measured chrome behavior; PR #241; physical native QA pending |
| `android-release-25002/www/js/nh7-finalqa-v555.js` | A | D: unscoped iOS touch suppression must not be ported; Android has platform gate |
| `android-release-25002/www/js/nh7-finalqa-v558.js` | A | C: canonical mini-player newer; Android native root fixes separately retained |
| `android-release-25002/www/js/nh7-fonts-v454.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-global-search-v540.js` | A | C: historical search superseded by v562 |
| `android-release-25002/www/js/nh7-header-date-v455.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-icons-v517.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-inbox-badge-sync-v418.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-large-mov-native-fallback-v273.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-library-collections-v322.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-library-language-v321.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-library-ready-import-v434.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-library-text-reader-v250.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-master-upload-v435.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-master-upload-v436.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-media-player-v500.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-my-notes-categories-v452.js` | A | B: reflection category gap; PR #241 |
| `android-release-25002/www/js/nh7-my-notes-v234.js` | A | B: virtual reflection aggregation gap; read-only safe design in PR #241 |
| `android-release-25002/www/js/nh7-note-text-v501.js` | A | C: canonical account Notes merge newer |
| `android-release-25002/www/js/nh7-notifications-zagreb-v333.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-notifications-zagreb-v334.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-offline-core-v327.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-offline-data-v329.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-offline-data-v422.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-offline-persistence-v323.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-offline-playback-bridge-v326.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-offline-playback-bridge-v332.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-offline-startup-v327.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-original-language-v453.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-protected-audio-gate-v316.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-push-account-bind-v361.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-push-account-bind-v362.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-push-account-bind-v364.js	android-release-25002/www/js/nh7-push-account-bind-v364.js` | R100 | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-qna-i18n-v341.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-reader-toolbar-v452.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-reader-ux-v251.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-registration-canonical-v351.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-registration-canonical-v353.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-registration-final-guard-v401.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-registration-repeat-guard-v402.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-saved-verses-chapter-v252.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-audio-native-v335.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-audio-native-v337.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-audio-player-v338.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-drafts-v468.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-exam-v344.js` | A | C: canonical exam review/retry fixes newer |
| `android-release-25002/www/js/nh7-school-ios-hotfix-v335.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-media-safari-v261.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-media-session-v262.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-media-v260.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-offline-v333.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-path-v350.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-path-v351.js` | A | C: canonical durable-identity School path newer; never downgrade snapshot/approval logic |
| `android-release-25002/www/js/nh7-school-registration-v331.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-school-registration-v342.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-secure-media-fix-v271.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-secure-media-v270.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-secure-media-watermark-v272.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-security-core-v340.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-sermon-catalog-hotfix-v424.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-sermon-list-detail-v445.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-sermon-social-v440.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-sermon-social-v443.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-settings-account-v252.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-settings-controller-v399.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-settings-controller-v403.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-settings-feedback-v398.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-soul-winning-v472.js` | A | F: Store account-sync differs from local-first policy; do not introduce unreviewed writes |
| `android-release-25002/www/js/nh7-spiritual-plans-v240.js` | A | C: preserve canonical progression; reflection display separate |
| `android-release-25002/www/js/nh7-spiritual-plans-v412.js` | A | C: canonical theme propagation newer; do not overwrite |
| `android-release-25002/www/js/nh7-store-review-v469.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-theme-studio-v453.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/js/nh7-ui-stability-v329.js` | A | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `android-release-25002/www/manifest.json` | A | E: platform install metadata |
| `android-release-25002/www/offline/index.html` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/public/audio/README.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/morning-prayer/001.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/morning-prayer/002.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/readme.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/001.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/002.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/003.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/004.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/005.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/006.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/007.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/008.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/009.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/message/short-messages/010.m4a` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/messages/morning-prayers/README.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/messages/short-messages/README.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/messages/teachings/README.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/school/readme 2.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/school/readme 3.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/school/readme 4.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/public/audio/school/readme.md` | A | C: existing bundled data/media preserved; bytes compared |
| `android-release-25002/www/push/OneSignalSDKWorker.js` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/reset-password.html` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/service-worker.js` | A | E: release cache/worker graph; canonical network-first plus current data guards retained |
| `android-release-25002/www/support.html` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/sw-media-stream-bypass-v332.js` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/sw-navigation-fresh-v403.js` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/sw-offline-path-fix-v329.js` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/sw-offline-v328.js` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/sw-offline-v329.js` | A | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `android-release-25002/www/sw-release-core-v403.js` | A | E: executable cache graph/version; preserve user-data caches |
| `android-release-25002/www/version.json` | A | E: version/build provenance labels alone do not identify payload |
| `certificate-v239.html` | M | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `certificate.html` | M | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `css/admin-v2.3.9-document-runtime-fix4.css` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `css/nh7-appearance-personalization-v514.css` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `css/nh7-appearance-v427.css` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `css/nh7-celebrations-v464.css` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `css/nh7-document-ux-v509.css` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `css/nh7-document-ux-v510.css` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `css/nh7-document-ux-v511.css` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `css/nh7-document-ux-v512.css` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `css/nh7-document-ux-v520.css` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `css/nh7-spiritual-plans-v240.css` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `docs/audit/ISSUE_115_FA_EN_HR_LOCALIZATION_AUDIT.md` | D | E: workflow/build/provenance |
| `docs/audit/ISSUE_116_SCHOOL_REPORTS.md` | D | E: workflow/build/provenance |
| `docs/audit/ISSUE_119_MOBILE_REPORT_PDF.md` | D | E: workflow/build/provenance |
| `docs/audit/ISSUE_121_SAFARI_PRINT.md` | D | E: workflow/build/provenance |
| `docs/audit/STUDENT_EXAM_REVIEW_V566_20261010.md` | D | E: workflow/build/provenance |
| `docs/audit/SUPABASE_MIGRATION_HISTORY_RECONCILIATION_2026-10-09.md` | D | E: workflow/build/provenance |
| `docs/audit/WEB_COMMUNITY_PARITY_V250_20261010.md` | D | E: workflow/build/provenance |
| `docs/security/LIBRARY_PRODUCTION_AUDIT_2026-10-09.md` | D | E: workflow/build/provenance |
| `index.html` | M | E: entry graph/version/native bridge and shared CSS differences; individual features assessed in matrix |
| `js/admin-v2.2.0.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/admin-v2.2.2.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/admin-v2.3.9-document-runtime-fix4.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/admin-v2.3.9-document-select-fix5.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/app.js` | M | F: mixed shared features and account/progression semantics; reviewed develop additions retained, no wholesale copy |
| `js/nh7-access-bootstrap-v230.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-community-fixes-v503.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-community-storage-v504.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-community-v502.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-live-search-v508.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-message-feedback-v510.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-message-feedback-v511.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-print-native-v120.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-ready-v439.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-report-print-v117.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-storage-orphan-v507.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-storage-orphan-v509.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-student-academic-v540.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-student-report-v496.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-testimony-core-v565.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-testimony-playback-v506.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-testimony-runtime-fix-v505.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-testimony-v564.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-admin-testimony-v565.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-apocrypha-preview-v240.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-apocrypha-v270.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-appearance-i18n-v515.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-appearance-personalization-v514.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-audio-classic-v484.js` | M | C: canonical audio safety newer |
| `js/nh7-audio-library-v500.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-audio-miniplayer-v487.js` | M | C: canonical mini-player/docking retained |
| `js/nh7-bible-deeplink-v565.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-book-reader-v283.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-celebrations-v464.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-document-ux-v509.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-document-ux-v510.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-document-ux-v511.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-document-ux-v512.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-document-ux-v513.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-document-ux-v520.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-exam-review-v566.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-finalqa-v558.js` | M | C: canonical mini-player newer; Android native root fixes separately retained |
| `js/nh7-global-search-direct-v562.js` | D | C: newer exact-result current implementation preserved |
| `js/nh7-library-collections-v322.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-library-language-v321.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-library-security-v125.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-media-player-v500.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-my-notes-v234.js` | M | B: virtual reflection aggregation gap; read-only safe design in PR #241 |
| `js/nh7-note-text-v501.js` | M | C: canonical account Notes merge newer |
| `js/nh7-offline-persistence-v323.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-original-language-v453.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-profile-photo-guard-v563.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-profile-photo-v563.js` | D | C: current Web profile v563/v564 is authoritative; do not restore old persistence |
| `js/nh7-profile-photo-v564.js` | D | C: current canonical Home/header photo implementation newer |
| `js/nh7-school-report-print-page-v121.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-secure-media-v270.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-settings-account-v252.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-soul-winning-v472.js` | M | F: Store account-sync differs from local-first policy; do not introduce unreviewed writes |
| `js/nh7-spiritual-plans-v412.js` | M | C: canonical theme propagation newer; do not overwrite |
| `js/nh7-theme-studio-v453.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/nh7-ui-stability-v329.js` | M | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/vendor/html2canvas-1.4.1.min.js` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/vendor/html2canvas-LICENSE.txt` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `js/vendor/report-pdf-dependencies.json` | D | F: inspect mixed historical runtime/presentation semantics; no safe wholesale port inferred from byte differences |
| `school-report-print.html` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `scripts/validate_next_native_optimization_guard.py` | M | E: workflow/build/provenance |
| `scripts/verify-admin-live-search-document-studio-v508.cjs` | D | E: workflow/build/provenance |
| `scripts/verify-admin-student-code-v543.py` | D | E: workflow/build/provenance |
| `scripts/verify-appearance-css-parity-v521.py` | D | E: workflow/build/provenance |
| `scripts/verify-audio-playback-safety-v486.py` | D | E: workflow/build/provenance |
| `scripts/verify-calendar-lock-parity-v250.py` | D | E: workflow/build/provenance |
| `scripts/verify-community-certificate-admin-v505.cjs` | D | E: workflow/build/provenance |
| `scripts/verify-document-ux-v509.cjs` | D | E: workflow/build/provenance |
| `scripts/verify-document-ux-v510.cjs` | D | E: workflow/build/provenance |
| `scripts/verify-document-v511.py` | D | E: workflow/build/provenance |
| `scripts/verify-document-v520.py` | D | E: workflow/build/provenance |
| `scripts/verify-i18n-v115.cjs` | D | E: workflow/build/provenance |
| `scripts/verify-notes-account-merge-v544.py` | D | E: workflow/build/provenance |
| `scripts/verify-plans-theme-parity-v534.py` | D | E: workflow/build/provenance |
| `scripts/verify-print-v121.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-profile-approved-student-code-v1.py` | D | E: workflow/build/provenance |
| `scripts/verify-public-certificate-verification-page-v127.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-public-certificate-verifier-v127.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-report-pdf-v119.cjs` | D | E: workflow/build/provenance |
| `scripts/verify-report-pdf-v119.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-access-identity-v230.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-activity-user-id-bridge-v128.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-assignment-submit-identity-v128.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-certificate-identity-v127.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-course-code-bridge-v200.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-course-public-metadata-v200.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-dual-key-ownership-v128.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-email-fallback-fence-v128.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-exam-read-identity-v351.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-exam-retry-final-v1.py` | D | E: workflow/build/provenance |
| `scripts/verify-school-exam-scoring-identity-v128.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-exam-submit-identity-v128.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-progress-identity-v340.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-reports-browser-v116.cjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-reports-v116.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-snapshot-dual-key-v2110.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-school-stage-model-v210.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-student-exam-review-v566.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-student-photo-private-v127.mjs` | D | E: workflow/build/provenance |
| `scripts/verify-supabase-migration-parity.py` | D | E: workflow/build/provenance |
| `scripts/verify-web-community-parity-v250.py` | D | E: workflow/build/provenance |
| `service-worker.js` | M | E: release cache/worker graph; canonical network-first plus current data guards retained |
| `supabase/migrations/20261002221819_optimize_disk_io_inbox_registrations_v1.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261003073335_retire_nonessential_telemetry_and_audio_gate_v1.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261003100105_add_batched_social_and_inbox_snapshot_v1.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261003171531_optimize_inbox_rls_initplan_v1.sql` | M | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261003171549_optimize_admin_engagement_analytics_v223.sql` | M | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261003172711_optimize_admin_library_dashboard_queries_v1.sql` | M | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/migration-history-reconciliation-20261009/legacy-applied-outside-history/20261003_school_legacy_anchor_v542.sql	supabase/migrations/20261003_school_legacy_anchor_v542.sql` | R100 | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/migration-history-reconciliation-20261009/legacy-applied-outside-history/20261003_student_academic_center_v540.sql	supabase/migrations/20261003_student_academic_center_v540.sql` | R100 | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/migration-history-reconciliation-20261009/legacy-applied-outside-history/20261003_student_academic_center_v541.sql	supabase/migrations/20261003_student_academic_center_v541.sql` | R100 | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/migration-history-reconciliation-20261009/legacy-applied-outside-history/20261003_student_academic_center_v542_hotfix_v543.sql	supabase/migrations/20261003_student_academic_center_v542_hotfix_v543.sql` | R100 | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/migration-history-reconciliation-20261009/legacy-applied-outside-history/20261003_student_exam_status_v543.sql	supabase/migrations/20261003_student_exam_status_v543.sql` | R100 | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261005232733_community_prayer_testimony_v502_backend.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261006083051_community_moderation_prayer_v503.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261006085853_community_storage_ops_v504.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261006090128_community_storage_cleanup_helpers_v504.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261007065642_community_storage_orphan_audit_v507.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261007074710_fix_testimony_public_storage_admin_select_v508.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261008173510_school_v351_legacy_class_progress_hotfix.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261008173533_school_v351_legacy_final_progress_hotfix.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009031227_revoke_legacy_library_qa_execute.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009032342_optimize_inbox_and_legacy_library_dashboard.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009065456_school_student_identity_core_v127.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009071217_school_activity_user_id_bridge_v128.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009072624_school_dual_key_ownership_v128.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009073622_school_email_fallback_fence_v128.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009074806_school_snapshot_dual_key_v2110.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009090202_school_access_identity_bridge_v230.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009091333_school_progress_identity_save_v340.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009092532_student_photo_private_v127.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009124356_school_exam_read_identity_v351.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009130632_school_exam_scoring_identity_v128.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009162431_school_exam_submit_identity_v128.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009163134_school_assignment_submit_identity_v128.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009164138_school_certificate_identity_bridge_v127.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261009165011_public_certificate_verifier_v127.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261010024423_school_course_code_bridge_v200.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261010025305_school_course_public_metadata_v200.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261010025936_school_stage_model_v210.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261010180059_optimize_inbox_lower_email_index_v1.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261010180256_optimize_user_data_rls_initplan_v1.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261010182200_optimize_school_registration_rls_initplan_v1.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261010224127_admin_prayer_reply_document_delete_v505.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261010224433_harden_document_delete_delivery_fence_v506.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261011073048_school_exam_retry_final_completion_consistency_v1.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261011082912_admin_student_code_payload_v543.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261011084844_admin_student_identity_directory_v128.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/migrations/20261011092221_fix_prayer_document_admin_runtime_v507.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/issue127/unapplied-foundation-candidate-20261009/20261009064545_school_student_identity_foundation_v127.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/issue127/unapplied-foundation-candidate-20261009/verify-school-identity-foundation-migration-v127.mjs` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/library-hardening-20261009/01_revoke_legacy_qa_execute_rehearsal.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/migration-history-reconciliation-20261009/production-tail.json` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `supabase/review/migration-history-reconciliation-20261009/source-candidates/20261007095000_fix_testimony_public_storage_admin_select_v508.sql` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `sw-offline-v329.js` | M | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `sw-release-core-v403.js` | M | E: executable cache graph/version; preserve user-data caches |
| `verify-certificate-v508.html` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `verify-certificate.html` | D | E: packaging/provenance or dormant entry point; no feature absence inferred |
| `version.json` | M | E: version/build provenance labels alone do not identify payload |

The JSON records every actual iOS/Android payload file hash and its main comparison, including identical assets/media/data and missing native bridges. Shared B/F features are tracked individually in STORE_CONVERGENCE_250.md; they are not indiscriminately merged.
