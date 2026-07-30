import NextAuth from 'next-auth'

import { authConfig } from './auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  // Protect everything except auth callbacks, Next internals, and static assets.
  matcher: [
    '/((?!api/auth|_next/static|_next/image|icons|favicon.ico|manifest.webmanifest).*)',
  ],
}
