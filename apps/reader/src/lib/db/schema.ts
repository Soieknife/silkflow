import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/**
 * Mirror of the SilkPortal SSO user (id = SSO `sub`).
 * Sessions are JWT-based (no session table) — this row is just a local mirror
 * plus the owner anchor for the pure-private book/settings data.
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  name: text('name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const books = pgTable('books', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  size: integer('size'),
  metadata: jsonb('metadata'),
  cfi: text('cfi'),
  percentage: real('percentage'),
  definitions: jsonb('definitions').$type<string[]>().default([]),
  annotations: jsonb('annotations').$type<unknown[]>().default([]),
  configuration: jsonb('configuration'),
  // Vercel Blob references (epub body + cover image)
  epubBlobUrl: text('epub_blob_url'),
  coverBlobUrl: text('cover_blob_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const settings = pgTable('settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  data: jsonb('data'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export type BookRow = typeof books.$inferSelect
export type SettingsRow = typeof settings.$inferSelect
