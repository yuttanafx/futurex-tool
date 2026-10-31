import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { baht } from "@/lib/fmt"
import { dt, dtm, fmtAmount, INVOICE_STATUS, type Method } from "@/lib/billing"
export const dynamic = "force-dynamic"
const UUID = /^[0-9a-f-]{36}$/i
async function adjust(fd: FormData) {
  "use server"
  const id = String(fd.get("id")), unit = String(fd.get("unit")), sign = fd.get("sign") === "-" ? -1 : 1
  const amt = Number(fd.get("amount"))
  if (!UUID.test(id) || !["wallet", "pv"].includes(unit) || !Number.isFinite(amt) || amt <= 0) return
  const { error } = await createClient().rpc("admin_adjust_balance", { p_tenant: id, p_unit: unit, p_amount: sign * amt, p_reason: String(fd.get("reason") || "").slice(0, 150) })
  if (error) console.error("admin_adjust_balance failed:", error.message)
  revalidatePath(`/admin/shops/${id}`)
}
async function extend(fd: FormData) {
  "use server"
  const id = String(fd.get("id")), days = Math.trunc(Number(fd.get("days")))
  if (!UUID.test(id) || !Number.isFinite(days) || days === 0) return
  const { error } = await createClient().rpc("admin_adjust_paid_until", { p_tenant: id, p_days: days })
  if (error) console.error("admin_adjust_paid_until failed:", error.message)
  revalidatePath(`/admin/shops/${id}`)
}
const ST: Record<string, string> = { new: "ใหม่", confirmed: "ยืนยันแล้ว", shipped: "จัดส่งแล้ว", done: "สำเร็จ", cancelled: "ยกเลิก" }
const PAY: Record<string, string> = { unpaid: "ยังไม่ชำระ", paid: "ชำระแล้ว", refunded: "คืนเงินแล้ว" }
const M: Record<string, string> = { promptpay: "พร้อมเพย์", bank: "โอนธนาคาร", cod: "ปลายทาง", later: "ภายหลัง" }
export default async function ShopDetail({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound()
  const { data } = await createClient().rpc("admin_shop_detail", { p_id: params.id })
  const d: any = data
  if (!d) notFound()
  const s = d.shop
  const sb = createClient()
  const [{ data: tb }, { data: invs }] = await Promise.all([
    sb.from("tenant_billing").select("wallet,pv,paid_until").eq("tenant_id", params.id).maybeSingle(),
    sb.from("billing_invoices").select("id,invoice_no,kind,method,plan_id,months,amount,status,created_at").eq("tenant_id", params.id).order("created_at", { ascending: false }).limit(8),
  ])
  const K: [string, string][] = [
    ["ยอดขายรวม", baht(Number(d.sales))], ["ชำระแล้ว", baht(Number(d.paid_sales))], ["ออเดอร์", `${d.orders}`], ["ลูกค้า", `${d.customers}`],
    ["สินค้า (เปิดขาย)", `${d.products} (${d.active_products})`], ["AI วันนี้", `${d.ai_used_today ?? 0}`],
  ]
  return (
    <>
      <Link href="/admin" className="text-sm text-brand underline">← ภาพรวมทุกร้าน</Link>
      <h1 className="mt-2 text-2xl font-bold">{s.name} {s.status !== "active" && <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 align-middle text-xs text-white">ถูกระงับ</span>}</h1>
      <p className="text-sm text-ink/60">เจ้าของ {s.owner_email ?? "-"} · แพ็กเกจ {s.plan_id} · /s/{s.slug} · ช่องทางรับเงิน: {[s.promptpay && "พร้อมเพย์", s.bank && "ธนาคาร", s.cod && "ปลายทาง"].filter(Boolean).join(", ") || "ยังไม่ตั้งค่า"}</p>
      {s.status === "active" && <Link href={`/s/${encodeURIComponent(s.slug)}`} target="_blank" className="mt-1 inline-block text-sm text-brand underline">เปิดหน้าร้าน</Link>}
      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 [&>div]:card">{K.map(([k, v]) => <div key={k}><dt className="text-sm text-ink/60">{k}</dt><dd className="text-2xl font-bold">{v}</dd></div>)}</dl>
      <section className="card mt-6">
        <h2 className="font-bold">ค่าบริการ · วอลเล็ต · PV</h2>
        <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div><dt className="text-ink/60">วอลเล็ต</dt><dd className="text-xl font-bold">{baht(Number(tb?.wallet ?? 0))}</dd></div>
          <div><dt className="text-ink/60">PV</dt><dd className="text-xl font-bold">{Number(tb?.pv ?? 0).toLocaleString("th-TH")}</dd></div>
          <div><dt className="text-ink/60">ใช้งานได้ถึง</dt><dd className="text-xl font-bold">{tb?.paid_until ? dt(tb.paid_until) : "ยังไม่ได้ชำระ"}</dd></div>
        </dl>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <form action={adjust} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={s.id} />
            <select name="unit" aria-label="ประเภท" className="input w-auto"><option value="wallet">วอลเล็ต</option><option value="pv">PV</option></select>
            <select name="sign" aria-label="เพิ่ม/ลด" className="input w-auto"><option value="+">เพิ่ม</option><option value="-">ลด</option></select>
            <input name="amount" type="number" min="0.01" step="0.01" required placeholder="จำนวน" className="input w-28" />
            <input name="reason" placeholder="เหตุผล" className="input min-w-[120px] flex-1" />
            <button className="btn">ปรับยอด</button>
          </form>
          <form action={extend} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={s.id} />
            <input name="days" type="number" step="1" required placeholder="จำนวนวัน (ลบ = ลดวัน)" className="input w-48" />
            <button className="btn-ghost">เพิ่ม/ลดวันใช้งาน</button>
          </form>
        </div>
        <ul className="mt-4 divide-y divide-ink/10 text-sm">
          {!invs?.length && <li className="py-2 text-ink/60">ยังไม่มีใบแจ้งหนี้</li>}
          {invs?.map((i) => <li key={i.id} className="flex justify-between gap-2 py-2"><span>#{i.invoice_no} · {i.kind === "topup" ? "เติมวอลเล็ต" : `${i.plan_id} ${i.months} เดือน`} · {INVOICE_STATUS[i.status]} · {dtm(i.created_at)}</span><span>{fmtAmount(Number(i.amount), i.method as Method)}</span></li>)}
        </ul>
      </section>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="card"><h2 className="font-bold">สินค้าขายดี</h2>
          <ul className="mt-3 divide-y divide-ink/10 text-sm">{!d.top_products.length && <li className="py-3 text-ink/60">ยังไม่มียอดขาย</li>}
            {d.top_products.map((p: any) => <li key={p.name} className="flex justify-between py-2"><span>{p.name} ×{p.qty}</span><span>{baht(Number(p.revenue))}</span></li>)}</ul></section>
        <section className="card"><h2 className="font-bold">ออเดอร์ล่าสุด</h2>
          <ul className="mt-3 divide-y divide-ink/10 text-sm">{!d.recent_orders.length && <li className="py-3 text-ink/60">ยังไม่มีออเดอร์</li>}
            {d.recent_orders.map((o: any) => <li key={o.order_no} className="flex justify-between gap-2 py-2"><span>#{o.order_no} · {ST[o.status]} · {PAY[o.payment_status]} · {M[o.payment_method]}</span><span>{baht(Number(o.total))}</span></li>)}</ul></section>
      </div>
    </>
  )
}
