import { del, put } from '@vercel/blob'

const COVER_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
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
  const ext = COVER_EXT[mime] ?? 'png'
  const buffer = Buffer.from(base64, 'base64')
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
