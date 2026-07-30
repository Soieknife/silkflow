import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <div className="ink-paper bg-default flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-5xl font-semibold tracking-tight text-on-surface">
          SilkFlow
        </h1>
        <p className="text-on-surface-variant typescale-body-large">
          水墨 · redefine EPUB reader
        </p>
      </div>
      <button
        onClick={() => signIn('silkportal', { callbackUrl: '/library' })}
        className="rounded-sm bg-on-surface px-8 py-3 text-on-background transition-opacity typescale-title-medium hover:opacity-80"
      >
        Sign in with SilkPortal
      </button>
    </div>
  )
}
