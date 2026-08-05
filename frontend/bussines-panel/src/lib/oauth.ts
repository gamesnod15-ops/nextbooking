const GOOGLE_REDIRECT_PATH = '/auth/oauth/callback'
// Apple's response_mode=form_post POSTs to this URL — it must hit a real
// server endpoint (the Vercel function in /api), not a client-side route,
// since a Vite SPA route can't read a POST body.
const APPLE_REDIRECT_PATH = '/api/oauth-apple-callback'

function randomToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

/**
 * Kicks off the provider's own OAuth screen via a full-page redirect.
 * Google returns via a URL fragment (`#id_token=...`) straight to
 * GOOGLE_REDIRECT_PATH; Apple POSTs the token to the serverless function at
 * APPLE_REDIRECT_PATH, which forwards it into the same callback page.
 */
export function startOAuthLogin(provider: 'google' | 'apple') {
  const origin = window.location.origin

  if (provider === 'google') {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      window.alert('Google ile giriş şu anda yapılandırılmamış.')
      return
    }
    const nonce = randomToken()
    sessionStorage.setItem('oauth_nonce', nonce)
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${origin}${GOOGLE_REDIRECT_PATH}`,
      response_type: 'id_token',
      scope: 'openid email profile',
      nonce,
      prompt: 'select_account',
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    return
  }

  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID
  if (!clientId) {
    window.alert('Apple ile giriş şu anda yapılandırılmamış.')
    return
  }
  const state = randomToken()
  sessionStorage.setItem('oauth_state', state)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}${APPLE_REDIRECT_PATH}`,
    response_type: 'code id_token',
    scope: 'name email',
    response_mode: 'form_post',
    state,
  })
  window.location.href = `https://appleid.apple.com/auth/authorize?${params.toString()}`
}
