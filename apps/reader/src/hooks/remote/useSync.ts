'use client'

import { useCallback, useEffect } from 'react'
import { useSnapshot } from 'valtio'

import { Annotation } from '@silkflow/reader/annotation'
import { BookRecord } from '@silkflow/reader/db'
import { BookTab } from '@silkflow/reader/models'

import { updateBookAction } from '../../app/actions/books'

/**
 * Push per-tab reading state (cfi/percentage, definitions, annotations,
 * typography) to the user's Postgres row. Last-write-wins by `updated_at`.
 */
export function useSync(tab: BookTab) {
  const { location, book } = useSnapshot(tab)

  const id = tab.book.id

  const sync = useCallback(
    async (changes: Partial<BookRecord>) => {
      try {
        await updateBookAction(id, changes as any)
      } catch {
        /* offline / unauthorized — local-first store remains authoritative */
      }
    },
    [id],
  )

  useEffect(() => {
    sync({
      cfi: location?.start.cfi,
      percentage: book.percentage,
    })
  }, [sync, book.percentage, location?.start.cfi])

  useEffect(() => {
    sync({
      definitions: book.definitions as string[],
    })
  }, [book.definitions, sync])

  useEffect(() => {
    sync({
      annotations: book.annotations as Annotation[],
    })
  }, [book.annotations, sync])

  useEffect(() => {
    sync({
      configuration: book.configuration,
    })
  }, [book.configuration, sync])
}
