import { NextRequest, NextResponse } from 'next/server'

// Apple's `response_mode=form_post` delivers the id_token as a real HTTP POST
// body (not a URL fragment like Google), so it needs a route handler — a
// client page can't read a POST body. The token is handed to the client via a
// short-lived cookie rather than a query param so it never sits in server
// access logs or browser history.
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const idToken = formData.get('id_token')?.toString()
  const state = formData.get('state')?.toString()
  const error = formData.get('error')?.toString()

  const url = new URL('/auth/oauth/callback', request.url)
  url.searchParams.set('provider', 'apple')
  if (state) url.searchParams.set('state', state)
  if (error) url.searchParams.set('error', error)

  const response = NextResponse.redirect(url, 303)

  if (idToken) {
    response.cookies.set('oauth_apple_token', idToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
      path: '/',
    })
  }

  return response
}
