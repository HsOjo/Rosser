import {createI18n} from 'vue-i18n'
import zh from './zh'
import en from './en'

export type LocaleType = 'zh' | 'en'

const messages = {
  zh,
  en,
}

// Get saved locale from localStorage or use browser language
function getDefaultLocale(): LocaleType {
  const saved = localStorage.getItem('locale')
  if (saved && (saved === 'zh' || saved === 'en')) {
    return saved
  }
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh')) {
    return 'zh'
  }
  return 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages,
})

// Sync initial locale to Electron
function syncLocaleToElectron(locale: LocaleType) {
  try {
    const electron = (window as any).require?.('electron')
    if (electron?.ipcRenderer) {
      electron.ipcRenderer.send('set-locale', locale)
    }
  } catch (e) {
    // Not in Electron environment
  }
}

// Sync on initial load
syncLocaleToElectron(getDefaultLocale())

export function setLocale(locale: LocaleType) {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  syncLocaleToElectron(locale)
}

export function getLocale(): LocaleType {
  return i18n.global.locale.value as LocaleType
}

export default i18n
