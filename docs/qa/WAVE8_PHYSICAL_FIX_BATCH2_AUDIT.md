# Batch 2 pre-implementation audit

Start develop: d06b170f052390c84a500a7b78bd18115a84b04f. Main:15af811f78a17a0881c13171311e7ade6bc390f4 unchanged. Existing develop fast-forwarded, no reset/new branch/PR. Required AGENTS/workflow/master/Batch1 report/Batch2 specification read completely.

- B2.1: current Web CSS owns env insets in header/nav rows. Native wrapper is absent, so native automatic inset behavior cannot be established or changed safely. Trace visualViewport bounds and explicit CSS ownership; do not subtract guessed status heights or remove protected insets. Compact only content spacing; physical double-inset verification remains blocked on exact wrapper/device.
- B2.2: v570 clones current book/chapter lists into sidebar without removing detail duplicates; chapter detail has no chapter sidebar. Rebuild hierarchy using actual loaded Bible metadata/current router, preserving exact verse routes.
- B2.3: v570 excludes Daily. Reuse canonical category controls and hide their detail duplicates only at split widths.
- B2.4: Audio library already owns category chips, list, actions and current player. Adapt its existing controls, progressively show selected item/detail; do not create another engine/catalog/persistence layer.
- B2.5: Quick Bible uses showModal and a top-layer backdrop. Change only that presentation into an in-flow, nonmodal section, keeping lookup/source/place logic intact.
- B2.6: Batch1 already fences route top/Back scroll and verse centering. Add localized tool focus/scroll without stealing a currently active form control; keep persistence untouched.
- B2.7: v564 injects canonical photo into Home and header. Keep canonical implementation/data intact; use one visible Home avatar, locally available date/continue actions and adaptive hero geometry.
- B2.8: exact redundant badge is in spiritual-plans-v240 hero markup; remove only badge.

Implementation will be explicit, reversible and hash-bound; retain all historical assertions through exact accepted-source adapters plus independent Batch2 scope and actual-current browser tests. No Production mutation, backend source change, migrations, analytics, polling, native project reconstruction, or provider/issuance activation. Real iPhone/iPad safe area, keyboard, split-view and media acceptance remains PHYSICAL_QA_REQUIRED/BLOCKED_TOOLCHAIN.
