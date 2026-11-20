'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { T, usePrefs } from '@/components/Prefs'
import VideoEmbed from '@/components/VideoEmbed'
import { GROUPS, TAGLINES, type GuideItem } from '@/lib/guide'

/**
 * ปุ่มฟีเจอร์ภายในระบบ — บนปุ่มมีประโยชน์สั้นๆ กดแล้วมีหน้าต่างเด้งขึ้นมาบอก "มีประโยชน์ยังไง" และ "ใช้งานยังไง"
 * mode="public": ใช้บนหน้าแรก (ก่อนล็อกอิน) ปุ่มท้ายหน้าต่างชวนสมัครสมาชิก
 * mode="app": ใช้ในแดชบอร์ด ปุ่มท้ายหน้าต่างพาไปหน้าฟีเจอร์จริง
 */
export default function FeatureGuide({ items, mode, only }: { items: GuideItem[]; mode: 'public' | 'app'; only?: string }) {
  const { lang } = usePrefs()
  const [sel, setSel] = useState<string | null>(null)
  const cur = items.find((i) => i.href === sel) ?? null
  const closeBtn = useRef<HTMLButtonElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  const open = (href: string, el: HTMLElement) => { opener.current = el; setSel(href) }
  const close = () => { setSel(null); opener.current?.focus() }

  useEffect(() => {
    if (!cur) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur])

  return (
    <div>
      {only ? (
        (() => {
          const it = items.find((i) => i.href === only)
          if (!it) return null
          return (
            <button type="button" className="fbtn" aria-haspopup="dialog" onClick={(e) => open(it.href, e.currentTarget)}>
              <span className="ico" aria-hidden>{it.icon}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium"><T {...it.title} /></span>
                {TAGLINES[it.href] && <span className="block truncate text-xs text-ink/60"><T {...TAGLINES[it.href]} /></span>}
              </span>
            </button>
          )
        })()
      ) : (
      <div className="space-y-6">
        {GROUPS.map((g, gi) => {
          const list = g.hrefs.map((h) => items.find((i) => i.href === h)).filter((i): i is GuideItem => !!i)
          if (!list.length) return null
          return (
            <div key={gi} role="group" aria-label={g.title[lang]}>
              <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-ink/50"><T {...g.title} /></p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((it) => (
                  <button key={it.href} type="button" className="fbtn" aria-haspopup="dialog" onClick={(e) => open(it.href, e.currentTarget)}>
                    <span className="ico" aria-hidden>{it.icon}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium"><T {...it.title} /></span>
                      {TAGLINES[it.href] && <span className="block truncate text-xs text-ink/60"><T {...TAGLINES[it.href]} /></span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      )}
      {cur && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={close} role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="fg-title" onClick={(e) => e.stopPropagation()}
            className="fg-pop relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#16324a] p-6 text-white shadow-2xl">
            <button ref={closeBtn} type="button" onClick={close} aria-label={{ th: 'ปิด', en: 'Close', zh: '关闭' }[lang]}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-lg hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sun">✕</button>
            <h3 id="fg-title" className="flex items-center gap-3 pr-8 text-xl font-bold">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl" aria-hidden>{cur.icon}</span><T {...cur.title} />
            </h3>
            <h4 className="mt-5 text-sm font-bold text-sun"><T th="✅ มีประโยชน์ยังไง" en="✅ Why it helps" zh="✅ 有什么用" /></h4>
            <p className="mt-1 text-sm text-white/85"><T {...cur.benefit} /></p>
            <h4 className="mt-5 text-sm font-bold text-sun"><T th="🛠 ใช้งานยังไง" en="🛠 How to use it" zh="🛠 怎么用" /></h4>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-white/85">
              {cur.steps.map((s, i) => <li key={i}>{s[lang]}</li>)}
            </ol>
            {cur.videoUrl && <div className="mt-4"><VideoEmbed url={cur.videoUrl} title={cur.title[lang]} /></div>}
            <div className="mt-6 flex flex-wrap gap-3">
              {only ? null : mode === 'app' ? (
                <Link href={cur.href} className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-[#1D3FBF] hover:brightness-95"><T th="ไปที่หน้านี้ →" en="Open this page →" zh="前往此页面 →" /></Link>
              ) : (
                <Link href="/register" className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-[#1D3FBF] hover:brightness-95"><T th="สมัครฟรีเพื่อใช้งานจริง" en="Sign up free to use it" zh="免费注册开始使用" /></Link>
              )}
              <button type="button" onClick={close} className="rounded-md border border-white/30 px-4 py-2 text-sm hover:bg-white/10"><T th="ปิด" en="Close" zh="关闭" /></button>
            </div>
          </div>
        </div>, document.body)}
    </div>
  )
}
