'use client'

import { LiteralProvider } from '@literal-ui/core'
import { SessionProvider } from 'next-auth/react'
import { RecoilRoot } from 'recoil'

import { Theme } from '../components'

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <SessionProvider session={session}>
      <LiteralProvider>
        <RecoilRoot>
          <Theme />
          {children}
        </RecoilRoot>
      </LiteralProvider>
    </SessionProvider>
  )
}
