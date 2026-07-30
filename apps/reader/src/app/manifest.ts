import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SilkFlow',
    short_name: 'SilkFlow',
    description: 'Redefine EPUB reader',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      { src: '/icons/192.png', type: 'image/png', sizes: '192x192' },
      { src: '/icons/512.png', type: 'image/png', sizes: '512x512' },
      {
        src: '/icons/maskable-192.png',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'maskable',
      },
    ],
    file_handlers: [
      {
        action: '/',
        accept: {
          'application/epub+zip': ['.epub'],
          'application/epub': ['.epub'],
        },
      },
    ],
  }
}
