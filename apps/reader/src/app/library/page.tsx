'use client'

import { useBoolean } from '@literal-ui/hooks'
import clsx from 'clsx'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdCheckCircle,
  MdOutlineFileDownload,
  MdOutlineShare,
} from 'react-icons/md'
import { useSet } from 'react-use'
import { usePrevious } from 'react-use'

import {
  createBookAction,
  deleteBookAction,
} from '@silkflow/reader/app/actions/books'
import {
  Button,
  DropZone,
  ReaderGridView,
  TextField,
} from '@silkflow/reader/components'
import { Layout } from '@silkflow/reader/components'
import { BookRecord, CoverRecord, db } from '@silkflow/reader/db'
import { addFile, fetchBook, handleFiles } from '@silkflow/reader/file'
import {
  useDisablePinchZooming,
  useLibrary,
  useRemoteBooks,
  useTranslation,
} from '@silkflow/reader/hooks'
import { uploadEpub } from '@silkflow/reader/lib/client-upload'
import { reader, useReaderSnapshot } from '@silkflow/reader/models'
import { lock } from '@silkflow/reader/styles'
import { pack } from '@silkflow/reader/sync'
import { copy } from '@silkflow/reader/utils'

const placeholder = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="gray" fill-opacity="0" width="1" height="1"/></svg>`

const SOURCE = 'src'

export default function LibraryPage() {
  return (
    <Layout>
      <Index />
    </Layout>
  )
}

function Index() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [loading, setLoading] = useState(false)

  useDisablePinchZooming()

  // Open an epub passed via ?src=<url> (share/download flow + PWA file handler).
  useEffect(() => {
    const src = new URL(window.location.href).searchParams.getAll(SOURCE)
    if (!src.length) return
    Promise.all(
      src.map((s) => fetchBook(s).then((b) => reader.addTab(b))),
    ).finally(() => setLoading(false))
  }, [])

  // PWA file handler (launchQueue).
  useEffect(() => {
    if ('launchQueue' in window && 'LaunchParams' in window) {
      window.launchQueue.setConsumer((params) => {
        if (params.files.length) {
          Promise.all(params.files.map((f) => f.getFile()))
            .then((files) => handleFiles(files))
            .then((books) => books.forEach((b) => reader.addTab(b)))
        }
      })
    }
  }, [])

  return (
    <>
      <ReaderGridView />
      {loading || <Library userId={userId} />}
    </>
  )
}

interface LibraryProps {
  userId?: string
}
const Library: React.FC<LibraryProps> = ({ userId }) => {
  const books = useLibrary()
  const covers = useLiveQuery(() => db?.covers.toArray() ?? [])
  const t = useTranslation('home')

  const { data: remoteBooks, mutate: mutateRemoteBooks } = useRemoteBooks()
  const previousRemoteBooks = usePrevious(remoteBooks)

  const [select, toggleSelect] = useBoolean(false)
  const [selectedBookIds, { add, has, toggle, reset }] = useSet<string>()

  const [loading, setLoading] = useState<string | undefined>()

  const { groups } = useReaderSnapshot()

  // First cloud pull: upsert server rows into the local-first Dexie store.
  useEffect(() => {
    if (!remoteBooks || previousRemoteBooks) return
    ;(async () => {
      for (const rb of remoteBooks) {
        const existing = await db?.books.get(rb.id)
        if (!existing) {
          await db?.books.put({
            id: rb.id,
            name: rb.name,
            size: rb.size ?? 0,
            metadata: rb.metadata as BookRecord['metadata'],
            createdAt: rb.createdAt
              ? new Date(rb.createdAt).getTime()
              : Date.now(),
            updatedAt: rb.updatedAt
              ? new Date(rb.updatedAt).getTime()
              : undefined,
            cfi: rb.cfi ?? undefined,
            percentage: rb.percentage ?? undefined,
            definitions: (rb.definitions as string[]) ?? [],
            annotations: (rb.annotations as BookRecord['annotations']) ?? [],
            configuration: rb.configuration as BookRecord['configuration'],
            epubBlobUrl: rb.epubBlobUrl ?? undefined,
            coverBlobUrl: rb.coverBlobUrl ?? undefined,
          })
        }
        if (rb.coverBlobUrl) {
          const c = await db?.covers.get(rb.id)
          if (!c) await db?.covers.put({ id: rb.id, cover: rb.coverBlobUrl })
        }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteBooks])

  useEffect(() => {
    if (!select) reset()
  }, [reset, select])

  if (groups.length) return null
  if (!books) return null

  const selectedBooks = [...selectedBookIds].map((id) =>
    books.find((b) => b.id === id)!,
  )
  const allSelected = selectedBookIds.size === books.length

  async function ensureFile(book: BookRecord) {
    const f = await db?.files.get(book.id)
    if (f || !book.epubBlobUrl) return
    const res = await fetch(book.epubBlobUrl)
    const blob = await res.blob()
    await addFile(book.id, new File([blob], book.name))
  }

  async function uploadBookToCloud(book: BookRecord) {
    if (!userId || book.epubBlobUrl) return
    const fr = await db?.files.get(book.id)
    if (!fr) return

    setLoading(book.id)
    try {
      const epub = await uploadEpub(fr.file)
      const cover = await db?.covers.get(book.id)
      await createBookAction({
        id: book.id,
        name: book.name,
        size: book.size,
        metadata: book.metadata,
        epubBlobUrl: epub.url,
        epubBlobPathname: epub.pathname,
        coverDataUrl: cover?.cover ?? null,
      })
      await db?.books.update(book.id, { epubBlobUrl: epub.url })
      mutateRemoteBooks()
    } finally {
      setLoading(undefined)
    }
  }

  async function importFiles(files: Iterable<File>) {
    const newBooks = await handleFiles(files)
    for (const book of newBooks) {
      await uploadBookToCloud(book)
    }
    return newBooks
  }

  return (
    <DropZone
      className="scroll-parent h-full p-4"
      onDrop={(e) => {
        const bookId = e.dataTransfer.getData('text/plain')
        const book = books.find((b) => b.id === bookId)
        if (book) reader.addTab(book)

        importFiles(e.dataTransfer.files)
      }}
    >
      <div className="mb-4 space-y-2.5">
        <div>
          <TextField
            name={SOURCE}
            placeholder="https://link.to/remote.epub"
            type="url"
            hideLabel
            actions={[
              {
                title: t('share'),
                Icon: MdOutlineShare,
                onClick(el) {
                  if (el?.reportValidity()) {
                    copy(
                      `${window.location.origin}/library?${SOURCE}=${el.value}`,
                    )
                  }
                },
              },
              {
                title: t('download'),
                Icon: MdOutlineFileDownload,
                onClick(el) {
                  if (el?.reportValidity()) fetchBook(el.value)
                },
              },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-x-2">
            {books.length ? (
              <Button variant="secondary" onClick={toggleSelect}>
                {t(select ? 'cancel' : 'select')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled={!books}
                onClick={() => {
                  fetchBook(
                    'https://epubtest.org/books/Fundamental-Accessibility-Tests-Basic-Functionality-v1.0.0.epub',
                  )
                }}
              >
                {t('download_sample_book')}
              </Button>
            )}
            {select &&
              (allSelected ? (
                <Button variant="secondary" onClick={reset}>
                  {t('deselect_all')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => books.forEach((b) => add(b.id))}
                >
                  {t('select_all')}
                </Button>
              ))}
          </div>

          <div className="space-x-2">
            {select ? (
              <>
                <Button
                  onClick={async () => {
                    toggleSelect()
                    for (const book of selectedBooks) {
                      await uploadBookToCloud(book)
                    }
                  }}
                >
                  {t('upload')}
                </Button>
                <Button
                  onClick={async () => {
                    toggleSelect()
                    const bookIds = [...selectedBookIds]

                    db?.books.bulkDelete(bookIds)
                    db?.covers.bulkDelete(bookIds)
                    db?.files.bulkDelete(bookIds)

                    await Promise.all(
                      selectedBooks.map((b) => deleteBookAction(b.id)),
                    )
                    mutateRemoteBooks()
                  }}
                >
                  {t('delete')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  disabled={!books.length}
                  onClick={pack}
                >
                  {t('export')}
                </Button>
                <Button className="relative">
                  <input
                    type="file"
                    accept="application/epub+zip,application/epub,application/zip"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) importFiles(files)
                    }}
                    multiple
                  />
                  {t('import')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="scroll h-full">
        <ul
          className="grid"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(calc(80px + 3vw), 1fr))`,
            columnGap: lock(16, 32),
            rowGap: lock(24, 40),
          }}
        >
          {books.map((book) => (
            <Book
              key={book.id}
              book={book}
              covers={covers}
              select={select}
              selected={has(book.id)}
              loading={loading === book.id}
              toggle={toggle}
              onOpen={async (b) => {
                await ensureFile(b)
                reader.addTab(b)
              }}
            />
          ))}
        </ul>
      </div>
    </DropZone>
  )
}

