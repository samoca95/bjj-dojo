/**
 * GitHub OAuth device-flow proxy (Cloudflare Worker).
 *
 * GitHub's device-flow endpoints don't send CORS headers, so the BJJ Dojo
 * PWA cannot call them directly. This worker forwards `/device/code` and
 * `/access_token` POSTs to github.com and re-emits the JSON response with
 * permissive CORS, allowing the static PWA build to complete the flow.
 *
 * Native (Capacitor) builds skip this proxy and use CapacitorHttp instead.
 *
 * Deploy with `wrangler deploy` (see wrangler.toml). The deployed URL is
 * baked into the PWA via `VITE_GITHUB_OAUTH_PROXY_URL`.
 */

const GH_DEVICE_CODE = 'https://github.com/login/device/code'
const GH_ACCESS_TOKEN = 'https://github.com/login/oauth/access_token'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

async function forward(target: string, request: Request): Promise<Response> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'invalid_request' }, 400)
  }
  const upstream = await fetch(target, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'bjj-dojo-oauth-proxy',
    },
    body: JSON.stringify(payload),
  })
  const text = await upstream.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = { error: 'upstream_non_json', body: text }
  }
  return json(parsed, upstream.status)
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405)
    }
    const url = new URL(request.url)
    if (url.pathname === '/device/code') return forward(GH_DEVICE_CODE, request)
    if (url.pathname === '/access_token')
      return forward(GH_ACCESS_TOKEN, request)
    return json({ error: 'not_found' }, 404)
  },
}
