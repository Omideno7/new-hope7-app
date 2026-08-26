# nh7-school-media-access deployment contract

This Edge Function performs its own authentication inside `index.ts`:

1. It requires an `Authorization: Bearer <access_token>` header.
2. It validates that token with `admin.auth.getUser(accessToken)`.
3. It rejects missing, expired or invalid sessions before authorizing any media.
4. It applies School approval, sermon publication, personal video-code, account and device rules before creating a signed URL.

For this reason the Supabase gateway setting for this function must be:

```text
verify_jwt = false
```

Do **not** interpret this as anonymous media access. Authentication is still mandatory and is enforced by the function body. Disabling gateway-level JWT verification is required so browser CORS preflight requests from the approved origins can reach the function and receive the function's CORS headers.

Approved origins currently include:

- `https://omideno7.github.io`
- `https://raw.githack.com` (QA only)
- `capacitor://localhost`
- local development origins

Production deployment history:

- Version 5: signed sermon and School audio support, `verify_jwt = true` — Safari/RawGit requests surfaced as network/CORS failures before the function response could be read.
- Version 6: same custom-auth source, `verify_jwt = false` — deployed 2026-08-26 to allow preflight through while preserving in-function token validation.

Future CLI, Dashboard or automated deployments must preserve this setting.