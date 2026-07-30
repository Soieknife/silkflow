import { del, head, put } from '@vercel/blob'

const COVER_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_COVER_BYTES = 5 * 1024 * 1024

export async function assertUploadedEpub(input: {
  userId: string
  url: string
  pathname: string
  expectedSize: number
}) {
  const prefix = `users/${input.userId}/books/`
  if (
    !input.pathname.startsWith(prefix) ||
    !/\.epub(?:-[^/]+)?$/i.test(input.pathname)
  ) {
    throw new Error('INVALID_BLOB_PATH')
  }

  const blob = await head(input.url)
  if (blob.pathname !== input.pathname || !blob.pathname.startsWith(prefix)) {
    throw new Error('INVALID_BLOB_OWNER')
  }
  if (blob.size !== input.expectedSize) {
    throw new Error('INVALID_BLOB_SIZE')
  }
  if (
    ![
      'application/epub+zip',
      'application/epub',
      'application/zip',
      'application/octet-stream',
    ].includes(blob.contentType)
  ) {
    throw new Error('INVALID_BLOB_TYPE')
  }

  return blob
}

/** Upload a base64 cover data URL to Vercel Blob. Returns the public URL. */
export async function putCover(
  userId: string,
  bookId: string,
  dataUrl: string,
): Promise<string | null> {
  const match = /^data:(.*?);base64,(.*)$/.exec(dataUrl)
  if (!match) return null
  const [, mime, base64] = match
  if (!mime || !base64) return null
  if (!Object.hasOwn(COVER_EXT, mime)) return null
  const ext = COVER_EXT[mime] ?? 'png'
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.byteLength > MAX_COVER_BYTES) return null
  const blob = await put(`users/${userId}/covers/${bookId}.${ext}`, buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: mime,
  })
  return blob.url
}

/** Delete one or more blobs (ignores null/undefined). */
export async function deleteBlobs(urls: (string | null | undefined)[]) {
  const valid = urls.filter((u): u is string => !!u)
  if (valid.length) await del(valid)
}
