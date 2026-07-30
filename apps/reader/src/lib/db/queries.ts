import { and, eq } from 'drizzle-orm'

import { db } from './client'
import { books, settings, users } from './schema'

/** Upsert the SSO user on every sign-in (mirror + refresh lastLoginAt). */
export async function upsertUser(input: {
  id: string
  email?: string | null
  name?: string | null
  role?: string | null
}) {
  await db
    .insert(users)
    .values({
      id: input.id,
      email: input.email ?? null,
      name: input.name ?? null,
      role: input.role ?? 'user',
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: input.email ?? null,
        name: input.name ?? null,
        role: input.role ?? 'user',
        lastLoginAt: new Date(),
      },
    })
}

/** List all books owned by a user (metadata only — no epub body). */
export async function listBooks(userId: string) {
  return db.select().from(books).where(eq(books.userId, userId))
}

export async function getBook(userId: string, bookId: string) {
  const [row] = await db
    .select()
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, userId)))
  return row
}

export async function createBook(
  userId: string,
  input: {
    id: string
    name: string
    size: number
    metadata: unknown
    epubBlobUrl: string
    coverBlobUrl?: string | null
  },
) {
  await db.insert(books).values({
    id: input.id,
    userId,
    name: input.name,
    size: input.size,
    metadata: input.metadata as any,
    epubBlobUrl: input.epubBlobUrl,
    coverBlobUrl: input.coverBlobUrl ?? null,
  })
  return getBook(userId, input.id)
}

export async function updateBook(
  userId: string,
  bookId: string,
  changes: {
    cfi?: string | null
    percentage?: number | null
    definitions?: string[]
    annotations?: unknown[]
    configuration?: unknown
  },
) {
  await db
    .update(books)
    .set({ ...changes, updatedAt: new Date() } as any)
    .where(and(eq(books.id, bookId), eq(books.userId, userId)))
}

export async function deleteBook(userId: string, bookId: string) {
  await db
    .delete(books)
    .where(and(eq(books.id, bookId), eq(books.userId, userId)))
}

export async function getSettings(userId: string) {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
  return row?.data ?? null
}

export async function saveSettings(userId: string, data: unknown) {
  await db
    .insert(settings)
    .values({ userId, data: data as any })
    .onConflictDoUpdate({
      target: settings.userId,
      set: { data: data as any, updatedAt: new Date() },
    })
}
