'use server'

import { revalidatePath } from 'next/cache'

import { requireUser } from '@silkflow/reader/lib/session'
import {
  createBook,
  deleteBook,
  getBook,
  getSettings,
  listBooks,
  saveSettings,
  updateBook,
} from '@silkflow/reader/lib/db/queries'
import {
  assertUploadedEpub,
  deleteBlobs,
  putCover,
} from '@silkflow/reader/lib/blob'

export type CloudBook = Awaited<ReturnType<typeof listBooks>>[number]

export async function listBooksAction() {
  const userId = await requireUser()
  return listBooks(userId)
}

export async function createBookAction(input: {
  id: string
  name: string
  size: number
  metadata: unknown
  epubBlobUrl: string
  epubBlobPathname: string
  coverDataUrl?: string | null
}) {
  const userId = await requireUser()
  const epubBlob = await assertUploadedEpub({
    userId,
    url: input.epubBlobUrl,
    pathname: input.epubBlobPathname,
    expectedSize: input.size,
  })
  let coverBlobUrl: string | null = null
  if (input.coverDataUrl) {
    coverBlobUrl = await putCover(userId, input.id, input.coverDataUrl)
  }
  const book = await createBook(userId, {
    id: input.id,
    name: input.name,
    size: input.size,
    metadata: input.metadata,
    epubBlobUrl: epubBlob.url,
    coverBlobUrl,
  })
  revalidatePath('/library')
  return book
}

export async function deleteBookAction(bookId: string) {
  const userId = await requireUser()
  const book = await getBook(userId, bookId)
  if (book) {
    await deleteBlobs([book.epubBlobUrl, book.coverBlobUrl])
    await deleteBook(userId, bookId)
  }
  revalidatePath('/library')
}

export async function updateBookAction(
  bookId: string,
  changes: {
    cfi?: string | null
    percentage?: number | null
    definitions?: string[]
    annotations?: unknown[]
    configuration?: unknown
  },
) {
  const userId = await requireUser()
  await updateBook(userId, bookId, changes)
}

export async function getSettingsAction() {
  const userId = await requireUser()
  return getSettings(userId)
}

export async function saveSettingsAction(data: unknown) {
  const userId = await requireUser()
  await saveSettings(userId, data)
}
