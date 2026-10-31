import Link from 'next/link'
import type { SupabaseClient } from '@supabase/supabase-js'
import { dt } from '@/lib/billing'
// แถบแจ้งเตือนวันครบกำหนดชำระค่าบริการ (แสดงเฉพาะเมื่อแอดมินตั้งราคาที่ต้องเก็บ)
export default async function BillingBanner({ sb, tenantId, plan }: { sb: SupabaseClient; tenantId: string; plan: string }) {
  const [{ data: tb }, { data: prices }] = await Promise.all([
    sb.from('tenant_billing').select('paid_until').eq('tenant_id', tenantId).maybeSingle(),
    sb.from('billing_prices').select('code,price_thb,price_pv,price_wallet').eq('active', true).in('code', ['site', `plan_${plan}`]),
  ])
  const chargeable = (prices ?? []).some((p: any) => Number(p.price_thb) + Number(p.price_pv) + Number(p.price_wallet) > 0)
  if (!chargeable) return null
  const until = tb?.paid_until ? new Date(tb.paid_until) : null
  const left = until ? Math.ceil((until.getTime() - Date.now()) / 864e5) : null
  if (left !== null && left > 7) return null
  const [tone, msg] = left === null ? ['bg-sun/30', 'ยังไม่ได้ชำระค่าบริการรายเดือน']
    : left < 0 ? ['bg-red-600/20', `ค่าบริการหมดอายุแล้วเมื่อ ${dt(tb!.paid_until)}`]
    : ['bg-sun/30', `ค่าบริการจะครบกำหนดใน ${left} วัน (${dt(tb!.paid_until)})`]
  return (
    <p role="status" className={`mb-4 flex flex-wrap items-center gap-3 rounded-md p-3 text-sm ${tone}`}>
      <span>{msg}</span><Link href="/app/billing" className="underline">ไปหน้าชำระค่าบริการ</Link>
    </p>
  )
}
