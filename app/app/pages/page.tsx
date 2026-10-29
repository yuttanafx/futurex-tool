import { revalidatePath } from 'next/cache'
import { getContext, slugify } from '@/lib/tenant'
async function createPage(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  const title = String(fd.get('title') || '').trim()
  if (!title) return
  await sb.from('sales_pages').insert({
    tenant_id: tenant.id, title, slug: slugify(title), seo_title: title,
    seo_description: String(fd.get('desc') || '') || null,
  })
  revalidatePath('/app/pages')
}
async function toggle(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext() // กรอง tenant ซ้ำอีกชั้นนอกจาก RLS
  const to = String(fd.get('to')) === 'published' ? 'published' : 'draft'
  await sb.from('sales_pages').update({ status: to }).eq('id', String(fd.get('id'))).eq('tenant_id', tenant.id)
  revalidatePath('/app/pages')
}
async function saveSeo(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  await sb.from('sales_pages').update({
    seo_title: String(fd.get('seo_title') || '').slice(0, 70) || null,
    seo_description: String(fd.get('seo_description') || '').slice(0, 160) || null,
  }).eq('id', String(fd.get('id'))).eq('tenant_id', tenant.id)
  revalidatePath('/app/pages')
}
export default async function Pages() {
  const { sb, tenant } = await getContext()
  // เพจที่เผยแพร่แล้วของทุกร้านอ่านได้สาธารณะ จึงต้องกรอง tenant เสมอ
  const { data: pages } = await sb.from('sales_pages').select('id,title,status,seo_title,seo_description').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
  return (
    <>
      <h1 className="text-2xl font-bold">เซลเพจ</h1>
      <form action={createPage} className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input name="title" required placeholder="ชื่อเพจ เช่น สินค้าเพื่อสุขภาพ" className="input" />
        <input name="desc" placeholder="คำอธิบายสั้น ๆ" className="input" />
        <button className="btn">สร้างเพจ</button>
      </form>
      <ul className="mt-8 divide-y divide-ink/10">
        {!pages?.length && <li className="py-6 text-sm text-ink/60">ยังไม่มีเซลเพจ สร้างเพจแรกจากฟอร์มด้านบน</li>}
        {pages?.map((p) => (
          <li key={p.id} className="py-4">
            <div className="flex items-center justify-between">
              <div><div className="font-medium">{p.title}</div><div className="text-sm text-ink/60">{p.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}</div></div>
              <form action={toggle}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="to" value={p.status === 'published' ? 'draft' : 'published'} />
                <button className="btn">{p.status === 'published' ? 'ยกเลิกเผยแพร่' : 'เผยแพร่'}</button>
              </form>
            </div>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer underline">แก้ SEO</summary>
              <form action={saveSeo} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={p.id} />
                <input name="seo_title" defaultValue={p.seo_title ?? ''} maxLength={70} placeholder="หัวข้อบน Google (ไม่เกิน 60 ตัวอักษรกำลังดี)" aria-label="SEO title" className="input" />
                <textarea name="seo_description" defaultValue={p.seo_description ?? ''} maxLength={160} rows={2} placeholder="คำอธิบายใต้หัวข้อ (ไม่เกิน 155 ตัวอักษร)" aria-label="SEO description" className="input" />
                <button className="btn">บันทึก SEO</button>
              </form>
            </details>
          </li>
        ))}
      </ul>
    </>
  )
}
