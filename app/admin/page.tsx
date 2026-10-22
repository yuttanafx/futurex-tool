import Link from "next/link"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { baht } from "@/lib/fmt"
export const dynamic = "force-dynamic"
const PLANS = ["free", "starter", "pro", "business"]
async function update(fd: FormData) {
  "use server"
  const plan = String(fd.get("plan")), status = String(fd.get("status"))
  await createClient().rpc("admin_update_tenant", { p_id: String(fd.get("id")), p_status: status, p_plan: plan })
  revalidatePath("/admin")
}
const dt = (s?: string | null) => (s ? new Date(s).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" }) : "-")
export default async function Admin({ searchParams }: { searchParams: { q?: string } }) {
  const sb = createClient()
  const [{ data: o }, { data: shops }] = await Promise.all([sb.rpc("admin_overview"), sb.rpc("admin_shops")])
  const ov: any = o ?? {}
  const q = (searchParams.q ?? "").trim().toLowerCase()
  const list = ((shops as any[]) ?? []).filter((s) => !q || `${s.name} ${s.slug} ${s.owner_email ?? ""}`.toLowerCase().includes(q))
  const daily: any[] = ov.daily ?? []
  const max = Math.max(...daily.map((d) => Number(d.sales)), 1)
  const K: [string, string][] = [
    ["ร้านทั้งหมด", `${ov.shops ?? 0}`], ["ร้านที่เปิดอยู่", `${ov.active_shops ?? 0}`], ["ร้านใหม่ 7 วัน", `${ov.new_shops_7d ?? 0}`], ["สินค้าทั้งหมด", `${ov.products ?? 0}`],
    ["ออเดอร์ทั้งหมด", `${ov.orders ?? 0}`], ["ยอดขายรวม", baht(Number(ov.sales ?? 0))], ["ยอดขาย 30 วัน", baht(Number(ov.sales_30d ?? 0))], ["ชำระแล้ว", baht(Number(ov.paid_sales ?? 0))],
  ]
  return (
    <>
      <p className="text-xs text-ink/60">PLATFORM / OVERVIEW</p>
      <h1 className="text-2xl font-bold">ภาพรวมทุกร้านค้า</h1>
      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 [&>div]:card">
        {K.map(([k, v]) => <div key={k}><dt className="text-sm text-ink/60">{k}</dt><dd className="text-2xl font-bold">{v}</dd></div>)}
      </dl>
      <section className="card mt-6">
        <h2 className="font-bold">ยอดขายรวมทุกร้าน 14 วันล่าสุด</h2>
        <div className="mt-4 flex h-40 items-end gap-2" role="img" aria-label="ยอดขายรายวัน">
          {daily.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-brand" style={{ height: `${(Number(d.sales) / max) * 100}%`, minHeight: Number(d.sales) ? 4 : 1 }} title={`${d.day}: ${baht(Number(d.sales))} · ${d.orders} ออเดอร์ · ร้านใหม่ ${d.shops}`} />
              <span className="text-[10px] text-ink/60">{String(d.day).slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink/60">แพ็กเกจ: {PLANS.map((p) => `${p} ${ov.plans?.[p] ?? 0}`).join(" · ")}</p>
      </section>
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">ร้านค้าทั้งหมด ({list.length})</h2>
          <form className="flex gap-2"><input name="q" defaultValue={searchParams.q} placeholder="ค้นหาชื่อร้าน / อีเมลเจ้าของ" className="input w-64" /><button className="btn">ค้นหา</button></form>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/5 text-xs text-ink/60"><tr>{["ร้าน", "เจ้าของ", "สมัครเมื่อ", "สินค้า", "ออเดอร์", "ยอดขายรวม", "30 วัน", "ออเดอร์ล่าสุด", "แพ็กเกจ / สถานะ"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-ink/10">
              {!list.length && <tr><td colSpan={9} className="px-3 py-8 text-center text-ink/60">ยังไม่มีร้านค้า</td></tr>}
              {list.map((s) => (
                <tr key={s.id} className={s.status !== "active" ? "opacity-60" : ""}>
                  <td className="px-3 py-3"><Link href={`/admin/shops/${s.id}`} className="font-medium text-brand underline">{s.name}</Link><div className="text-xs text-ink/50">/s/{s.slug}</div></td>
                  <td className="px-3 py-3">{s.owner_email ?? "-"}</td>
                  <td className="px-3 py-3">{dt(s.created_at)}</td>
                  <td className="px-3 py-3">{s.products}</td>
                  <td className="px-3 py-3">{s.orders}</td>
                  <td className="px-3 py-3 font-medium">{baht(Number(s.sales))}</td>
                  <td className="px-3 py-3">{baht(Number(s.sales_30d))}</td>
                  <td className="px-3 py-3">{dt(s.last_order_at)}</td>
                  <td className="px-3 py-3">
                    <form action={update} className="flex gap-1">
                      <input type="hidden" name="id" value={s.id} />
                      <select name="plan" defaultValue={s.plan_id} className="input w-auto py-1">{PLANS.map((p) => <option key={p}>{p}</option>)}</select>
                      <select name="status" defaultValue={s.status} className="input w-auto py-1"><option value="active">เปิด</option><option value="suspended">ระงับ</option></select>
                      <button className="btn-ghost py-1">บันทึก</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
