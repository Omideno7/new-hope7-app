# Audio gateway hotfix — 2026-08-26

User QA on iPhone/Safari showed the same network error for both published sermons and protected School audio. Because both paths failed before the native fallback player appeared, the shared failure point was the cross-origin Edge Function request rather than the MP3/M4A files themselves.

## Root cause

`nh7-school-media-access` already performed full custom authentication inside its function body using:

```ts
admin.auth.getUser(accessToken)
```

However, the deployed Edge Function also had Supabase gateway JWT verification enabled. On cross-origin QA requests, the gateway could reject/intercept the request or its preflight before the function's own CORS response was returned. Safari then exposed this only as a generic network/`Load failed` error.

## Production Backend fix

The same authenticated function source was redeployed as **version 6** with:

```text
verify_jwt = false
```

This does not create anonymous media access. The function still:

- requires the Authorization bearer token;
- validates the user through Supabase Auth;
- checks complete approved School access or active Admin access;
- checks published sermons;
- checks lesson authorization;
- checks account/device-bound video permissions;
- returns only short-lived signed URLs.

Disabling gateway-level verification allows OPTIONS/preflight requests from `https://raw.githack.com` to reach the function and receive its explicit CORS headers.

## QA instruction

The R3.5 client link does not need a JavaScript change for this backend hotfix. Reopen it with a new cache-busting query or in a fresh Safari tab, sign in, and test:

1. one sermon Play;
2. one School audio Play;
3. one sermon Download;
4. one School audio Download.

The expected behavior is real playback, visible download progress and a green completed check.