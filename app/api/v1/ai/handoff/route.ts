import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'
import { limited } from '@/lib/ratelimit'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const tenant = String(b?.tenant ?? ''), contact = String(b?.contact ?? '').trim().slice(0, 100)
  if (!UUID.test(tenant) || !contact) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (await limited(`handoff:${tenant}`, 3, 600)) return NextResponse.json({ error: 'rate' }, { status: 429 })
  const sb = admin()
  const { data: t } = await sb.from('tenants').select('id').eq('id', tenant).eq('status', 'active').maybeSingle()
  if (!t) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  let conv: string | null = UUID.test(String(b.conversation ?? '')) ? b.conversation : null
  if (conv) { const { data: c } = await sb.from('conversations').select('id').eq('id', conv).eq('tenant_id', tenant).maybeSingle(); if (!c) conv = null }
  if (!conv) { const { data: c } = await sb.from('conversations').insert({ tenant_id: tenant }).select('id').single(); conv = c!.id }
  await sb.from('conversations').update({ needs_human: true }).eq('id', conv)
  await sb.from('messages').insert({ conversation_id: conv, tenant_id: tenant, sender_type: 'customer', content: `ขอคุยกับเจ้าหน้าที่ — ติดต่อ: ${contact}` })
  return NextResponse.json({ conversation: conv })
}
