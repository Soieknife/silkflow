import type { NextAuthConfig } from 'next-auth'

/**
 * Edge-safe Auth.js config. Imported by `middleware.ts`.
 * Must NOT pull in Node-only deps (drizzle/postgres) — those live in `auth.ts`.
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const onLogin = nextUrl.pathname.startsWith('/login')
      const isAuthApi = nextUrl.pathname.startsWith('/api/auth')

      if (isAuthApi) return true
      if (onLogin) {
        return isLoggedIn
          ? Response.redirect(new URL('/library', nextUrl))
          : true
      }
      return isLoggedIn
    },
  },
}
