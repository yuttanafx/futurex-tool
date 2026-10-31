import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getContext, slugify } from '@/lib/tenant'
import { admin } from '@/lib/supabase/admin'
import { FB_ERR, FbError, fbOauthConfigured, fbStorable, pageFromToken, pageToken, publishPost, savePage, subscribePage } from '@/lib/facebook'
export const dynamic = 'force-dynamic'
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

// ===== Facebook Pages: เก็บเพจไว้ในร้านเพื่อโพสต์คอนเทนต์ / ให้ AI ตอบแชท =====
const FB_MSG: Record<string, string> = {
  ok: 'เชื่อมเพจสำเร็จ', denied: 'คุณยกเลิกการอนุญาตบน Facebook', state: 'ลิงก์หมดอายุหรือไม่ถูกต้อง ลองกดเชื่อมเพจใหม่', nopages: 'ไม่พบเพจที่อนุญาต ลองเชื่อมใหม่แล้วเลือกเพจที่ต้องการ',
  failed: 'เชื่อมเพจไม่สำเร็จ ลองใหม่อีกครั้ง', forbidden: 'เฉพาะเจ้าของร้าน/แอดมินร้านที่เชื่อมเพจได้', not_configured: 'ระบบยังไม่ได้ตั้งค่าการเชื่อม Facebook (ผู้ดูแลระบบต้องตั้ง FB_APP_ID, FB_APP_SECRET และ AI_KEY_SECRET) — ระหว่างนี้ใช้วิธีวาง Page Access Token ด้านล่างได้',
  taken: 'เพจนี้ถูกเชื่อมกับร้านอื่นแล้ว', bad_token: 'Token ใช้ไม่ได้ ต้องเป็น Page Access Token ของเพจ', posted: 'โพสต์ลงเพจแล้ว', post_failed: 'โพสต์ไม่สำเร็จ', no_secret: 'ยังไม่ได้ตั้ง AI_KEY_SECRET บนเซิร์ฟเวอร์ จึงเก็บ token ไม่ได้',
}
async function connectManual(fd: FormData) {
  'use server'
  const { tenant, role } = await getContext()
  if (!['owner', 'admin'].includes(role)) redirect('/app/pages?fb=forbidden')
  if (!fbStorable()) redirect('/app/pages?fb=no_secret')
  const token = String(fd.get('token') || '').trim()
  if (token.length < 20) redirect('/app/pages?fb=bad_token')
  let res: 'ok' | 'taken' | 'bad_token' | 'failed' = 'ok'
  try {
    const p = await pageFromToken(token)
    res = await savePage(tenant.id, p)
    if (res === 'ok') { try { await subscribePage(p.id, p.token) } catch {} }
  } catch (e) { res = e instanceof FbError ? 'bad_token' : 'failed' }
  revalidatePath('/app/pages')
  redirect(`/app/pages?fb=${res}`)
}
async function disconnectPage(fd: FormData) {
  'use server'
  const { tenant, role } = await getContext()
  if (!['owner', 'admin'].includes(role)) return
  await admin().from('fb_pages').delete().eq('tenant_id', tenant.id).eq('page_id', String(fd.get('page_id')))
  revalidatePath('/app/pages')
}
async function toggleAuto(fd: FormData) {
  'use server'
  const { tenant, role } = await getContext()
  if (!['owner', 'admin'].includes(role)) return
  await admin().from('fb_pages').update({ auto_reply: fd.get('to') === '1' }).eq('tenant_id', tenant.id).eq('page_id', String(fd.get('page_id')))
  revalidatePath('/app/pages')
}
async function postNow(fd: FormData) {
  'use server'
  const { tenant, role } = await getContext()
  if (!['owner', 'admin', 'content'].includes(role)) redirect('/app/pages?fb=forbidden')
  const pageId = String(fd.get('page_id')), message = String(fd.get('message') || '').trim().slice(0, 5000)
  if (!message) return
  const token = await pageToken(tenant.id, pageId) // กรองด้วย tenant เสมอ: โพสต์ได้เฉพาะเพจของร้านตัวเอง
  if (!token) redirect('/app/pages?fb=post_failed')
  try {
    const id = await publishPost(pageId, token, message)
    await admin().from('fb_posts').insert({ tenant_id: tenant.id, page_id: pageId, message, fb_post_id: id || null })
  } catch (e) { redirect(`/app/pages?fb=post_failed&why=${e instanceof FbError ? e.code : 'upstream'}`) }
  redirect('/app/pages?fb=posted')
}

