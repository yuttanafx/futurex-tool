import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'
import { limited } from '@/lib/ratelimit'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// รหัสบทสนทนา (UUID สุ่ม) ทำหน้าที่เป็นกุญแจของลูกค้าคนนั้น
export async function GET(req: Request) {
  const u = new URL(req.url), tenant = u.searchParams.get('tenant') ?? '', conv = u.searchParams.get('conversation') ?? ''
  if (!UUID.test(tenant) || !UUID.test(conv)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (await limited(`poll:${tenant}`, 40, 60)) return NextResponse.json({ error: 'rate' }, { status: 429 })
  const sb = admin()
  const [{ data: messages }, { data: c }] = await Promise.all([
    sb.from('messages').select('sender_type,content').eq('conversation_id', conv).eq('tenant_id', tenant).order('created_at').limit(100),
    sb.from('conversations').select('needs_human').eq('id', conv).eq('tenant_id', tenant).maybeSingle(),
  ])
  return NextResponse.json({ messages: messages ?? [], needsHuman: !!c?.needs_human })
}
