'use client'
import { Fragment, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { HTML_LANG, LANGS, LANG_COOKIE, THEME_COOKIE, type Lang, type Theme, type Tx } from '@/lib/i18n'

type Ctx = { lang: Lang; theme: Theme; setLang: (l: Lang) => void; setTheme: (t: Theme) => void }
const PrefsCtx = createContext<Ctx>({ lang: 'th', theme: 'night', setLang: () => {}, setTheme: () => {} })
export const usePrefs = () => useContext(PrefsCtx)

const saveCookie = (k: string, v: string) => {
  document.cookie = `${k}=${v}; path=/; max-age=31536000; samesite=lax`
}

export function PrefsProvider({ initialLang, initialTheme, children }: { initialLang: Lang; initialTheme: Theme; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    saveCookie(LANG_COOKIE, l)
    document.documentElement.lang = HTML_LANG[l]
  }, [])
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    saveCookie(THEME_COOKIE, t)
    document.documentElement.dataset.uiTheme = t
  }, [])
  const value = useMemo(() => ({ lang, theme, setLang, setTheme }), [lang, theme, setLang, setTheme])
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>
}

/** แสดงข้อความตามภาษาที่เลือก — ใช้ \n เพื่อขึ้นบรรทัดใหม่ */
export function T(p: Tx) {
  const { lang } = usePrefs()
  const lines = p[lang].split('\n')
  return <>{lines.map((s, i) => <Fragment key={i}>{i > 0 && <br />}{s}</Fragment>)}</>
}

const LABEL = {
  lang: { th: 'ภาษา', en: 'Language', zh: '语言' },
  day: { th: 'โหมดกลางวัน', en: 'Day mode', zh: '白天模式' },
}

export function Controls({ className = '' }: { className?: string }) {
  const { lang, theme, setLang, setTheme } = usePrefs()
  const day = theme === 'day'
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div role="group" aria-label={LABEL.lang[lang]} className="flex rounded-full border border-ink/20 bg-ink/5 p-0.5 text-xs">
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            aria-pressed={lang === l.code}
            onClick={() => setLang(l.code)}
            className={`rounded-full px-2.5 py-1 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sun ${lang === l.code ? 'bg-brand text-white' : 'text-ink/70 hover:text-ink'}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={day}
        aria-label={LABEL.day[lang]}
        onClick={() => setTheme(day ? 'night' : 'day')}
        className={`relative h-8 w-14 shrink-0 rounded-full border border-ink/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sun ${day ? 'bg-sun/50' : 'bg-ink/10'}`}
      >
        <span style={{ backgroundColor: '#fff' }} className={`absolute left-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full shadow transition-transform duration-300 ${day ? 'translate-x-7' : ''}`}>
          {day ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#E8941A" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="#FFD166" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#3B4A8C" aria-hidden="true">
              <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
            </svg>
          )}
        </span>
      </button>
    </div>
  )
}
