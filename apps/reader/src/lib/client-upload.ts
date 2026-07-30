/**
 * Upload an epub to Vercel Blob by streaming it through the `/api/upload`
 * route (which enforces auth and writes under the user's namespace).
 */
export interface UploadedEpub {
  url: string
  pathname: string
  size: number
  contentType: string
}

export async function uploadEpub(file: File): Promise<UploadedEpub> {
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
  return (await res.json()) as UploadedEpub
}
