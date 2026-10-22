import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// ลิงก์แนะนำ: /r/รหัส[?to=/เส้นทางในเว็บนี้] → จำผู้แนะนำไว้ 30 วัน (คุกกี้) แล้วพาไปปลายทาง
export async function GET(req: Request, { params }: { params: { code: string } }) {
  const u = new URL(req.url)
  const to = u.searchParams.get('to') ?? ''
  const dest = to.startsWith('/') && !to.startsWith('//') && !to.startsWith('/\\') ? to : '/login?mode=register'
  const res = NextResponse.redirect(new URL(dest, req.url))
  const code = params.code.toLowerCase()
  if (/^[a-z0-9]{4,16}$/.test(code)) {
    const { data } = await createClient().from('tenants').select('id').eq('ref_code', code).eq('status', 'active').maybeSingle()
    if (data) res.cookies.set('ref', code, { maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: 'lax', path: '/' })
  }
  return res
}
