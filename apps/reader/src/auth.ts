import NextAuth from 'next-auth'

import { authConfig } from './auth.config'
import { upsertUser } from './lib/db/queries'

interface SilkPortalProfile {
  sub: string
  email?: string
  name?: string
  role?: string
  is_platform_admin?: boolean
  is_app_owner?: boolean
  is_app_banned?: boolean
  app_status?: string
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      role?: string | null
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    {
      id: 'silkportal',
      name: 'SilkPortal',
      type: 'oauth',
      clientId: process.env.SILKPORTAL_CLIENT_ID,
      clientSecret: process.env.SILKPORTAL_CLIENT_SECRET,
      checks: ['state'],
      authorization: {
        url: 'https://auth.qaqan.cn/authorize',
        params: { scope: 'openid email', response_type: 'code' },
      },
      token: 'https://auth.qaqan.cn/token',
      userinfo: 'https://auth.qaqan.cn/userinfo',
      profile(profile: SilkPortalProfile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
        }
      },
    },
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, profile }) {
      const p = profile as SilkPortalProfile | undefined
      if (p) {
        ;(token as Record<string, unknown>).role = p.role
        ;(token as Record<string, unknown>).isAppBanned = p.is_app_banned
        ;(token as Record<string, unknown>).appStatus = p.app_status
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id
        session.user.role =
          ((token as Record<string, unknown>).role as string | null) ?? null
      }
      return session
    },
    async signIn({ profile }) {
      const p = profile as SilkPortalProfile | undefined
      if (!p?.sub) return false
      if (p.is_app_banned) return false
      if (p.app_status && p.app_status !== 'approved') return false

      await upsertUser({
        id: p.sub,
        email: p.email,
        name: p.name,
        role: p.role,
      })
      return true
    },
  },
})
