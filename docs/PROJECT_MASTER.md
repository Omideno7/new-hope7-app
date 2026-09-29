# New Hope 7 — Project Master

## Production freeze
Current production release: iOS/Android v2.4.0.
Production users must remain unaffected while the next release is developed.

## Development line
- Production/default branch: `main`
- Next-release integration branch: `release/next-v250-preview`
- Feature work branches from the next-release branch, not from main.

## Data safety
Existing Notes, Saved Verses, School Progress, assignments, profiles, graduation state and other user data must be preserved.

The preview may read existing Production data when safe, but must not mutate Production schema/data/storage/policies merely to test UI. Any feature requiring writes or migrations needs a separately approved safe test strategy.

## Cost policy
Prefer local/on-device features and near-zero recurring cost. Variable/high recurring-cost features require explicit approval before implementation.

## Release policy
No merge to main, store upload, Production deployment, or Supabase Production change without explicit user approval.
