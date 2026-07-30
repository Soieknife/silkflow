import type { Metadata, Viewport } from 'next'

import { Providers } from './providers'
import { auth } from '../auth'

import './globals.css'

export const metadata: Metadata = {
  title: 'SilkFlow',
  description: 'SilkFlow — redefine EPUB reader',
  applicationName: 'SilkFlow',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SilkFlow',
  },
  formatDetection: { telephone: false },
  icons: { icon: '/icons/192.png', apple: '/icons/192.png' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en" className="bg-default" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(${setColorScheme.toString()})()`,
          }}
        />
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}

// Inlined so it runs before hydration to avoid a flash of the wrong color scheme.
function setColorScheme() {
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const stored = localStorage.getItem('literal-color-scheme') ?? 'system'
    const dark = stored === '"dark"' || (stored === '"system"' && mql.matches)
    document.documentElement.classList.toggle('dark', dark)
  } catch {
    /* no-op */
  }
}
