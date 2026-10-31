import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { timingSafeEqual } from 'crypto'
import { getContext } from '@/lib/tenant'
import { exchangeCode, listPages, savePage, subscribePage, fbOauthConfigured, fbStorable } from '@/lib/facebook'
export const dynamic = 'force-dynamic'
const same = (a: string, b: string) => a.length === b.length && a.length > 0 && timingSafeEqual(Buffer.from(a), Buffer.from(b))
export async function GET(req: Request) {
  const { tenant, role } = await getContext()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
  const done = (q: string) => {
    const r = NextResponse.redirect(`${origin}/app/pages?${q}`)
    r.cookies.set('fb_state', '', { path: '/api/v1/facebook', maxAge: 0 })
    return r
  }
  const url = new URL(req.url)
  if (!['owner', 'admin'].includes(role)) return done('fb=forbidden')
  if (!fbOauthConfigured() || !fbStorable()) return done('fb=not_configured')
  if (url.searchParams.get('error')) return done('fb=denied')
  const code = url.searchParams.get('code') ?? '', state = url.searchParams.get('state') ?? ''
  if (!code || !same(state, cookies().get('fb_state')?.value ?? '')) return done('fb=state')
  try {
    const userToken = await exchangeCode(code, `${origin}/api/v1/facebook/callback`)
    const pages = await listPages(userToken)
    if (!pages.length) return done('fb=nopages')
    let ok = 0, taken = 0
    for (const p of pages) {
      const r = await savePage(tenant.id, p)
      if (r === 'taken') { taken++; continue }
      ok++
      try { await subscribePage(p.id, p.token) } catch { /* ยังรับ webhook ไม่ได้ แต่โพสต์ได้ */ }
    }
    return done(`fb=ok&n=${ok}${taken ? `&taken=${taken}` : ''}`)
  } catch (e) {
    console.error('facebook callback failed:', e instanceof Error ? e.message : e)
    return done('fb=failed')
  }
}
