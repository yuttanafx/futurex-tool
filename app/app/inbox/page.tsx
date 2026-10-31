import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'
import { pageToken, sendMessage } from '@/lib/facebook'
async function reply(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  const id = String(fd.get('id')), content = String(fd.get('content') || '').trim().slice(0, 1000)
  const { data: c } = await sb.from('conversations').select('id,channel,external_id,page_id').eq('id', id).eq('tenant_id', tenant.id).maybeSingle() // ต้องเป็นบทสนทนาของร้านเราเท่านั้น
  if (!c || !content) return
  if (c.channel === 'facebook') { // ส่งเข้า Messenger ก่อน สำเร็จแล้วค่อยบันทึก
    const token = c.page_id ? await pageToken(tenant.id, c.page_id) : null
    if (!token || !c.external_id) return
    try { await sendMessage(token, c.external_id, content) } catch { return }
  }
  await sb.from('messages').insert({ conversation_id: id, tenant_id: tenant.id, sender_type: 'staff', content })
  revalidatePath('/app/inbox')
}
async function resolve(fd: FormData) {
  'use server'
  const { sb } = await getContext()
  await sb.from('conversations').update({ needs_human: false }).eq('id', String(fd.get('id')))
  revalidatePath('/app/inbox')
}
export default async function Inbox() {
  const { sb } = await getContext()
  const { data } = await sb.from('conversations')
    .select('id,channel,needs_human,created_at,messages(sender_type,content,created_at)')
    .order('needs_human', { ascending: false }).order('created_at', { ascending: false })
    .order('created_at', { referencedTable: 'messages' }).limit(20)
  const who = { customer: 'ลูกค้า', ai: 'AI', staff: 'เจ้าหน้าที่' } as Record<string, string>
  return (
    <>
      <h1 className="text-2xl font-bold">กล่องข้อความ</h1>
      <ul className="mt-6 space-y-8">
        {!data?.length && <li className="text-sm text-ink/60">ยังไม่มีบทสนทนา เมื่อลูกค้าแชทหรือขอคุยกับเจ้าหน้าที่ รายการจะขึ้นที่นี่</li>}
        {data?.map((c: any) => (
          <li key={c.id} className={c.needs_human ? 'border-l-4 border-sun pl-4' : 'pl-5'}>
            <div className="text-sm font-medium">{c.channel === 'line' ? 'LINE' : c.channel === 'facebook' ? 'Facebook Messenger' : 'หน้าร้าน'}{c.needs_human && ' · รอเจ้าหน้าที่ตอบ'}</div>
            <ul className="mt-2 space-y-1 text-sm">{c.messages.map((m: any, i: number) => <li key={i}><span className="text-ink/60">{who[m.sender_type]}:</span> {m.content}</li>)}</ul>
            {c.channel === 'web' || c.channel === 'facebook' ? (
              <form action={reply} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input name="content" required maxLength={1000} placeholder="ตอบลูกค้า" aria-label="ข้อความตอบกลับ" className="input" />
                <button className="btn">ส่ง</button>
              </form>
            ) : <p className="mt-2 text-xs text-ink/60">การตอบกลับไป LINE ยังไม่รองรับ ตอบผ่าน LINE Official Account Manager</p>}
            {c.needs_human && <form action={resolve} className="mt-2"><input type="hidden" name="id" value={c.id} /><button className="text-sm underline">ปิดเรื่อง (ให้ AI ตอบต่อ)</button></form>}
          </li>
        ))}
      </ul>
    </>
  )
}
