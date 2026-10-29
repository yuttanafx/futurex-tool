// ทดสอบสิทธิ์ข้าม Tenant: สร้างผู้ใช้ทดสอบ 2 ราย (A, B) แล้วลองให้ B/anon เข้าถึงข้อมูลของ A
// รัน: npm run test:rls  (ต้องมี .env.local ที่มี URL, ANON key, SERVICE_ROLE key) · ใช้กับโปรเจกต์ทดสอบ ไม่ใช่ข้อมูลจริง
import { createClient } from '@supabase/supabase-js'
const { NEXT_PUBLIC_SUPABASE_URL: URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON, SUPABASE_SERVICE_ROLE_KEY: SVC } = process.env
if (!URL || !ANON || !SVC) { console.error('ต้องตั้งค่า NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY'); process.exit(2) }
const mk = (k) => createClient(URL, k, { auth: { persistSession: false, autoRefreshToken: false } })
const admin = mk(SVC), anon = mk(ANON), run = Date.now().toString(36)
let fail = 0
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + extra}`); if (!ok) fail++ }
const none = (r) => !!r.error || r.data == null || (Array.isArray(r.data) && r.data.length === 0)
const denied = (r) => !!r.error
const created = { tenants: [], users: [] }
async function makeUser(tag, ref = null) {
  const email = `rls-${tag}-${run}@example.test`, password = `Pw-${run}-${tag}-xyz`
  const u = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (u.error) throw u.error
  created.users.push(u.data.user.id)
  const c = mk(ANON)
  const s = await c.auth.signInWithPassword({ email, password }); if (s.error) throw s.error
  const t = await c.rpc('create_tenant', { p_name: `T-${tag}`, p_slug: `rls-${tag}-${run}`, p_ref: ref }); if (t.error) throw t.error
  created.tenants.push(t.data)
  return { c, tenant: t.data }
}
try {
  const A = await makeUser('a'), B = await makeUser('b')
  // --- ร้านใหม่มีหน้าร้าน + สินค้าตัวอย่าง และแยกรายร้าน (011) ---
  const cnt = async (t) => (await admin.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', t).like('sku', 'SAMPLE-%')).count
  check('ร้านใหม่ A มีสินค้าตัวอย่าง 7 รายการ', (await cnt(A.tenant)) === 7)
  check('ร้านใหม่ B มีสินค้าตัวอย่าง 7 รายการ', (await cnt(B.tenant)) === 7)
  const starterIds = new Set(((await admin.from('products').select('id').in('tenant_id', [A.tenant, B.tenant])).data ?? []).map((p) => p.id))
  check('สินค้าตัวอย่างของ A และ B เป็นคนละแถวกัน (14 แถว)', starterIds.size === 14)
  const ta = (await admin.from('tenants').select('tagline,about,banner_url').eq('id', A.tenant).single()).data
  check('ร้านใหม่มีสโลแกน/เกี่ยวกับร้าน/แบนเนอร์เริ่มต้น', !!ta?.tagline && !!ta?.about && ta?.banner_url === '/starter/banner.jpg')
  const sa = (await A.c.from('products').select('id').eq('tenant_id', A.tenant).eq('sku', 'SAMPLE-01').single()).data
  await A.c.from('products').update({ name: 'A-edited', price: 999 }).eq('id', sa.id)
  check('A แก้สินค้าตัวอย่างของตัวเองได้', (await admin.from('products').select('name').eq('id', sa.id).single()).data?.name === 'A-edited')
  check('การแก้ของ A ไม่กระทบสินค้าตัวอย่างของ B', (await admin.from('products').select('name').eq('tenant_id', B.tenant).eq('sku', 'SAMPLE-01').single()).data?.name !== 'A-edited')
  check('เรียก seed_starter_shop จากเบราว์เซอร์ไม่ได้ (anon และล็อกอิน)', denied(await anon.rpc('seed_starter_shop', { p_tenant: A.tenant, p_site: true })) && denied(await B.c.rpc('seed_starter_shop', { p_tenant: A.tenant, p_site: true })))
  check('anon เรียก load_starter_products ไม่ได้', denied(await anon.rpc('load_starter_products')))
  const again = await B.c.rpc('load_starter_products')
  check('ร้านที่มีสินค้าแล้วกดโหลดสินค้าตัวอย่าง → ไม่เพิ่มซ้ำ', !again.error && again.data === 0, again.error?.message)
  // หมายเหตุ: สินค้า active ของทุกร้านอ่านสาธารณะได้โดยออกแบบ (หน้าร้าน) ฝั่งแดชบอร์ดจึงต้องกรอง tenant เสมอ → ตรวจด้วย npm run check:tenant

  // --- เตรียมข้อมูลของ A ---
  const prod = (await A.c.from('products').insert({ tenant_id: A.tenant, name: 'A-active', price: 100 }).select('id').single()).data
  const hidden = (await A.c.from('products').insert({ tenant_id: A.tenant, name: 'A-hidden', price: 100, status: 'hidden' }).select('id').single()).data
  const draft = (await A.c.from('sales_pages').insert({ tenant_id: A.tenant, title: 'A-draft', slug: 'a-draft' }).select('id').single()).data
  await A.c.from('sales_pages').insert({ tenant_id: A.tenant, title: 'A-pub', slug: 'a-pub', status: 'published' })
  await A.c.from('content_items').insert({ tenant_id: A.tenant, kind: 'post', title: 'x', body: 'x' })
  await A.c.from('nfc_cards').insert({ tenant_id: A.tenant, slug: `n-${run}`, label: 'x' })
  const ord = await anon.rpc('place_order', { p_tenant: A.tenant, p_product: prod.id, p_qty: 1, p_name: 'ลูกค้าทดสอบ', p_phone: '000' })
  check('[ควบคุม] ลูกค้า anon สั่งซื้อสินค้าที่แสดงอยู่ได้', !ord.error, ord.error?.message)
  const order = (await A.c.from('orders').select('id,customer_id').limit(1).single()).data
  const cust = order?.customer_id
  const conv = (await admin.from('conversations').insert({ tenant_id: A.tenant, needs_human: true }).select('id').single()).data
  await admin.from('messages').insert({ conversation_id: conv.id, tenant_id: A.tenant, sender_type: 'customer', content: 'hi' })
  await admin.from('ai_usage').insert({ tenant_id: A.tenant, model: 'm', usage_units: 1 })
  await admin.from('ai_agents').insert({ tenant_id: A.tenant, instructions: 'secret-instr' })
  await admin.from('integrations').insert({ tenant_id: A.tenant, provider: 'line' })
  await admin.from('integration_secrets').insert({ tenant_id: A.tenant, provider: 'line', secret: 's' })
  await admin.from('webhook_events').insert({ provider: 'line', event_id: `e-${run}`, tenant_id: A.tenant })
  check('[ควบคุม] A เห็นข้อมูลของตัวเอง', (await A.c.from('orders').select('id')).data?.length === 1 && (await A.c.from('sales_pages').select('id')).data?.length === 2)

  // --- B อ่านข้อมูลของ A ไม่ได้ ---
  for (const t of ['orders', 'order_items', 'customers', 'content_items', 'nfc_cards', 'conversations', 'messages', 'ai_usage', 'ai_agents', 'integrations', 'integration_secrets', 'webhook_events', 'rate_limits'])
    check(`B อ่านตาราง ${t} ของ A ไม่ได้`, none(await B.c.from(t).select('*')))
  const bp = (await B.c.from('sales_pages').select('title')).data ?? []
  check('B ไม่เห็นเพจฉบับร่างของ A', !bp.some((p) => p.title === 'A-draft'))
  check('B ไม่เห็นสินค้าที่ซ่อนของ A', !((await B.c.from('products').select('id')).data ?? []).some((p) => p.id === hidden.id))
  check('B ดู tenant_members ของ A ไม่ได้', none(await B.c.from('tenant_members').select('*').eq('tenant_id', A.tenant)))

  // --- B แก้/ลบข้อมูลของ A ไม่ได้ ---
  check('B แก้เพจของ A ไม่ได้', none(await B.c.from('sales_pages').update({ title: 'hacked' }).eq('id', draft.id).select()))
  check('B ลบสินค้าของ A ไม่ได้', none(await B.c.from('products').delete().eq('id', prod.id).select()))
  check('B แก้ข้อมูลร้านของ A ไม่ได้', none(await B.c.from('tenants').update({ name: 'hacked' }).eq('id', A.tenant).select()))
  check('สินค้าและเพจของ A ยังอยู่ครบ', (await admin.from('products').select('id').eq('id', prod.id)).data?.length === 1 && (await admin.from('sales_pages').select('title').eq('id', draft.id).single()).data?.title === 'A-draft')

  // --- B เขียนข้อมูลลง tenant ของ A / อ้างอิงข้ามร้านไม่ได้ ---
  check('B สร้างเพจใน tenant ของ A ไม่ได้', denied(await B.c.from('sales_pages').insert({ tenant_id: A.tenant, title: 'x', slug: 'x' })))
  check('B สร้างสินค้าใน tenant ของ A ไม่ได้', denied(await B.c.from('products').insert({ tenant_id: A.tenant, name: 'x', price: 1 })))
  check('B ส่งข้อความ staff เข้าบทสนทนาของ A ไม่ได้', denied(await B.c.from('messages').insert({ conversation_id: conv.id, tenant_id: B.tenant, sender_type: 'staff', content: 'x' })))
  check('B เพิ่มรายการใน order ของ A ไม่ได้', denied(await B.c.from('order_items').insert({ order_id: order.id, tenant_id: B.tenant, name: 'x', quantity: 1, unit_price: 1 })))
  check('B ผูก order ของตัวเองกับลูกค้าของ A ไม่ได้', denied(await B.c.from('orders').insert({ tenant_id: B.tenant, customer_id: cust, total: 1 })))
  check('B ใช้ role เกินสิทธิ์ใน tenant_members ของ A ไม่ได้', denied(await B.c.from('tenant_members').insert({ tenant_id: A.tenant, user_id: (await B.c.auth.getUser()).data.user.id, role: 'owner' })))
  check('สร้าง tenant ที่สองด้วยบัญชีเดิมไม่ได้', denied(await A.c.rpc('create_tenant', { p_name: 'x', p_slug: `dup-${run}` })))

  // --- ฟังก์ชันภายในต้องเรียกจากเบราว์เซอร์ไม่ได้ ---
  const args = { ai_begin: { t: A.tenant }, ai_log: { t: A.tenant, conv: null, q: 'x', a: 'x', mdl: 'm', units: 0 }, rate_hit: { p_key: 'k', p_limit: 1, p_window: 60 }, nfc_scan: { p_slug: `n-${run}` } }
  for (const [fn, a] of Object.entries(args)) {
    check(`B (ล็อกอิน) เรียก ${fn} ไม่ได้`, denied(await B.c.rpc(fn, a)))
    check(`anon เรียก ${fn} ไม่ได้`, denied(await anon.rpc(fn, a)))
  }
  check('B ดูโควตา AI ของ A ไม่ได้', none(await B.c.rpc('ai_quota', { t: A.tenant })))

  // --- สั่งซื้อสาธารณะต้องไม่ข้ามร้าน ---
  check('สั่งสินค้าของ A โดยระบุร้าน B ไม่ได้', denied(await anon.rpc('place_order', { p_tenant: B.tenant, p_product: prod.id, p_qty: 1, p_name: 'x', p_phone: '1' })))
  check('สั่งสินค้าที่ซ่อนอยู่ไม่ได้', denied(await anon.rpc('place_order', { p_tenant: A.tenant, p_product: hidden.id, p_qty: 1, p_name: 'x', p_phone: '1' })))

  // --- ตะกร้าหลายสินค้า + ลิงก์แนะนำ ---
  const p2 = (await A.c.from('products').insert({ tenant_id: A.tenant, name: 'A-2', price: 50 }).select('id').single()).data
  const bCode = (await B.c.from('tenants').select('ref_code').eq('id', B.tenant).single()).data.ref_code
  const cart = await anon.rpc('place_order_cart', { p_tenant: A.tenant, p_items: [{ product: prod.id, qty: 2 }, { product: p2.id, qty: 1 }], p_name: 'x', p_phone: '1', p_ref: bCode })
  check('[ควบคุม] สั่งหลายสินค้าในตะกร้าเดียวได้', !cart.error, cart.error?.message)
  const co = (await A.c.from('orders').select('id,total,referrer_tenant_id').eq('order_no', cart.data).single()).data
  check('ยอดรวมตะกร้าคำนวณจากราคาในฐานข้อมูล (250)', Number(co?.total) === 250)
  check('ตะกร้าผูกกับผู้แนะนำ B', co?.referrer_tenant_id === B.tenant)
  await A.c.from('orders').update({ referrer_tenant_id: A.tenant }).eq('id', co.id)
  check('เจ้าของร้านแก้ผู้แนะนำของ order ไม่ได้', (await admin.from('orders').select('referrer_tenant_id').eq('id', co.id).single()).data?.referrer_tenant_id === B.tenant)
  check('ตะกร้าข้ามร้านไม่ได้', denied(await anon.rpc('place_order_cart', { p_tenant: B.tenant, p_items: [{ product: prod.id, qty: 1 }], p_name: 'x', p_phone: '1' })))
  check('ตะกร้าที่มีสินค้าซ้ำถูกปฏิเสธ', denied(await anon.rpc('place_order_cart', { p_tenant: A.tenant, p_items: [{ product: prod.id, qty: 1 }, { product: prod.id, qty: 1 }], p_name: 'x', p_phone: '1' })))
  await makeUser('c', bCode)
  const bs = (await B.c.rpc('referral_stats', { t: B.tenant })).data
  check('B ได้ผลงานจากยอดขายและตัวแทนใหม่ที่สมัครผ่านลิงก์', bs?.orders === 1 && Number(bs?.sales) === 250 && bs?.signups === 1, JSON.stringify(bs))
  check('A ดูผลงานของ B ไม่ได้', none(await A.c.rpc('referral_stats', { t: B.tenant })))
  check('anon อ่านตาราง referrals ไม่ได้', none(await anon.from('referrals').select('*')))

  // --- ผู้เยี่ยมชม (anon) ---
  const ap = (await anon.from('sales_pages').select('title')).data ?? []
  check('anon เห็นเฉพาะเพจที่เผยแพร่แล้ว', ap.some((p) => p.title === 'A-pub') && !ap.some((p) => p.title === 'A-draft'))
  for (const t of ['orders', 'customers', 'messages', 'conversations', 'content_items', 'ai_agents', 'integration_secrets', 'tenant_members'])
    check(`anon อ่านตาราง ${t} ไม่ได้`, none(await anon.from(t).select('*')))
  check('anon สร้างสินค้าไม่ได้', denied(await anon.from('products').insert({ tenant_id: A.tenant, name: 'x', price: 1 })))
} catch (e) {
  console.error('ชุดทดสอบหยุดกลางคัน:', e?.message ?? e); fail++
} finally {
  for (const t of created.tenants) await admin.from('tenants').delete().eq('id', t)
  for (const u of created.users) await admin.auth.admin.deleteUser(u)
  console.log(fail ? `\nไม่ผ่าน ${fail} รายการ — ห้ามเปิดใช้จริงจนกว่าจะแก้` : '\nผ่านทั้งหมด')
  process.exit(fail ? 1 : 0)
}
