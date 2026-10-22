import { headers } from 'next/headers'
import { getContext } from '@/lib/tenant'
import { baht } from '@/lib/fmt'
export default async function Referrals() {
  const { sb, tenant } = await getContext()
  const { data: s } = await sb.rpc('referral_stats', { t: tenant.id })
  const host = headers().get('host') ?? ''
  const base = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`
  const links = [
    ['ชวนตัวแทนใหม่สมัคร', `${base}/r/${s.code}`],
    ['แชร์หน้าร้านของฉัน', `${base}/r/${s.code}?to=${encodeURIComponent(`/s/${encodeURIComponent(tenant.slug)}`)}`],
  ]
  const th = (d: string) => new Date(d).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })
  return (
    <>
      <h1 className="text-2xl font-bold">ลิงก์แนะนำ</h1>
      <p className="mt-2 text-sm text-ink/70">แชร์ลิงก์ของคุณไปทำตลาด ยอดสั่งซื้อและตัวแทนใหม่ที่สมัครผ่านลิงก์จะนับเป็นผลงานของคุณ ระบบจำผู้แนะนำคนล่าสุดที่ลูกค้าคลิกภายใน 30 วันบนเบราว์เซอร์เดิม</p>
      <div className="mt-6 space-y-3">
        {links.map(([l, h]) => (
          <label key={l} className="block text-sm">{l}<input readOnly value={h} className="input mt-1" /></label>
        ))}
        <p className="text-xs text-ink/60">แนะนำร้านอื่นได้ด้วยการเติม <code>?to=/s/ชื่อร้าน</code> ท้ายลิงก์ชวนสมัคร</p>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        <div><dt className="text-sm text-ink/60">ยอดขายจากลิงก์</dt><dd className="text-2xl font-bold">{baht(Number(s.sales))}</dd></div>
        <div><dt className="text-sm text-ink/60">ใน 30 วัน</dt><dd className="text-2xl font-bold">{baht(Number(s.sales30))}</dd></div>
        <div><dt className="text-sm text-ink/60">คำสั่งซื้อ</dt><dd className="text-2xl font-bold">{s.orders}</dd></div>
        <div><dt className="text-sm text-ink/60">ตัวแทนใหม่</dt><dd className="text-2xl font-bold">{s.signups}</dd></div>
      </dl>
      <h2 className="mt-10 text-lg font-bold">ตัวแทนที่สมัครผ่านลิงก์ล่าสุด</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {!s.recent_signups.length && <li className="text-ink/60">ยังไม่มี แชร์ลิงก์ชวนสมัครด้านบนได้เลย</li>}
        {s.recent_signups.map((r: any, i: number) => <li key={i}>{r.name} · {th(r.created_at)}</li>)}
      </ul>
      <h2 className="mt-8 text-lg font-bold">คำสั่งซื้อจากลิงก์ล่าสุด</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {!s.recent_orders.length && <li className="text-ink/60">ยังไม่มี แชร์ลิงก์หน้าร้านด้านบนได้เลย</li>}
        {s.recent_orders.map((o: any) => <li key={o.order_no}>#{o.order_no} · {baht(Number(o.total))} · {th(o.created_at)}{o.status === 'cancelled' && ' · ยกเลิก'}</li>)}
      </ul>
    </>
  )
}
