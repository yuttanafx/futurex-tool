import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'
import { uploadImages } from '@/lib/upload'
export const dynamic = 'force-dynamic'
const money = (v: FormDataEntryValue | null) => { const s = String(v ?? '').trim(); if (!s) return null; const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : null }
const txt = (v: FormDataEntryValue | null, n: number) => String(v ?? '').trim().slice(0, n) || null
async function save(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  const name = String(fd.get('name') || '').trim().slice(0, 120)
  if (!name) return
  const [banner] = await uploadImages(sb, 'shop-media', tenant.id, fd.getAll('banner'), 1)
  const pp = String(fd.get('promptpay_id') || '').replace(/\D/g, '')
  await sb.from('tenants').update({
    name, tagline: txt(fd.get('tagline'), 200), about: txt(fd.get('about'), 1000),
    ...(banner ? { banner_url: banner } : {}), ...(fd.get('remove_banner') ? { banner_url: null } : {}),
    shipping_fee: money(fd.get('shipping_fee')) ?? 0, free_shipping_over: money(fd.get('free_shipping_over')),
    promptpay_id: pp.length === 10 || pp.length === 13 ? pp : null,
    bank_name: txt(fd.get('bank_name'), 60), bank_account: txt(fd.get('bank_account'), 40), bank_account_name: txt(fd.get('bank_account_name'), 120),
    cod_enabled: fd.get('cod_enabled') === 'on',
  }).eq('id', tenant.id)
  revalidatePath('/app', 'layout')
}
export default async function Settings() {
  const { sb, tenant, user, role } = await getContext()
  const { data: t } = await sb.from('tenants').select('*').eq('id', tenant.id).single()
  return (
    <>
      <h1 className="text-2xl font-bold">ตั้งค่าร้าน</h1>
      <form action={save} className="mt-6 max-w-2xl space-y-6">
        <section className="card space-y-3">
          <h2 className="font-bold">หน้าร้าน</h2>
          <p className="text-xs text-ink/60">ข้อความ แบนเนอร์ และสินค้าเริ่มต้นเป็นตัวอย่าง แก้ไขหรือลบได้ตามต้องการ (สินค้าแก้ที่เมนู “สินค้า”)</p>
          <label className="block text-sm">ชื่อร้าน<input name="name" defaultValue={t?.name} required className="input mt-1" /></label>
          <label className="block text-sm">สโลแกน / คำแนะนำร้าน<input name="tagline" defaultValue={t?.tagline ?? ''} maxLength={200} className="input mt-1" /></label>
          <label className="block text-sm">เกี่ยวกับร้าน (แสดงที่หน้าร้าน · ขึ้นบรรทัดใหม่ได้)<textarea name="about" rows={4} maxLength={1000} defaultValue={t?.about ?? ''} className="input mt-1" /></label>
          <div className="text-sm">แบนเนอร์หน้าร้าน (แนะนำภาพแนวนอน กว้างอย่างน้อย 1600px)
            {t?.banner_url && <div className="mt-2"><img src={t.banner_url} alt="" className="h-24 rounded-md object-cover" /><label className="mt-1 flex items-center gap-1 text-xs"><input type="checkbox" name="remove_banner" /> ลบแบนเนอร์</label></div>}
            <input name="banner" type="file" accept="image/jpeg,image/png,image/webp" className="input mt-2" /></div>
        </section>
        <section className="card space-y-3">
          <h2 className="font-bold">ค่าจัดส่ง</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">ค่าส่ง (บาท · 0 = ส่งฟรี)<input name="shipping_fee" type="number" min="0" step="0.01" defaultValue={t?.shipping_fee ?? 0} className="input mt-1" /></label>
            <label className="block text-sm">ส่งฟรีเมื่อซื้อครบ (บาท · เว้นว่าง = ไม่มี)<input name="free_shipping_over" type="number" min="0" step="0.01" defaultValue={t?.free_shipping_over ?? ''} className="input mt-1" /></label>
          </div>
        </section>
        <section className="card space-y-3">
          <h2 className="font-bold">รับชำระเงิน</h2>
          <p className="text-xs text-ink/60">ลูกค้าจะเห็นเฉพาะช่องทางที่คุณกรอก · ข้อมูลบัญชีนี้แสดงต่อสาธารณะในหน้าชำระเงินของลูกค้า</p>
          <label className="block text-sm">พร้อมเพย์ (เบอร์โทร 10 หลัก หรือเลขบัตร/เลขผู้เสียภาษี 13 หลัก) → ระบบสร้าง QR ตามยอดออเดอร์ให้<input name="promptpay_id" inputMode="numeric" defaultValue={t?.promptpay_id ?? ''} className="input mt-1" /></label>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm">ธนาคาร<input name="bank_name" defaultValue={t?.bank_name ?? ''} className="input mt-1" /></label>
            <label className="block text-sm">เลขที่บัญชี<input name="bank_account" defaultValue={t?.bank_account ?? ''} className="input mt-1" /></label>
            <label className="block text-sm">ชื่อบัญชี<input name="bank_account_name" defaultValue={t?.bank_account_name ?? ''} className="input mt-1" /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="cod_enabled" defaultChecked={!!t?.cod_enabled} /> เปิดรับเก็บเงินปลายทาง</label>
        </section>
        <button className="btn">บันทึก</button>
      </form>
      <dl className="card mt-4 max-w-2xl space-y-2 text-sm">
        <div><dt className="text-ink/60">ลิงก์หน้าร้าน</dt><dd>/s/{tenant.slug}</dd></div>
        <div><dt className="text-ink/60">บัญชีที่ล็อกอิน</dt><dd>{user.email} ({role})</dd></div>
      </dl>
    </>
  )
}
