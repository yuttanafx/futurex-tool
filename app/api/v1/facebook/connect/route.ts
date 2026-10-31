import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getContext } from '@/lib/tenant'
import { FB_DIALOG, FB_SCOPES, fbOauthConfigured, fbStorable } from '@/lib/facebook'
export const dynamic = 'force-dynamic'
// ปุ่ม "เชื่อมเพจ Facebook" ที่หน้าเซลเพจ → ไปหน้าอนุญาตของ Facebook
export async function GET(req: Request) {
  const { role } = await getContext() // ไม่ได้ล็อกอิน → /login
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
  if (!['owner', 'admin'].includes(role)) return NextResponse.redirect(`${origin}/app/pages?fb=forbidden`)
  if (!fbOauthConfigured() || !fbStorable()) return NextResponse.redirect(`${origin}/app/pages?fb=not_configured`)
  const state = randomBytes(24).toString('hex')
  const u = new URL(FB_DIALOG)
  u.searchParams.set('client_id', process.env.FB_APP_ID!)
  u.searchParams.set('redirect_uri', `${origin}/api/v1/facebook/callback`)
  u.searchParams.set('state', state)
  u.searchParams.set('scope', FB_SCOPES)
  u.searchParams.set('response_type', 'code')
  const res = NextResponse.redirect(u)
  res.cookies.set('fb_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/v1/facebook', maxAge: 600 })
  return res
}