export default async function Pages({ searchParams }: { searchParams: { fb?: string; n?: string; taken?: string; why?: string } }) {
  const { sb, tenant } = await getContext()
  // เพจที่เผยแพร่แล้วของทุกร้านอ่านได้สาธารณะ จึงต้องกรอง tenant เสมอ
  const [{ data: fbPages }, { data: posts }] = await Promise.all([
    sb.from('fb_pages').select('page_id,name,category,picture_url,auto_reply,connected_at').eq('tenant_id', tenant.id).order('connected_at'),
    sb.from('fb_posts').select('id,page_id,message,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(5),
  ])
  const host = headers().get('host')
  const fbMsg = searchParams.fb ? (FB_MSG[searchParams.fb] ?? '') + (searchParams.fb === 'ok' && searchParams.n ? ` ${searchParams.n} เพจ` : '') + (searchParams.taken ? ` (ข้าม ${searchParams.taken} เพจที่ผูกกับร้านอื่น)` : '') + (searchParams.why && FB_ERR[searchParams.why] ? ` — ${FB_ERR[searchParams.why]}` : '') : ''
  const fbGood = searchParams.fb === 'ok' || searchParams.fb === 'posted'
  const { data: pages } = await sb.from('sales_pages').select('id,title,status,seo_title,seo_description').eq('tenant_id', tenant.id).order('created_at', { ascending: false })
  return (
    <>
      <h1 className="text-2xl font-bold">เซลเพจ</h1>
      <section className="card mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">เพจ Facebook ของร้าน</h2>
            <p className="text-xs text-ink/60">เก็บเพจ Facebook ไว้ในระบบ เพื่อโพสต์คอนเทนต์จากคลังคอนเทนต์ และให้ AI ตอบแชท Messenger ของลูกค้า</p>
          </div>
          <a href="/api/v1/facebook/connect" className="btn">📘 เชื่อมเพจ Facebook</a>
        </div>
        {fbMsg && <p role="status" className={`rounded-md p-3 text-sm ${fbGood ? 'bg-brand/10' : 'bg-sun/30'}`}>{fbMsg}</p>}
        {!fbOauthConfigured() && <p className="rounded-md bg-sun/20 p-3 text-xs">ปุ่มเชื่อมอัตโนมัติยังไม่เปิดใช้ (ผู้ดูแลระบบต้องตั้ง <code>FB_APP_ID</code>, <code>FB_APP_SECRET</code>) · ใช้วิธีวาง Page Access Token ด้านล่างแทนได้</p>}
        <ul className="divide-y divide-ink/10">
          {!fbPages?.length && <li className="py-4 text-sm text-ink/60">ยังไม่ได้เชื่อมเพจ กด “เชื่อมเพจ Facebook” แล้วเลือกเพจที่ต้องการ</li>}
          {fbPages?.map((f) => (
            <li key={f.page_id} className="py-4">
              <div className="flex flex-wrap items-center gap-3">
                {f.picture_url ? <img src={f.picture_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/20" aria-hidden>📘</span>}
                <div className="min-w-0 flex-1"><div className="truncate font-medium">{f.name}</div><div className="text-xs text-ink/60">{f.category ?? 'Facebook Page'} · ID {f.page_id}</div></div>
                <form action={toggleAuto} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="page_id" value={f.page_id} /><input type="hidden" name="to" value={f.auto_reply ? '0' : '1'} />
                  <span className={f.auto_reply ? 'text-brand' : 'text-ink/60'}>{f.auto_reply ? 'AI ตอบแชทอยู่' : 'AI ปิดอยู่'}</span>
                  <button className="btn-ghost py-1">{f.auto_reply ? 'ปิด' : 'เปิด AI ตอบแชท'}</button>
                </form>
                <form action={disconnectPage}><input type="hidden" name="page_id" value={f.page_id} /><button className="text-sm underline">ยกเลิกการเชื่อม</button></form>
              </div>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer underline">โพสต์ลงเพจนี้</summary>
                <form action={postNow} className="mt-3 space-y-2">
                  <input type="hidden" name="page_id" value={f.page_id} />
                  <textarea name="message" required rows={4} maxLength={5000} placeholder="ข้อความโพสต์ (หรือคัดลอกจากคลังคอนเทนต์)" aria-label="ข้อความโพสต์" className="input" />
                  <button className="btn">โพสต์เดี๋ยวนี้</button>
                </form>
              </details>
            </li>
          ))}
        </ul>
        {!!posts?.length && (
          <div className="text-xs text-ink/60"><p className="font-medium">โพสต์ล่าสุด</p>
            <ul className="mt-1 space-y-1">{posts.map((p) => <li key={p.id} className="truncate">{new Date(p.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} · {fbPages?.find((f) => f.page_id === p.page_id)?.name ?? p.page_id}: {p.message}</li>)}</ul></div>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer underline">วาง Page Access Token เอง / ตั้งค่า Messenger webhook</summary>
          <form action={connectManual} className="mt-3 flex gap-2">
            <input name="token" type="password" required autoComplete="off" placeholder="Page Access Token" aria-label="Page Access Token" className="input" />
            <button className="btn">เชื่อม</button>
          </form>
          <p className="mt-2 text-xs text-ink/60">Token เก็บเข้ารหัสแยกตามร้านและไม่แสดงกลับ · ผู้ดูแลระบบตั้ง Webhook ของแอด Facebook ครั้งเดียวที่ Callback URL <code className="break-all">https://{host}/api/v1/webhooks/facebook</code> (ติ๊ก <code>messages</code> ของ Page) เพื่อให้ AI ตอบแชท</p>
        </details>
      </section>
      <h2 className="mt-8 font-bold">เซลเพจของร้าน</h2>
      <form action={createPage} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
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
