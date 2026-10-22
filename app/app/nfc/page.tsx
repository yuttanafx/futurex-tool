import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'
async function add(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  const label = String(fd.get('label') || '').trim()
  const url = String(fd.get('url') || '').trim()
  if (!label || (url && !url.startsWith('https://'))) return
  await sb.from('nfc_cards').insert({ tenant_id: tenant.id, label, target_url: url || null, slug: Math.random().toString(36).slice(2, 10) })
  revalidatePath('/app/nfc')
}
async function toggle(fd: FormData) {
  'use server'
  const { sb } = await getContext()
  await sb.from('nfc_cards').update({ active: fd.get('to') === '1' }).eq('id', String(fd.get('id')))
  revalidatePath('/app/nfc')
}
export default async function Nfc() {
  const { sb } = await getContext()
  const { data } = await sb.from('nfc_cards').select('id,slug,label,target_url,active,scans').order('created_at', { ascending: false })
  return (
    <>
      <h1 className="text-2xl font-bold">นามบัตร NFC</h1>
      <p className="mt-2 text-sm text-ink/70">สร้างลิงก์สั้นแล้วเขียนลงแท็ก NFC หรือพิมพ์เป็น QR ถ้าไม่ใส่ปลายทาง ลิงก์จะพาไปหน้าร้านของคุณ แก้ปลายทางภายหลังได้โดยไม่ต้องเขียนแท็กใหม่</p>
      <form action={add} className="mt-6 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
        <input name="label" required placeholder="ชื่อนามบัตร เช่น คุณสมชาย" className="input" />
        <input name="url" type="url" placeholder="ปลายทาง (https://...) เว้นว่างเพื่อไปหน้าร้าน" className="input" />
        <button className="btn">สร้างลิงก์</button>
      </form>
      <ul className="mt-8 divide-y divide-ink/10">
        {!data?.length && <li className="py-6 text-sm text-ink/60">ยังไม่มีนามบัตร สร้างลิงก์แรกจากฟอร์มด้านบน</li>}
        {data?.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-4">
            <div><div className="font-medium">{c.label}{!c.active && ' · ปิดอยู่'}</div><div className="text-sm text-ink/60"><code>/n/{c.slug}</code> · สแกน {c.scans} ครั้ง</div></div>
            <form action={toggle}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="to" value={c.active ? '0' : '1'} /><button className="btn">{c.active ? 'ปิดลิงก์' : 'เปิดลิงก์'}</button></form>
          </li>
        ))}
      </ul>
    </>
  )
}
