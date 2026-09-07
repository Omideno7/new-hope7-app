# Admin stability 2.3.9.43

Scope: admin panel only. Database, RLS, books, sermons, users and the member application are not changed.

Root causes addressed: a mandatory seven-second entry delay, global loading blanking the active module, destructive innerHTML replacement, duplicate student module loading and asynchronous implementation races, timers restoring stale focus/scroll, a self-triggering document preview observer, automatic version redirects during editing, and a shared-app header CSS collision on mobile.

The new owner renderer reconciles keyed elements rather than rebuilding the entire form. Assignment score/feedback drafts are scoped by authenticated-user identifier and assignment identifier, remain in the current browser tab's session storage, expire after 24 hours and clear on logout or confirmed save. Save failure and edits made during a pending save do not discard the draft. Backend authorization and existing assignment review/notification RPC are unchanged. Version updates require an explicit user click.

Local verification: 69 checks passed in offline Chromium at desktop and mobile viewports using synthetic data, including 20 standard module renders on each viewport, text/focus/caret stability, navigation, failed/successful saves, typing during a save, preserved file selection, native disclosure state, live data updates, logout draft cleanup, and bounded document-studio observer work. This is not a live-owner-account or physical iPhone end-to-end certification. No real notifications, assignments, or other church records were changed during testing.

The version-guarded one-time source patch is applied on the fix branch, then its generated commit is reviewed and merged. The existing deployment workflows and security policies are not disabled.
