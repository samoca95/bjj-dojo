# BJJ Dojo OAuth Proxy

A stateless Cloudflare Worker that forwards GitHub device-flow OAuth
requests so the browser-only PWA build can complete authentication.
GitHub's `/login/device/code` and `/login/oauth/access_token` endpoints
don't return CORS headers, so the PWA can't call them directly.

## Deployment

Automated via `.github/workflows/deploy-oauth-proxy.yml`: whenever
`oauth-proxy/` changes on the `main` branch (or on manual workflow
dispatch), the worker is redeployed using the `CLOUDFLARE_API_TOKEN`
and `CLOUDFLARE_ACCOUNT_ID` repo secrets. Copy the printed URL into
the `VITE_GITHUB_OAUTH_PROXY_URL` repo secret so the next PWA deploy
picks it up.

## Endpoints

- `POST /device/code` → forwards to `https://github.com/login/device/code`
- `POST /access_token` → forwards to `https://github.com/login/oauth/access_token`

Both accept and return JSON. CORS is open (`*`) because the OAuth client
secret never touches this proxy — only the public `client_id` and the
short-lived `device_code` flow through it.
