import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ปลายทางของลิงก์ในอีเมลตั้งรหัสผ่านใหม่ · รองรับ 2 แบบ:
//  - ?code=...                      (PKCE: เปิดลิงก์ในเบราว์เซอร์เดียวกับที่กดขอ)
//  - ?token_hash=...&type=recovery  (แก้เทมเพลตอีเมลใน Supabase แล้ว เปิดข้ามเครื่อง/ข้ามเบราว์เซอร์ได้)
export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '') || url.origin
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const sb = createClient()
  let ok = false
  if (tokenHash && type === 'recovery') ok = !(await sb.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })).error
  else if (code) ok = !(await sb.auth.exchangeCodeForSession(code)).error
  const to = ok ? '/reset' : '/forgot?error=' + encodeURIComponent('ลิงก์หมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่')
  return NextResponse.redirect(new URL(to, origin))
}
