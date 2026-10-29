import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'
import { generate } from '@/lib/ai'
const KINDS: Record<string, [string, string]> = {
  post: ['โพสต์โซเชียล', 'โพสต์ขายสินค้าสำหรับโซเชียล ไม่เกิน 120 คำ พร้อมแฮชแท็ก 3-5 อัน'],
  desc: ['คำอธิบายสินค้า', 'คำอธิบายสินค้าสำหรับหน้าเซลเพจ'],
  script: ['สคริปต์ไลฟ์', 'สคริปต์เปิดไลฟ์ แนะนำสินค้า และปิดการขาย'],
  seo: ['SEO', 'SEO title ไม่เกิน 60 ตัวอักษร และ meta description ไม่เกิน 155 ตัวอักษร'],
}
const ERR: Record<string, string> = { quota: 'โควตา AI วันนี้เต็มแล้ว', disabled: 'ผู้ช่วย AI ปิดอยู่ เปิดได้ที่หน้า AI' }
async function gen(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  const kind = String(fd.get('kind')), note = String(fd.get('note') || '').slice(0, 300)
  if (!(kind in KINDS)) return
  const pid = String(fd.get('product') || '')
  const { data: p } = pid ? await sb.from('products').select('name,price').eq('id', pid).eq('tenant_id', tenant.id).maybeSingle() : { data: null }
  const r = await generate(
    tenant.id,
    (ctx) => `คุณเป็นนักเขียนคอนเทนต์ขายของให้ร้าน "${ctx.shop}" เขียนภาษาไทย ใช้เฉพาะข้อมูลที่ให้ ห้ามแต่งราคา โปรโมชั่น หรือคุณสมบัติที่ไม่มีในข้อมูล งาน: ${KINDS[kind][1]}\nคำแนะนำจากร้าน: ${ctx.instructions || '(ไม่มี)'}\nสินค้าของร้าน: ${JSON.stringify(ctx.products)}`,
    `เน้นสินค้า: ${p ? `${p.name} ราคา ${p.price} บาท` : 'ทั้งร้าน'}\nหมายเหตุจากเจ้าของร้าน: ${note || '-'}`,
  )
  if (!r.text) redirect('/app/content?error=' + (r.error ?? 'ai_failed'))
  await sb.from('content_items').insert({ tenant_id: tenant.id, kind, title: p?.name ?? 'ทั้งร้าน', body: r.text })
  revalidatePath('/app/content')
}
async function del(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  await sb.from('content_items').delete().eq('id', String(fd.get('id'))).eq('tenant_id', tenant.id)
  revalidatePath('/app/content')
}
export default async function Content({ searchParams }: { searchParams: { error?: string } }) {
  const { sb, tenant } = await getContext()
  const [{ data: items }, { data: products }] = await Promise.all([
    sb.from('content_items').select('id,kind,title,body').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(50),
    sb.from('products').select('id,name').eq('tenant_id', tenant.id).eq('status', 'active'),
  ])
  return (
    <>
      <h1 className="text-2xl font-bold">คลังคอนเทนต์</h1>
      <p className="mt-2 text-sm text-ink/70">AI เขียนจากข้อมูลสินค้าจริงของร้าน แต่ละครั้งนับเป็น 1 ข้อความในโควตา ควรอ่านทบทวนก่อนนำไปใช้</p>
      {searchParams.error && <p role="alert" className="mt-4 rounded-md bg-sun/30 p-3 text-sm">{ERR[searchParams.error] ?? 'สร้างคอนเทนต์ไม่สำเร็จ ลองใหม่อีกครั้ง'}</p>}
      <form action={gen} className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
        <select name="kind" className="input">{Object.entries(KINDS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
        <select name="product" className="input"><option value="">ทั้งร้าน</option>{products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input name="note" maxLength={300} placeholder="โจทย์เพิ่มเติม เช่น เน้นลูกค้าวัยทำงาน" className="input" />
        <button className="btn">สร้างคอนเทนต์</button>
      </form>
      <ul className="mt-8 space-y-6">
        {!items?.length && <li className="text-sm text-ink/60">ยังไม่มีคอนเทนต์ เลือกประเภทแล้วกดสร้างคอนเทนต์</li>}
        {items?.map((i) => (
          <li key={i.id}>
            <div className="flex items-center justify-between text-sm"><span className="font-medium">{KINDS[i.kind]?.[0]} · {i.title}</span>
              <form action={del}><input type="hidden" name="id" value={i.id} /><button className="underline">ลบ</button></form></div>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-white p-3 text-sm [font-family:inherit]">{i.body}</pre>
          </li>
        ))}
      </ul>
    </>
  )
}
