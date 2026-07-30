import { put } from '@vercel/blob'

import { auth } from '../../../auth'

// Streams the epub body straight through to Vercel Blob (no JSON buffering,
// no dependency on the handleUpload token API — stable across blob versions).
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename || !request.body) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  const pathname = `users/${session.user.id}/books/${filename}`
  const contentType =
    request.headers.get('content-type') || 'application/epub+zip'

  try {
    const blob = await put(pathname, request.body, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
    })
    return Response.json(blob)
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 })
  }
}
