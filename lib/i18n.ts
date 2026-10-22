export type Lang = 'th' | 'en' | 'zh'
export type Theme = 'night' | 'day'
export type Tx = Record<Lang, string>

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
]
export const HTML_LANG: Record<Lang, string> = { th: 'th', en: 'en', zh: 'zh-CN' }
export const LANG_COOKIE = 'ui_lang'
export const THEME_COOKIE = 'ui_theme'

export const parseLang = (v?: string): Lang => (v === 'en' || v === 'zh' || v === 'th' ? v : 'th')
export const parseTheme = (v?: string): Theme => (v === 'day' ? 'day' : 'night')
