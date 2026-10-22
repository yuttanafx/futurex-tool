import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const { data } = await admin().rpc('nfc_scan', { p_slug: params.slug })
  const ok = typeof data === 'string' && (data.startsWith('https://') || data.startsWith('/'))
  return NextResponse.redirect(new URL(ok ? data : '/', req.url))
}
