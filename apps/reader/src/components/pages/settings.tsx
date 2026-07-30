'use client'

import { useEventListener } from '@literal-ui/hooks'
import Dexie from 'dexie'
import { useSession, signOut } from 'next-auth/react'

import { useColorScheme, useTranslation } from '@silkflow/reader/hooks'
import { useSettings } from '@silkflow/reader/state'

import { Button } from '../Button'
import { Checkbox, Select } from '../Form'
import { Page } from '../Page'

export const Settings: React.FC = () => {
  const { scheme, setScheme } = useColorScheme()
  const [settings, setSettings] = useSettings()
  const t = useTranslation('settings')

  return (
    <Page headline={t('title')}>
      <div className="space-y-6">
        <Item title={t('color_scheme')}>
          <Select
            value={scheme}
            onChange={(e) => {
              setScheme(e.target.value as 'system' | 'light' | 'dark')
            }}
          >
            <option value="system">{t('color_scheme.system')}</option>
            <option value="light">{t('color_scheme.light')}</option>
            <option value="dark">{t('color_scheme.dark')}</option>
          </Select>
        </Item>
        <Item title={t('text_selection_menu')}>
          <Checkbox
            name={t('text_selection_menu.enable')}
            checked={settings.enableTextSelectionMenu}
            onChange={(e) => {
              setSettings({
                ...settings,
                enableTextSelectionMenu: e.target.checked,
              })
            }}
          />
        </Item>
        <Account />
        <Item title={t('cache')}>
          <Button
            variant="secondary"
            onClick={() => {
              window.localStorage.clear()
              Dexie.getDatabaseNames().then((names) => {
                names.forEach((n) => Dexie.delete(n))
              })
            }}
          >
            {t('cache.clear')}
          </Button>
        </Item>
      </div>
    </Page>
  )
}

const Account: React.FC = () => {
  const { data: session } = useSession()
  useEventListener('message', () => {})
  const t = useTranslation('settings.synchronization')

  return (
    <Item title={t('title')}>
      <p className="text-on-surface-variant typescale-body-medium">
        {session?.user?.email ?? session?.user?.name}
      </p>
      <div className="mt-2">
        <Button
          variant="secondary"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          {t('unauthorize')}
        </Button>
      </div>
    </Item>
  )
}

interface PartProps {
  title: string
}
const Item: React.FC<PartProps> = ({ title, children }) => {
  return (
    <div>
      <h3 className="typescale-title-small text-on-surface-variant">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}

Settings.displayName = 'settings'
