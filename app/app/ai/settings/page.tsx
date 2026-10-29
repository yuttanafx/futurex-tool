import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'
async function save(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  await sb.from('ai_agents').upsert({
    tenant_id: tenant.id, enabled: fd.get('enabled') === 'on',
    instructions: String(fd.get('instructions') || '').slice(0, 2000), updated_at: new Date().toISOString(),
  })
  revalidatePath('/app/ai/settings')
}
export default async function AI() {
  const { sb, tenant } = await getContext()
  const [{ data: agent }, { data: q }, { data: msgs }] = await Promise.all([
    sb.from('ai_agents').select('enabled,instructions').eq('tenant_id', tenant.id).maybeSingle(),
    sb.rpc('ai_quota', { t: tenant.id }),
    sb.from('messages').select('id,sender_type,content,created_at').order('created_at', { ascending: false }).limit(30),
  ])
  return (
    <>
      <h1 className="text-2xl font-bold">ตั้งค่าผู้ช่วย AI บนหน้าร้าน</h1>
      <a href="/app/ai" className="mt-1 inline-block text-sm underline text-ink/60">← กลับไปผู้ช่วย AI</a>
      <p className="mt-2 text-sm text-ink/70">วันนี้ใช้ไปแล้ว {q?.used ?? 0} จาก {q?.limit ?? 0} ข้อความ AI ตอบจากสินค้าที่แสดงอยู่ในร้านเท่านั้น</p>
      <form action={save} className="mt-6 space-y-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={agent?.enabled ?? true} /> เปิดใช้ผู้ช่วยบนหน้าร้าน</label>
        <label className="block text-sm">คำแนะนำถึง AI (น้ำเสียง จุดขาย เรื่องที่ไม่ควรตอบ)
          <textarea name="instructions" rows={5} defaultValue={agent?.instructions ?? ''} className="input mt-1" placeholder="เช่น พูดเป็นกันเอง ลงท้ายด้วยค่ะ ส่งฟรีเมื่อซื้อครบ 500 บาท" />
        </label>
        <button className="btn">บันทึก</button>
      </form>
      <h2 className="mt-10 text-lg font-bold">ข้อความล่าสุด</h2>
      <ul className="mt-3 space-y-2">
        {!msgs?.length && <li className="text-sm text-ink/60">ยังไม่มีบทสนทนา เมื่อลูกค้าถามผ่านหน้าร้าน ข้อความจะขึ้นที่นี่</li>}
        {msgs?.map((m) => <li key={m.id} className="text-sm"><span className="text-ink/60">{m.sender_type === 'ai' ? 'AI' : 'ลูกค้า'}:</span> {m.content}</li>)}
      </ul>
    </>
  )
}
