import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'
import { generate } from '@/lib/ai'
import { admin } from '@/lib/supabase/admin'
import { FB_ERR, FbError, pageToken, publishPost } from '@/lib/facebook'
import Link from 'next/link'
const KINDS: Record<string, [string, string]> = {
  post: ['โพสต์โซเชียล', 'โพสต์ขายสินค้าสำหรับโซเชียล ไม่เกิน 120 คำ พร้อมแฮชแท็ก 3-5 อัน'],
  desc: ['คำอธิบายสินค้า', 'คำอธิบายสินค้าสำหรับหน้าเซลเพจ'],
  script: ['สคริปต์ไลฟ์', 'สคริปต์เปิดไลฟ์ แนะนำสินค้า และปิดการขาย'],
  seo: ['SEO', 'SEO title ไม่เกิน 60 ตัวอักษร และ meta description ไม่เกิน 155 ตัวอักษร'],
}
const ERR: Record<string, string> = {
  quota: 'โควตา AI วันนี้เต็มแล้ว (ใส่ API key ของร้านเองเพื่อไม่จำกัดตามโควตานี้)', disabled: 'ผู้ช่วย AI ปิดอยู่ เปิดได้ที่หน้า AI',
  no_key: 'ยังไม่ได้ตั้ง API key ของ AI', not_configured: 'ระบบ AI ยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์',
  bad_key: 'ผู้ให้บริการ AI ปฏิเสธ key ของคุณ (ไม่ถูกต้อง/หมดสิทธิ์)', bad_model: 'ไม่พบโมเดลที่ตั้งไว้ ตรวจชื่อโมเดลในหน้าตั้งค่า API',
  provider_quota: 'ผู้ให้บริการ AI แจ้งว่าใช้เกินโควตา/เครดิตหมด ตรวจบัญชีของคุณ', timeout: 'เชื่อมต่อผู้ให้บริการ AI ไม่ได้ ลองใหม่อีกครั้ง',
}
const KEY_ERRS = ['no_key', 'bad_key', 'bad_model', 'provider_quota', 'quota']
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
async function postToPage(fd: FormData) {
  'use server'
  const { sb, tenant, role } = await getContext()
  if (!['owner', 'admin', 'content'].includes(role)) redirect('/app/content?fb=forbidden')
  const pageId = String(fd.get('page_id'))
  const { data: item } = await sb.from('content_items').select('body').eq('id', String(fd.get('id'))).eq('tenant_id', tenant.id).maybeSingle()
  const token = item ? await pageToken(tenant.id, pageId) : null // โพสต์ได้เฉพาะคอนเทนต์/เพจของร้านตัวเอง
  if (!item || !token) redirect('/app/content?fb=failed')
  try {
    const id = await publishPost(pageId, token, String(item.body).slice(0, 5000))
    await admin().from('fb_posts').insert({ tenant_id: tenant.id, page_id: pageId, message: String(item.body).slice(0, 5000), fb_post_id: id || null })
  } catch (e) { redirect(`/app/content?fb=failed&why=${e instanceof FbError ? e.code : 'upstream'}`) }
  redirect('/app/content?fb=posted')
}
async function del(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  await sb.from('content_items').delete().eq('id', String(fd.get('id'))).eq('tenant_id', tenant.id)
  revalidatePath('/app/content')
}
export default async function Content({ searchParams }: { searchParams: { error?: string; fb?: string; why?: string } }) {
  const { sb, tenant } = await getContext()
  const [{ data: items }, { data: products }, { data: fbPages }] = await Promise.all([
    sb.from('content_items').select('id,kind,title,body').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(50),
    sb.from('products').select('id,name').eq('tenant_id', tenant.id).eq('status', 'active'),
    sb.from('fb_pages').select('page_id,name').eq('tenant_id', tenant.id).order('connected_at'),
  ])
  return (
    <>
      <h1 className="text-2xl font-bold">คลังคอนเทนต์</h1>
      <p className="mt-2 text-sm text-ink/70">AI เขียนจากข้อมูลสินค้าจริงของร้าน แต่ละครั้งนับเป็น 1 ข้อความในโควตา ควรอ่านทบทวนก่อนนำไปใช้</p>
      {searchParams.error && <p role="alert" className="mt-4 rounded-md bg-sun/30 p-3 text-sm">{ERR[searchParams.error] ?? 'สร้างคอนเทนต์ไม่สำเร็จ ลองใหม่อีกครั้ง'}{KEY_ERRS.includes(searchParams.error) && <> <a href="/app/ai-keys" className="underline">ไปที่ตั้งค่า API ของ AI</a></>}</p>}
      {searchParams.fb && <p role="status" className={`mt-4 rounded-md p-3 text-sm ${searchParams.fb === 'posted' ? 'bg-brand/10' : 'bg-sun/30'}`}>{searchParams.fb === 'posted' ? 'โพสต์ลงเพจ Facebook แล้ว' : `โพสต์ลงเพจไม่สำเร็จ${searchParams.why && FB_ERR[searchParams.why] ? ' — ' + FB_ERR[searchParams.why] : ''}`}</p>}
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
            {fbPages?.length ? (
              <form action={postToPage} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="id" value={i.id} />
                <select name="page_id" aria-label="เลือกเพจ" className="input w-auto py-1">{fbPages.map((f) => <option key={f.page_id} value={f.page_id}>{f.name}</option>)}</select>
                <button className="btn-ghost py-1">📘 โพสต์ลงเพจ</button>
              </form>
            ) : <p className="mt-2 text-xs text-ink/60">อยากโพสต์ลง Facebook? <Link href="/app/pages" className="underline">เชื่อมเพจที่เมนูเซลเพจ</Link></p>}
          </li>
        ))}
      </ul>
    </>
  )
}
