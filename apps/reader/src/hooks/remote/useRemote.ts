'use client'

import useSWR from 'swr'

import { listBooksAction } from '../../app/actions/books'

/** Cloud library (server rows) — source of truth for cross-device sync. */
export function useRemoteBooks() {
  return useSWR('cloud-books', () => listBooksAction(), {
    shouldRetryOnError: false,
  })
}
