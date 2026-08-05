// Vercel serverless function (not part of the Vite build — see tsconfig.json's
// "include": ["src"]). Apple's response_mode=form_post delivers the id_token
// as a real HTTP POST body, which only a server endpoint can read; a Vite SPA
// route can't. The token is handed to the client via a short-lived cookie
// rather than a query param so it never sits in server access logs or
// browser history.
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end('Method Not Allowed')
    return
  }

  const body = req.body || {}
  const idToken = typeof body.id_token === 'string' ? body.id_token : undefined
  const state = typeof body.state === 'string' ? body.state : undefined
  const error = typeof body.error === 'string' ? body.error : undefined

  const url = new URL('/auth/oauth/callback', `https://${req.headers.host}`)
  url.searchParams.set('provider', 'apple')
  if (state) url.searchParams.set('state', state)
  if (error) url.searchParams.set('error', error)

  if (idToken) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    res.setHeader(
      'Set-Cookie',
      `oauth_apple_token=${encodeURIComponent(idToken)}; Max-Age=60; Path=/; SameSite=Lax${secure}`
    )
  }

  res.statusCode = 303
  res.setHeader('Location', url.toString())
  res.end()
}
