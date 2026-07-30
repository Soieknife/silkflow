import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>
}

const connectionString =
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? ''
// Fallback dummy URL so static builds don't crash at import time; real queries
// require a valid POSTGRES_URL and will fail at runtime otherwise.
const client =
  globalForDb.pgClient ??
  postgres(
    connectionString || 'postgres://nobody:nobody@localhost:5432/nobody',
    {
      max: 1,
      ssl: 'prefer',
    },
  )

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client
}

export const db = drizzle(client, { schema })
