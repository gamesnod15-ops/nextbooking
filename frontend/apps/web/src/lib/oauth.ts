const GOOGLE_REDIRECT_PATH = '/auth/oauth/callback'
const APPLE_REDIRECT_PATH = '/auth/oauth/apple/callback'

function randomToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

/**
 * Kicks off the provider's own OAuth screen via a full-page redirect.
 * Google returns via a URL fragment (`#id_token=...`) straight to
 * GOOGLE_REDIRECT_PATH; Apple POSTs the token to APPLE_REDIRECT_PATH
 * (`response_mode=form_post`), which forwards it into the same callback page.
 */
export function startOAuthLogin(provider: 'google' | 'apple') {
  const origin = window.location.origin

  if (provider === 'google') {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
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

  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID
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
