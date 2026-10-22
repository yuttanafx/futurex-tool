import './globals.css'
import { cookies } from 'next/headers'
import { IBM_Plex_Sans_Thai } from 'next/font/google'
import { PrefsProvider } from '@/components/Prefs'
import { HTML_LANG, LANG_COOKIE, THEME_COOKIE, parseLang, parseTheme } from '@/lib/i18n'
const f = IBM_Plex_Sans_Thai({ subsets: ['thai', 'latin'], weight: ['400', '500', '700'] })
export const metadata = { title: 'AI FutureX Tool', description: 'สร้างเซลเพจ ตอบแชท และติดตามยอดขายในที่เดียว' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = cookies()
  const lang = parseLang(jar.get(LANG_COOKIE)?.value)
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value)
  return (
    <html lang={HTML_LANG[lang]} data-ui-theme={theme} suppressHydrationWarning>
      <body className={f.className}>
        <PrefsProvider initialLang={lang} initialTheme={theme}>{children}</PrefsProvider>
      </body>
    </html>
  )
}