interface BookProps {
  book: BookRecord
  covers?: CoverRecord[]
  select?: boolean
  selected?: boolean
  loading?: boolean
  toggle: (id: string) => void
  onOpen: (book: BookRecord) => void
}
const Book: React.FC<BookProps> = ({
  book,
  covers,
  select,
  selected,
  loading,
  toggle,
  onOpen,
}) => {
  const cover = covers?.find((c) => c.id === book.id)?.cover
  const synced = !!book.epubBlobUrl

  const Icon = selected ? MdCheckBox : MdCheckBoxOutlineBlank

  return (
    <div className="relative flex flex-col">
      <div
        role="button"
        className="relative border border-inverse-on-surface"
        onClick={() => {
          if (select) {
            toggle(book.id)
          } else {
            onOpen(book)
          }
        }}
      >
        <div
          className={clsx(
            'absolute bottom-0 h-1 bg-on-surface/70',
            loading && 'progress-bit w-[5%]',
          )}
        />
        {book.percentage !== undefined && (
          <div className="absolute right-0 bg-gray-500/60 px-2 text-gray-100 typescale-body-large">
            {(book.percentage * 100).toFixed()}%
          </div>
        )}
        <img
          src={cover ?? placeholder}
          alt="Cover"
          className="mx-auto aspect-[9/12] object-cover"
          draggable={false}
        />
        {select && (
          <div className="absolute bottom-1 right-1">
            <Icon
              size={24}
              className={clsx(
                '-m-1',
                selected ? 'text-tertiary' : 'text-outline',
              )}
            />
          </div>
        )}
      </div>

      <div
        className="mt-2 w-full text-on-surface-variant typescale-body-small line-clamp-2 lg:typescale-body-medium"
        title={book.name}
      >
        <MdCheckCircle
          className={clsx(
            'mr-1 mb-0.5 inline',
            synced ? 'text-tertiary' : 'text-surface-variant',
          )}
          size={16}
        />
        {book.name}
      </div>
    </div>
  )
}
