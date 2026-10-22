import { getContext } from "@/lib/tenant"
import { baht, bkkDay } from "@/lib/fmt"
export default async function Dashboard() {
  const { sb, tenant } = await getContext()
  const since = new Date(Date.now() - 7 * 864e5).toISOString()
  const [{ data: orders }, { count: cust }] = await Promise.all([
    sb.from("orders").select("total,created_at,status").gte("created_at", since).neq("status", "cancelled"),
    sb.from("customers").select("*", { count: "exact", head: true }).gte("created_at", since),
  ])
  const days = Array.from({ length: 7 }, (_, i) => bkkDay(new Date(Date.now() - (6 - i) * 864e5)))
  const sums = days.map((d) => (orders ?? []).filter((o) => bkkDay(o.created_at) === d).reduce((a, o) => a + Number(o.total), 0))
  const max = Math.max(...sums, 1), today = days[6]
  const list = orders ?? []
  return (
    <>
      <p className="text-xs text-ink/60">WORKSPACE / OVERVIEW</p>
      <h1 className="text-2xl font-bold">Sales Command Center</h1>
      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 [&>div]:card">
        <div><dt className="text-sm text-ink/60">ยอดขายวันนี้</dt><dd className="text-2xl font-bold">{baht(sums[6])}</dd></div>
        <div><dt className="text-sm text-ink/60">คำสั่งซื้อวันนี้</dt><dd className="text-2xl font-bold">{list.filter((o) => bkkDay(o.created_at) === today).length}</dd></div>
        <div><dt className="text-sm text-ink/60">ยอดขาย 7 วัน</dt><dd className="text-2xl font-bold">{baht(sums.reduce((a, b) => a + b, 0))}</dd></div>
        <div><dt className="text-sm text-ink/60">ลูกค้าใหม่ 7 วัน</dt><dd className="text-2xl font-bold">{cust ?? 0}</dd></div>
      </dl>
      <div className="card mt-6 flex h-48 items-end gap-3" role="img" aria-label="ยอดขายรายวัน 7 วันล่าสุด">
        {sums.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t bg-brand" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 4 : 1 }} title={baht(v)} />
            <span className="text-xs text-ink/60">{days[i].slice(5)}</span>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink/70">ลิงก์หน้าร้านของคุณ: <code>/s/{tenant.slug}</code></p>
    </>
  )
}
