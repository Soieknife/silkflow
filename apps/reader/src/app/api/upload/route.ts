import { put } from '@vercel/blob'

import { auth } from '../../../auth'

const MAX_EPUB_BYTES = 100 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set([
  'application/epub+zip',
  'application/epub',
  'application/zip',
  'application/octet-stream',
])

function sanitizeFilename(filename: string) {
  const name = filename
    .split(/[\\/]/)
    .pop()
    ?.replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 160)

  return name && /\.epub$/i.test(name) ? name : null
}

// Streams the epub body straight through to Vercel Blob (no JSON buffering,
// no dependency on the handleUpload token API — stable across blob versions).
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filename = sanitizeFilename(searchParams.get('filename') ?? '')
  if (!filename || !request.body) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (!contentLength || contentLength > MAX_EPUB_BYTES) {
    return Response.json({ error: 'Invalid file size' }, { status: 413 })
  }

  const contentType =
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ||
    'application/epub+zip'
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return Response.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  const pathname = `users/${session.user.id}/books/${filename}`

  try {
    const blob = await put(pathname, request.body, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
    })
    return Response.json({
      url: blob.url,
      pathname: blob.pathname,
      size: contentLength,
      contentType,
    })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 })
  }
}
