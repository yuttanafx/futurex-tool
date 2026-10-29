import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
export const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'shop'
const SEL = 'role, tenants(id,name,slug)'
// tenant_id มาจาก session + DB เสมอ ไม่รับจาก client
export async function getContext() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  let { data: m, error: e1 } = await sb.from('tenant_members').select(SEL).eq('user_id', user.id).limit(1).maybeSingle()
  if (e1) console.error('tenant_members select failed:', e1.message)
  if (!m) {
    const name = String(user.user_metadata?.shop_name || 'ร้านของฉัน')
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`
    const ref = user.user_metadata?.ref_code || null
    let { error } = await sb.rpc('create_tenant', { p_name: name, p_slug: slug, p_ref: ref })
    // ฐานข้อมูลที่ยังไม่ได้รัน 007 จะมี create_tenant แบบ 2 พารามิเตอร์ → ลองใหม่แบบเดิม
    if (error && /function|schema cache/i.test(error.message)) {
      ;({ error } = await sb.rpc('create_tenant', { p_name: name, p_slug: slug }))
    }
    // หน้า layout กับ page เรียก getContext พร้อมกันตอนเข้าครั้งแรก ฝั่งที่มาช้าจะเจอ 'already has tenant' → ถือว่าร้านถูกสร้างแล้ว ให้อ่านซ้ำแทนการเด้งออก
    if (error && /already has tenant/i.test(error.message)) error = null
    if (error) {
      console.error('create_tenant failed:', error.message)
      redirect('/login?error=' + encodeURIComponent('สร้างร้านไม่สำเร็จ: ' + error.message))
    }
    let e2
    ;({ data: m, error: e2 } = await sb.from('tenant_members').select(SEL).eq('user_id', user.id).limit(1).maybeSingle())
    if (e2) {
      console.error('tenant_members re-select failed:', e2.message)
      redirect('/login?error=' + encodeURIComponent('อ่านข้อมูลร้านไม่สำเร็จ: ' + e2.message))
    }
  }
  const tenant = (m as any)?.tenants as { id: string; name: string; slug: string } | undefined
  if (!m || !tenant) {
    console.error('tenant lookup empty after create_tenant', { user: user.id })
    redirect('/login?error=' + encodeURIComponent('โหลดข้อมูลร้านไม่สำเร็จ (ตรวจ migration/RLS ของตาราง tenants และ tenant_members)'))
  }
  return { sb, user, tenant, role: (m as any).role as string }
}
