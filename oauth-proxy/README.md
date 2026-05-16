# BJJ Dojo OAuth Proxy

A stateless Cloudflare Worker that forwards GitHub device-flow OAuth
requests so the browser-only PWA build can complete authentication.
GitHub's `/login/device/code` and `/login/oauth/access_token` endpoints
don't return CORS headers, so the PWA can't call them directly.

## Why this exists

- **PWA (web)**: needs this proxy. Set `VITE_GITHUB_OAUTH_PROXY_URL` to
  the deployed worker URL.
- **Native (Capacitor) Android/iOS**: does NOT need this proxy. Native
  builds use `CapacitorHttp`, which bypasses WebView CORS entirely.

## Deploy

```bash
cd oauth-proxy
npx wrangler login          # one-time, free tier is fine
npx wrangler deploy
```

Wrangler prints a URL like `https://bjj-dojo-oauth-proxy.<account>.workers.dev`.

Then set the URL as a GitHub Actions repo secret named
`VITE_GITHUB_OAUTH_PROXY_URL` so the PWA deploy workflow picks it up.

## Endpoints

- `POST /device/code` → forwards to `https://github.com/login/device/code`
- `POST /access_token` → forwards to `https://github.com/login/oauth/access_token`

Both accept and return JSON. CORS is open (`*`) because the OAuth client
secret never touches this proxy — only the public `client_id` and the
short-lived `device_code` flow through it.
