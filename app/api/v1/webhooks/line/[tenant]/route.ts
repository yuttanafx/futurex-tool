import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { admin } from '@/lib/supabase/admin'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function POST(req: Request, { params }: { params: { tenant: string } }) {
  const tenant = params.tenant
  if (!UUID.test(tenant)) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const raw = await req.text()
  const sb = admin()
  const { data: s } = await sb.from('integration_secrets').select('secret').eq('tenant_id', tenant).eq('provider', 'line').maybeSingle()
  const sig = Buffer.from(req.headers.get('x-line-signature') ?? '', 'base64')
  const exp = s ? createHmac('sha256', s.secret).update(raw).digest() : null
  if (!exp || sig.length !== exp.length || !timingSafeEqual(sig, exp)) return NextResponse.json({ error: 'bad_signature' }, { status: 401 })
  let events: any[] = []
  try { events = JSON.parse(raw).events ?? [] } catch {}
  for (const ev of events) {
    if (ev?.type !== 'message' || ev.message?.type !== 'text' || !ev.webhookEventId) continue
    const { error: dup } = await sb.from('webhook_events').insert({ provider: 'line', event_id: ev.webhookEventId, tenant_id: tenant })
    if (dup) continue // ซ้ำ (23505) หรือบันทึกไม่ได้ → ไม่ประมวลผลซ้ำ
    const { data: c } = await sb.from('conversations')
      .upsert({ tenant_id: tenant, channel: 'line', external_id: String(ev.source?.userId ?? 'unknown') }, { onConflict: 'tenant_id,channel,external_id' })
      .select('id').single()
    if (c) await sb.from('messages').insert({ conversation_id: c.id, tenant_id: tenant, sender_type: 'customer', content: String(ev.message.text).slice(0, 2000) })
  }
  return NextResponse.json({ ok: true })
}
