/**
 * Upload an epub to Vercel Blob by streaming it through the `/api/upload`
 * route (which enforces auth and writes under the user's namespace).
 */
export async function uploadEpub(userId: string, file: File): Promise<string> {
  const res = await fetch(
    `/api/upload?filename=${encodeURIComponent(file.name)}`,
    {
      method: 'POST',
      body: file,
      headers: {
        'content-type': file.type || 'application/epub+zip',
      },
    },
  )
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`)
  }
  const blob = (await res.json()) as { url: string }
  return blob.url
}
