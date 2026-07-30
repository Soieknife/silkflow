import { useCallback } from 'react'

import { useSettings } from '@silkflow/reader/state'

export function useSourceColor() {
  const [{ theme }, setSettings] = useSettings()

  const setSourceColor = useCallback(
    (source: string) => {
      setSettings((prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          source,
        },
      }))
    },
    [setSettings],
  )

  return { sourceColor: theme?.source ?? '#2b2b2b', setSourceColor }
}
